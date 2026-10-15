"""Conservative official-source change monitor (no scraping or auto-publication).

register: explicitly approved HTTPS URL and robots/terms attestation.
check: one URL per request, robots-aware, conditional HTTP GET and ETag,
       1 MiB response limit, no cross-origin redirects, source hash diff.
A changed page produces a human-review event, not a changed court field.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path
from hashlib import sha256
import json
import time
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.robotparser import RobotFileParser
from urllib.error import HTTPError, URLError

from contacts import ImportValidationError
from cli import database_connect
from profile import official_url

USER_AGENT="SudCourtImporter/0.1 (court source verification; human-reviewed)"
MAX_BYTES=1_000_000

class SafeRedirect(HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        if not official_url(newurl):
            raise ImportValidationError("Redirect outside allowed official domains")
        if urlsplit(newurl).hostname != urlsplit(req.full_url).hostname:
            raise ImportValidationError("Cross-host redirect rejected")
        return super().redirect_request(req,fp,code,msg,headers,newurl)


def check_robots(url):
    parts=urlsplit(url)
    robot_url="https://"+parts.hostname+"/robots.txt"
    # Deny on failure: cannot assume crawling is permitted.
    try:
        opener=build_opener(SafeRedirect)
        with opener.open(Request(robot_url,headers={"User-Agent":USER_AGENT}),timeout=8) as response:
            data=response.read(256_001)
        if len(data)>256_000:
            return False
        robot=RobotFileParser()
        robot.parse(data.decode("utf-8",errors="replace").splitlines())
        return robot.can_fetch(USER_AGENT,url)
    except (HTTPError,URLError,OSError,ImportValidationError):
        return False


def fetch(url,etag=None,last_modified=None,include_body=False):
    if not official_url(url):
        raise ImportValidationError("HTTPS official source required")
    if not check_robots(url):
        raise ImportValidationError("robots.txt missing, invalid or disallows access")
    headers={"User-Agent":USER_AGENT,"Accept":"text/html,application/json"}
    if etag:headers["If-None-Match"]=etag
    if last_modified:headers["If-Modified-Since"]=last_modified
    try:
        with build_opener(SafeRedirect).open(Request(url,headers=headers),timeout=10) as response:
            length=response.headers.get("Content-Length")
            if length and int(length)>MAX_BYTES:
                raise ImportValidationError("Source response exceeds maximum size")
            body=response.read(MAX_BYTES+1)
            if len(body)>MAX_BYTES:
                raise ImportValidationError("Source response exceeds maximum size")
            return (200,sha256(body).hexdigest(),response.headers.get("ETag"),
                    response.headers.get("Last-Modified"),body if include_body else None)
    except HTTPError as error:
        if error.code==304:
            return 304,None,etag,last_modified,None
        raise ImportValidationError("Source HTTP status "+str(error.code)) from error


def register(court_id,url,scope,reviewer,cadence):
    if scope not in {"contacts","judges","hours","documents","general"}:
        raise ImportValidationError("Unknown source scope")
    if not official_url(url) or not 24<=cadence<=720:
        raise ImportValidationError("Official HTTPS url and cadence 24-720 hours required")
    if not 2<=len(reviewer.strip())<=120:
        raise ImportValidationError("Reviewer required")
    with database_connect() as conn:
        with conn.transaction():
            if not conn.execute("SELECT 1 FROM courts WHERE id=%s AND status='verified'",(court_id,)).fetchone():
                raise ImportValidationError("Court not verified")
            source=conn.execute("""INSERT INTO sources(url,publisher,source_type)
                 VALUES(%s,%s,%s) ON CONFLICT(url) DO UPDATE
                 SET publisher=excluded.publisher RETURNING id""",
                 (url,"Официальный судебный источник","court-page-monitoring")).fetchone()
            assert source
            row=conn.execute("""INSERT INTO court_source_watch
                (court_id,source_id,watch_url,scope,cadence_hours,
                 permission_confirmed_by,permission_confirmed_at)
                VALUES(%s,%s,%s,%s,%s,%s,now())
                ON CONFLICT(court_id,watch_url,scope) DO NOTHING RETURNING id""",
                (court_id,source[0],url,scope,cadence,reviewer.strip())).fetchone()
    return {"watch_id":row[0] if row else None,"created":bool(row)}


def semantic_source_allowed(scope,url,permission_time,now=None):
    """A monitored contact page needs a recently reviewed operator permission."""
    from official_contact_html import official_hours_url
    if scope not in ('contacts','hours'):
        return False
    try:official_hours_url(url)
    except ImportValidationError:return False
    now=now or datetime.now(timezone.utc)
    if permission_time is None or permission_time.tzinfo is None:
        return False
    return timedelta(0) <= now-permission_time <= timedelta(days=30)


def archive_contact_html(directory:Path,watch_id:int,raw:bytes)->Path:
    """Keep a byte-identical source snapshot; never follow or overwrite symlinks."""
    if not directory.is_dir() or directory.is_symlink():
        raise ImportValidationError("A dedicated non-symlink snapshot directory is required")
    digest=sha256(raw).hexdigest()
    path=directory/("watch-"+str(watch_id)+"-"+digest+".html")
    created=False
    try:
        with path.open("xb") as output:
            created=True
            output.write(raw)
    except FileExistsError:
        if path.is_symlink() or not path.is_file() or path.read_bytes()!=raw:
            raise ImportValidationError("Existing stored snapshot differs from official bytes")
    except OSError:
        if created:path.unlink(missing_ok=True)
        raise
    return path



def renew_permission(watch_id:int,reviewer:str,terms_url:str,basis:str,attested:bool)->dict:
    """Append a named operator declaration; not a substitute for checking law."""
    if (watch_id<1 or not attested or not isinstance(reviewer,str)
        or not 2<=len(reviewer.strip())<=120
        or not isinstance(basis,str) or not 20<=len(basis.strip())<=2000
        or not official_url(terms_url)):
        raise ImportValidationError("Named reviewer, official terms and explicit documented permission required")
    with database_connect() as conn:
        with conn.transaction():
            row=conn.execute(
                """SELECT w.watch_url,w.scope FROM court_source_watch w
                   JOIN courts c ON c.id=w.court_id
                   WHERE w.id=%s AND w.enabled=true AND c.status='verified'
                   FOR UPDATE OF w""",(watch_id,)
            ).fetchone()
            if not row or not official_url(row[0]):
                raise ImportValidationError("Verified, enabled official watch missing")
            result=conn.execute(
                """INSERT INTO court_watch_permission_attestations
                   (watch_id,reviewer,terms_url,permission_basis)
                   VALUES(%s,%s,%s,%s) RETURNING id""",
                (watch_id,reviewer.strip(),terms_url,basis.strip())
            ).fetchone()
            assert result
            conn.execute(
                """UPDATE court_source_watch
                   SET permission_confirmed_by=%s,permission_confirmed_at=now()
                   WHERE id=%s""",(reviewer.strip(),watch_id)
            )
    return {"watch_id":watch_id,"attestation_id":result[0],
            "operator_attestation_only":True,"auto_published":0}


def check(limit=5,semantic_contacts=False,snapshot_dir:Path|None=None):
    if semantic_contacts and snapshot_dir is None:
        raise ImportValidationError("Contact semantic mode requires an archived snapshot directory")
    if not 1<=limit<=20:
        raise ImportValidationError("Limit 1-20 required")
    results=[]
    with database_connect() as conn:
        due=conn.execute("""SELECT id,watch_url,last_sha256,etag,last_modified,cadence_hours,
                                   scope,permission_confirmed_at
            FROM court_source_watch WHERE enabled=true AND next_check_at<=now()
            ORDER BY next_check_at,id LIMIT %s""",(limit,)).fetchall()
    for wid,url,old_sha,etag,lm,hours,scope,permitted_at in due:
        try:
            if semantic_contacts and scope in ('contacts','hours') and not semantic_source_allowed(scope,url,permitted_at):
                raise ImportValidationError("Contact source not approved or permission review older than 30 days")
            record=semantic_contacts and scope in ('contacts','hours')
            status,new_sha,new_etag,new_lm,body=fetch(url,etag,lm,include_body=record)
            if record and body is not None:
                from official_contact_stage import stage as stage_contacts
                assert snapshot_dir is not None
                # Preserve original bytes BEFORE recording semantic differences.
                archive_contact_html(snapshot_dir,wid,body)
                stage_contacts(wid,url,body,datetime.now(timezone.utc).date(),
                               "Automated watch (permission already reviewed)",True)
            with database_connect() as conn:
                with conn.transaction():
                    row=conn.execute("SELECT last_sha256 FROM court_source_watch WHERE id=%s FOR UPDATE",(wid,)).fetchone()
                    if not row:continue
                    old=row[0]
                    if new_sha is not None and old is not None and old!=new_sha:
                        conn.execute("""INSERT INTO court_source_watch_events
                           (watch_id,old_sha256,new_sha256) VALUES(%s,%s,%s)
                           ON CONFLICT(watch_id,new_sha256) DO NOTHING""",(wid,old,new_sha))
                    conn.execute("""UPDATE court_source_watch SET checked_at=now(),
                        next_check_at=now()+(cadence_hours||' hours')::interval,
                        last_sha256=COALESCE(%s,last_sha256),
                        etag=COALESCE(%s,etag),last_modified=COALESCE(%s,last_modified),
                        last_http_status=%s,last_error=NULL WHERE id=%s""",
                        (new_sha,new_etag,new_lm,status,wid))
            results.append({"id":wid,"http_status":status,"changed":bool(new_sha and old_sha and new_sha!=old_sha)})
        except (ImportValidationError,URLError,OSError,ValueError) as exc:
            with database_connect() as conn:
                conn.execute("""UPDATE court_source_watch SET checked_at=now(),
                    next_check_at=now()+interval '24 hours',
                    last_error=%s WHERE id=%s""",(str(exc)[:500],wid))
            results.append({"id":wid,"error":str(exc)[:150]})
        time.sleep(1.5)
    return {"checked":len(results),"results":results,"auto_published":0}


def pending(limit=50):
    if not 1<=limit<=200:
        raise ImportValidationError("Review limit must be 1-200")
    with database_connect() as conn:
        rows=conn.execute("""SELECT e.id,w.court_id,w.scope,w.watch_url,e.detected_at
            FROM court_source_watch_events e
            JOIN court_source_watch w ON w.id=e.watch_id
            WHERE e.status='pending' ORDER BY e.detected_at ASC,e.id LIMIT %s""",
            (limit,)).fetchall()
    return {"pending":len(rows),"events":[
        {"id":r[0],"court_id":r[1],"scope":r[2],"source_url":r[3],
         "detected_at":r[4].isoformat()} for r in rows
    ]}


def review(event_id,reviewer,attested,ignore=False):
    if not attested or not 2<=len(reviewer.strip())<=120:
        raise ImportValidationError("Reviewer and review attestation required")
    with database_connect() as conn:
        with conn.transaction():
            event=conn.execute("""UPDATE court_source_watch_events
                SET status=%s,reviewed_by=%s,reviewed_at=now()
                WHERE id=%s AND status='pending' RETURNING id""",
                ("ignored" if ignore else "reviewed",reviewer.strip(),event_id)).fetchone()
            if event is None:
                raise ImportValidationError("Pending event not found")
    return {"id":event_id,"status":"ignored" if ignore else "reviewed"}


def main():
    p=argparse.ArgumentParser(description="Conservative official-source monitor")
    sub=p.add_subparsers(dest="action",required=True)
    reg=sub.add_parser("register")
    reg.add_argument("--court-id",type=int,required=True)
    reg.add_argument("--url",required=True)
    reg.add_argument("--scope",required=True)
    reg.add_argument("--reviewer",required=True)
    reg.add_argument("--cadence-hours",type=int,default=48)
    reg.add_argument("--attest-permission",action="store_true")
    permission=sub.add_parser("renew-permission")
    permission.add_argument("--watch-id",type=int,required=True)
    permission.add_argument("--reviewer",required=True)
    permission.add_argument("--terms-url",required=True)
    permission.add_argument("--basis",required=True)
    permission.add_argument("--attest-permission",action="store_true")
    c=sub.add_parser("check")
    c.add_argument("--limit",type=int,default=5)
    c.add_argument("--semantic-contacts",action="store_true")
    c.add_argument("--snapshot-dir",type=Path)
    c.add_argument("--attest-automated-processing",action="store_true")
    pending_cmd=sub.add_parser("pending")
    pending_cmd.add_argument("--limit",type=int,default=50)
    review_cmd=sub.add_parser("review")
    review_cmd.add_argument("--event-id",type=int,required=True)
    review_cmd.add_argument("--reviewer",required=True)
    review_cmd.add_argument("--attest-reviewed",action="store_true")
    review_cmd.add_argument("--ignore",action="store_true")
    args=p.parse_args()
    try:
        if args.action=="register":
            if not args.attest_permission:
                raise ImportValidationError("Explicit permissions and robots attestation required")
            result=register(args.court_id,args.url,args.scope,args.reviewer,args.cadence_hours)
        elif args.action=="renew-permission":
            result=renew_permission(args.watch_id,args.reviewer,args.terms_url,
                                    args.basis,args.attest_permission)
        elif args.action=="check":
            if args.semantic_contacts and not args.attest_automated_processing:
                raise ImportValidationError("Separate explicit permission attestation required for contact extraction")
            result=check(args.limit,args.semantic_contacts,args.snapshot_dir)
        elif args.action=="pending":
            result=pending(args.limit)
        else:
            result=review(args.event_id,args.reviewer,args.attest_reviewed,args.ignore)
    except ImportValidationError as exc:
        p.exit(2,str(exc)+"\n")
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
