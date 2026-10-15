"""Minimal officially evidenced court -> case links, without participant details.

A case UID must begin with an officially reconciled court classification code.
No parties, ruling texts or guessed judge identifiers are ingested.
"""
from __future__ import annotations
import argparse
from datetime import datetime,timezone,timedelta
import json
import re
from urllib.parse import urlsplit
from contacts import ImportValidationError
from cli import database_connect

UID=re.compile(r"^[0-9]{2}[A-Z]{2}[0-9]{4}-[0-9]{2}-[0-9]{4}-[0-9]{6}-[0-9]{2}$")
NUMBER=re.compile(r"^[0-9A-Za-zА-Яа-яЁё .№/-]{3,70}$")


def official_case_page(value):
    try:
        u=urlsplit(value)
        host=(u.hostname or "").lower()
        return (u.scheme=="https" and host in
                ("mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru")
                and u.port in (None,443) and not u.username and not u.password
                and not u.fragment and not u.query
                and bool(re.fullmatch(
                    r"/rs/[a-z0-9-]+/services/cases/[a-z0-9/-]+/details/"
                    r"[0-9a-fA-F-]{36}/?",u.path)))
    except ValueError:
        return False


def validate(uid,number,url):
    if not isinstance(uid,str) or not UID.fullmatch(uid):
        raise ImportValidationError("Invalid official case UID")
    if not isinstance(number,str) or not NUMBER.fullmatch(number):
        raise ImportValidationError("Invalid public case number")
    if not isinstance(url,str) or not official_case_page(url):
        raise ImportValidationError("Expected exact official Moscow case-detail HTTPS URL")
    return uid,number.strip(),url


def propose(court_id,uid,number,url,observer):
    uid,number,url=validate(uid,number,url)
    if not isinstance(observer,str) or not 2<=len(observer.strip())<=120:
        raise ImportValidationError("Editorial reviewer must be identified")
    code=uid[:8]
    with database_connect() as conn:
        with conn.transaction():
            matched=conn.execute(
                """SELECT 1 FROM courts c JOIN court_external_identifiers i ON i.court_id=c.id
                   WHERE c.id=%s AND c.status='verified' AND i.external_code=%s LIMIT 1""",
                (court_id,code)
            ).fetchone()
            if not matched:
                raise ImportValidationError("Court is not verified or UID code disagrees with court")
            source=conn.execute(
                """INSERT INTO sources(url,publisher,source_type) VALUES(%s,%s,%s)
                   ON CONFLICT(url) DO UPDATE SET publisher=excluded.publisher RETURNING id""",
                (url,"Официальный портал судов Москвы","official-case-reference")
            ).fetchone()
            assert source
            created=conn.execute(
                """INSERT INTO court_case_candidates
                   (court_id,case_uid,case_number,source_id,page_url,proposed_by)
                   VALUES(%s,%s,%s,%s,%s,%s)
                   ON CONFLICT(court_id,case_uid,source_id) DO NOTHING RETURNING id""",
                (court_id,uid,number,source[0],url,observer.strip())
            ).fetchone()
    return {"candidate_id":created[0] if created else None,
            "created":bool(created),"published":0}


def approve(candidate_id,reviewer,attest_current,attest_reuse_rights):
    if not (attest_current and attest_reuse_rights):
        raise ImportValidationError("Independent current-record and reuse-rights attestations required")
    if not isinstance(reviewer,str) or not 2<=len(reviewer.strip())<=120:
        raise ImportValidationError("Reviewer name required")
    with database_connect() as conn:
        with conn.transaction():
            entry=conn.execute(
                """SELECT court_id,case_uid,case_number,source_id,page_url,observed_at,status
                   FROM court_case_candidates WHERE id=%s FOR UPDATE""",(candidate_id,)
            ).fetchone()
            if not entry or entry[6]!="pending":
                raise ImportValidationError("Pending candidate missing")
            cid,uid,number,sid,url,observed,_=entry
            if observed<datetime.now(timezone.utc)-timedelta(days=14):
                raise ImportValidationError("Source observation older than 14 days")
            validate(uid,number,url)
            code=uid[:8]
            matches=conn.execute(
                """SELECT 1 FROM courts c JOIN court_external_identifiers i ON i.court_id=c.id
                   WHERE c.id=%s AND c.status='verified' AND i.external_code=%s LIMIT 1""",
                (cid,code)
            ).fetchone()
            if not matches:
                raise ImportValidationError("Court code no longer verified")
            other=conn.execute(
                "SELECT id,page_url FROM court_case_references WHERE court_id=%s AND case_uid=%s",
                (cid,uid)
            ).fetchone()
            if other and other[1]!=url:
                raise ImportValidationError("Different official case URL already published for UID")
            conn.execute(
                """INSERT INTO court_case_references
                   (court_id,case_uid,case_number,source_id,page_url,verified_at,reviewed_by)
                   VALUES(%s,%s,%s,%s,%s,now(),%s)
                   ON CONFLICT(court_id,case_uid) DO UPDATE
                   SET case_number=excluded.case_number,source_id=excluded.source_id,
                   verified_at=excluded.verified_at,reviewed_by=excluded.reviewed_by""",
                (cid,uid,number,sid,url,reviewer.strip())
            )
            conn.execute(
                """UPDATE court_case_candidates SET status='approved',
                   reviewed_at=now(),reviewed_by=%s WHERE id=%s""",
                (reviewer.strip(),candidate_id)
            )
            conn.execute("UPDATE sources SET checked_at=now() WHERE id=%s",(sid,))
    return {"candidate_id":candidate_id,"court_id":cid,"published":1}


def main():
    p=argparse.ArgumentParser(description="Stage/review public case links (no parties or case texts)")
    sub=p.add_subparsers(dest="action",required=True)
    a=sub.add_parser("propose")
    a.add_argument("--court-id",type=int,required=True)
    a.add_argument("--uid",required=True)
    a.add_argument("--number",required=True)
    a.add_argument("--source-url",required=True)
    a.add_argument("--observer",required=True)
    b=sub.add_parser("approve")
    b.add_argument("--candidate-id",type=int,required=True)
    b.add_argument("--reviewer",required=True)
    b.add_argument("--attest-current",action="store_true")
    b.add_argument("--attest-reuse-rights",action="store_true")
    x=p.parse_args()
    try:
        result=(propose(x.court_id,x.uid,x.number,x.source_url,x.observer)
                if x.action=="propose" else
                approve(x.candidate_id,x.reviewer,x.attest_current,x.attest_reuse_rights))
    except ImportValidationError as e:
        p.exit(2,"Validation error: "+str(e)+"\n")
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
