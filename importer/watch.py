"""Conservative official-source change monitor (no scraping or auto-publication).

register: explicitly approved HTTPS URL and robots/terms attestation.
check: one URL per request, robots-aware, conditional HTTP GET and ETag,
       1 MiB response limit, no cross-origin redirects, source hash diff.
A changed page produces a human-review event, not a changed court field.
"""
from __future__ import annotations
import argparse
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


def fetch(url,etag=None,last_modified=None):
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
            return 200,sha256(body).hexdigest(),response.headers.get("ETag"),response.headers.get("Last-Modified")
    except HTTPError as error:
        if error.code==304:
            return 304,None,etag,last_modified
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


def check(limit=5):
    if not 1<=limit<=20:
        raise ImportValidationError("Limit 1-20 required")
    results=[]
    with database_connect() as conn:
        due=conn.execute("""SELECT id,watch_url,last_sha256,etag,last_modified,cadence_hours
            FROM court_source_watch WHERE enabled=true AND next_check_at<=now()
            ORDER BY next_check_at,id LIMIT %s""",(limit,)).fetchall()
    for wid,url,old_sha,etag,lm,hours in due:
        try:
            status,new_sha,new_etag,new_lm=fetch(url,etag,lm)
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
    c=sub.add_parser("check")
    c.add_argument("--limit",type=int,default=5)
    args=p.parse_args()
    try:
        if args.action=="register":
            if not args.attest_permission:
                raise ImportValidationError("Explicit permissions and robots attestation required")
            result=register(args.court_id,args.url,args.scope,args.reviewer,args.cadence_hours)
        else:
            result=check(args.limit)
    except ImportValidationError as exc:
        p.exit(2,str(exc)+"\n")
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
