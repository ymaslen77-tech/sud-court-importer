"""Stage and manually approve a single field change, with official evidence."""
import argparse
from datetime import datetime, timezone, timedelta
from hashlib import sha256
import json
import math
import re
from urllib.parse import urlsplit

from contacts import ImportValidationError
from cli import database_connect

CORE = frozenset(("name","address","phone","email","official_url"))
EXTRA = frozenset(("reception_hours","office_hours","filing_instructions_url",
                   "jurisdiction_url","bank_details_url","accessibility","transport","coordinates"))
FIELDS = CORE | EXTRA
LINKS = frozenset(("official_url","filing_instructions_url","jurisdiction_url","bank_details_url"))
HOSTS = ("sudrf.ru","msudrf.ru","arbitr.ru","mos-gorsud.ru","pravo.gov.ru")


def official_url(value):
    try:
        u=urlsplit(value)
        host=(u.hostname or "").lower()
        return u.scheme=="https" and not u.username and not u.password and u.port in (None,443) and not u.fragment and any(host==h or host.endswith("."+h) for h in HOSTS)
    except ValueError:
        return False


def validate(field,value):
    if field not in FIELDS or not isinstance(value,str) or not value.strip():
        raise ImportValidationError("Unsupported or empty court field")
    if field=="coordinates":
        try:
            v=json.loads(value)
            if not isinstance(v,dict) or set(v)!={"latitude","longitude"}:
                raise ValueError()
            lat,lon=v["latitude"],v["longitude"]
            if isinstance(lat,bool) or isinstance(lon,bool):
                raise ValueError()
            lat,lon=float(lat),float(lon)
            if not(math.isfinite(lat) and math.isfinite(lon) and -90<=lat<=90 and -180<=lon<=180):
                raise ValueError()
            return json.dumps({"latitude":lat,"longitude":lon},sort_keys=True,separators=(",",":"))
        except (ValueError,TypeError) as exc:
            raise ImportValidationError("Invalid WGS84 coordinates") from exc
    value=" ".join(value.split())
    if len(value)>2000 or any(ord(ch)<32 for ch in value):
        raise ImportValidationError("Invalid text controls or length")
    if field in LINKS and not official_url(value):
        raise ImportValidationError("Court links must be official HTTPS")
    if field=="email" and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+",value):
        raise ImportValidationError("Invalid email")
    if field=="phone" and not re.fullmatch(r"[\d\s()+,.–—/-]{5,300}",value):
        raise ImportValidationError("Invalid phone")
    return value


def propose(court_id,field,value,source_url,observer):
    if not official_url(source_url) or not 2<=len(observer.strip())<=120:
        raise ImportValidationError("Official evidence URL and observer required")
    value=validate(field,value)
    with database_connect() as conn:
        with conn.transaction():
            if not conn.execute("SELECT 1 FROM courts WHERE id=%s AND status='verified'",(court_id,)).fetchone():
                raise ImportValidationError("Court not verified")
            src=conn.execute("""INSERT INTO sources(url,publisher,source_type)
                VALUES(%s,%s,%s) ON CONFLICT(url) DO UPDATE
                SET publisher=excluded.publisher RETURNING id""",
                (source_url,"Официальный судебный источник","court-profile-observation")).fetchone()
            assert src
            row=conn.execute("""INSERT INTO court_profile_candidates
                (court_id,field_name,proposed_value,value_sha256,source_id,observed_at,proposed_by)
                VALUES(%s,%s,%s,%s,%s,now(),%s)
                ON CONFLICT(court_id,field_name,value_sha256,source_id)
                DO NOTHING RETURNING id""",
                (court_id,field,value,sha256(value.encode()).hexdigest(),src[0],observer.strip())).fetchone()
    return {"candidate_id":row[0] if row else None,"created":bool(row),"published":0}


def approve(candidate_id,reviewer,current,rights):
    if not current or not rights or not 2<=len(reviewer.strip())<=120:
        raise ImportValidationError("Current evidence, reuse rights and reviewer required")
    with database_connect() as conn:
        with conn.transaction():
            row=conn.execute("""SELECT p.court_id,p.field_name,p.proposed_value,p.source_id,
                p.observed_at,p.status,s.url FROM court_profile_candidates p
                JOIN sources s ON s.id=p.source_id WHERE p.id=%s FOR UPDATE OF p""",
                (candidate_id,)).fetchone()
            if row is None or row[5]!="pending":
                raise ImportValidationError("Candidate missing or reviewed")
            cid,field,value,sid,observed,_,url=row
            if observed < datetime.now(timezone.utc)-timedelta(days=7) or not official_url(url):
                raise ImportValidationError("Evidence stale or invalid")
            value=validate(field,value)
            if field in CORE:
                prior=conn.execute("SELECT "+field+" FROM courts WHERE id=%s AND status='verified' FOR UPDATE",(cid,)).fetchone()
                if prior is None:
                    raise ImportValidationError("Verified court missing")
                old=prior[0]
                conn.execute("UPDATE courts SET "+field+"=%s,updated_at=now() WHERE id=%s",(value,cid))
            else:
                prior=conn.execute("""SELECT value FROM court_profile_fields
                    WHERE court_id=%s AND field_name=%s FOR UPDATE""",(cid,field)).fetchone()
                old=prior[0] if prior else None
                conn.execute("""INSERT INTO court_profile_fields
                    (court_id,field_name,value,source_id,verified_at,reviewed_by)
                    VALUES(%s,%s,%s,%s,now(),%s)
                    ON CONFLICT(court_id,field_name) DO UPDATE SET
                    value=excluded.value,source_id=excluded.source_id,
                    verified_at=excluded.verified_at,reviewed_by=excluded.reviewed_by,
                    changed_at=now()""",(cid,field,value,sid,reviewer.strip()))
                if field=="coordinates":
                    loc=json.loads(value)
                    conn.execute("""UPDATE courts SET location=
                        ST_SetSRID(ST_MakePoint(%s,%s),4326)::geography,
                        updated_at=now() WHERE id=%s""",
                        (loc["longitude"],loc["latitude"],cid))
            if old!=value:
                conn.execute("""INSERT INTO change_events
                    (entity_type,entity_id,changed_field,old_value,new_value,source_id)
                    VALUES('court',%s,%s,%s,%s,%s)""",(cid,field,old,value,sid))
            conn.execute("""UPDATE court_profile_candidates SET
                status='approved',reviewed_at=now(),reviewed_by=%s WHERE id=%s""",
                (reviewer.strip(),candidate_id))
            conn.execute("UPDATE sources SET checked_at=now() WHERE id=%s",(sid,))
    return {"candidate_id":candidate_id,"changed":old!=value,"status":"approved"}


def main():
    p=argparse.ArgumentParser(description="Stage and verify court profile observations")
    sub=p.add_subparsers(dest="action",required=True)
    a=sub.add_parser("propose")
    for name in ("court-id","field","value","source-url","observer"):
        a.add_argument("--"+name,required=True,type=int if name=="court-id" else str)
    b=sub.add_parser("approve")
    b.add_argument("--candidate-id",type=int,required=True)
    b.add_argument("--reviewer",required=True)
    b.add_argument("--attest-current",action="store_true")
    b.add_argument("--attest-rights",action="store_true")
    x=p.parse_args()
    try:
        output=(propose(x.court_id,x.field,x.value,x.source_url,x.observer) if x.action=="propose"
                else approve(x.candidate_id,x.reviewer,x.attest_current,x.attest_rights))
    except ImportValidationError as exc:
        p.exit(2,str(exc)+"\n")
    print(json.dumps(output,ensure_ascii=False))


if __name__=="__main__":
    main()
