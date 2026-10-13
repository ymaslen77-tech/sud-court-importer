"""Private, provenance-preserving court judge roster intake.

Accepts reviewed manual transcription of a single *official* court judges page.
A roster entry is NOT a proved active appointment and this module never writes
judges, judicial_appointments or public courts.

Expected JSON: {
  "courtName":"...",
  "courtUrl":"https://mos-gorsud.ru/rs/.../",
  "sourceUrl":"https://www.mos-gorsud.ru/rs/.../structure/judges",
  "pageLastUpdated":"YYYY-MM-DD",
  "judges":[{"fullName":"...", "position":"судья", "decreeNumber":"...",
             "decreeDate":"YYYY-MM-DD"}]
}
"""
from __future__ import annotations

import argparse
from datetime import date, timedelta
from hashlib import sha256
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

from contacts import ImportValidationError, MAX_BYTES
from cli import database_connect

PERSON = re.compile(r"^[А-ЯЁ][а-яё-]+(?:\s+[А-ЯЁ][а-яё-]+){1,3}$")
DECREE = re.compile(r"^[0-9А-Яа-яA-Za-z№/.-]{1,40}$")
TEL = re.compile(r"^[+0-9 ()–—./-]{5,100}$")
CATEGORIES = {"судья", "председатель суда", "заместитель председателя суда"}


def official_moscow_url(url: str) -> tuple[str,str]:
    try:
        parts=urlsplit(url)
        host=(parts.hostname or "").lower()
        if (parts.scheme!="https" or host not in ("mos-gorsud.ru","www.mos-gorsud.ru")
            or parts.username is not None or parts.password is not None
            or parts.port not in (None,443) or parts.query or parts.fragment
            or len(url)>1024):
            raise ImportValidationError("Official Moscow court HTTPS URL required")
        return host,parts.path.rstrip("/")
    except (ValueError,TypeError,AttributeError) as exc:
        raise ImportValidationError("Malformed official Moscow URL") from exc


def captured_date(value: str, *, max_age: int=30) -> date:
    try:
        result=date.fromisoformat(value)
    except (TypeError,ValueError) as exc:
        raise ImportValidationError("Expected real ISO date") from exc
    days=date.today()-result
    if days<timedelta(0) or days>timedelta(days=max_age):
        raise ImportValidationError("Capture date is future or too old")
    return result


def parse(raw: bytes) -> dict:
    if not 0<len(raw)<=MAX_BYTES:
        raise ImportValidationError("Roster file empty or above 5 MB")
    try:
        data=json.loads(raw.decode("utf-8-sig"))
    except (UnicodeError,json.JSONDecodeError) as exc:
        raise ImportValidationError("Expected UTF-8 roster JSON") from exc
    if not isinstance(data,dict) or set(data)!={
        "courtName","courtUrl","sourceUrl","pageLastUpdated","judges"
    }:
        raise ImportValidationError("Unexpected roster format")
    name=data["courtName"]
    if not isinstance(name,str) or not 5<=len(name)<=250:
        raise ImportValidationError("Court name missing")
    _, court_path=official_moscow_url(data["courtUrl"])
    _, roster_path=official_moscow_url(data["sourceUrl"])
    if not re.fullmatch(r"/rs/[a-z0-9-]{3,70}",court_path):
        raise ImportValidationError("Unknown court path")
    if roster_path!=court_path+"/structure/judges":
        raise ImportValidationError("Roster source must belong to the named court")
    updated=captured_date(data["pageLastUpdated"],max_age=365*10)
    people=data["judges"]
    if not isinstance(people,list) or not 1<=len(people)<=300:
        raise ImportValidationError("Roster must contain between 1 and 300 entries")
    seen=set()
    normalized=[]
    for i,item in enumerate(people,1):
        if not isinstance(item,dict) or not set(item).issubset({
            "fullName","position","decreeNumber","decreeDate","room","telephone"
        }) or not {"fullName","position"}.issubset(item):
            raise ImportValidationError(f"Roster row {i} malformed")
        person=item["fullName"]
        position=item["position"]
        if not isinstance(person,str) or not PERSON.fullmatch(person):
            raise ImportValidationError(f"Roster row {i} invalid judge full name")
        if position not in CATEGORIES:
            raise ImportValidationError(f"Roster row {i} invalid position")
        if (person,position) in seen:
            raise ImportValidationError(f"Duplicate roster person/position at row {i}")
        seen.add((person,position))
        decree=item.get("decreeNumber")
        if decree is not None and (not isinstance(decree,str) or not DECREE.fullmatch(decree)):
            raise ImportValidationError(f"Roster row {i} bad decree number")
        decree_date=item.get("decreeDate")
        if decree_date is not None:
            captured_date(decree_date,max_age=365*100)
        room=item.get("room")
        if room is not None and (not isinstance(room,str) or len(room)>50):
            raise ImportValidationError(f"Roster row {i} invalid room")
        phone=item.get("telephone")
        if phone is not None and (not isinstance(phone,str) or not TEL.fullmatch(phone)):
            raise ImportValidationError(f"Roster row {i} invalid phone")
        normalized.append(item)
    # The exact snapshot is preserved; generic values are not assigned to
    # judge identities or appointments automatically.
    return {**data,"judges":normalized,"pageLastUpdated":str(updated)}


def stage(data:dict,captured_on:date,reviewer:str) -> dict:
    if not isinstance(reviewer,str) or not 2<=len(reviewer.strip())<=120:
        raise ImportValidationError("Named reviewer required")
    from psycopg.types.json import Jsonb
    canonical=json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(",",":"))
    digest=sha256(canonical.encode("utf-8")).hexdigest()
    with database_connect() as conn:
        with conn.transaction():
            source=conn.execute(
                """INSERT INTO sources(url,publisher,source_type)
                   VALUES(%s,%s,%s)
                   ON CONFLICT(url) DO UPDATE SET publisher=EXCLUDED.publisher RETURNING id""",
                (data["sourceUrl"],"Московский городской суд","judges-directory-unreviewed")
            ).fetchone()
            assert source
            inserted=conn.execute(
                """INSERT INTO court_staff_roster_batches
                   (source_id,official_court_url,snapshot_sha256,captured_on,
                    source_page_updated_on,record_count,checked_by)
                   VALUES(%s,%s,%s,%s,%s,%s,%s)
                   ON CONFLICT(source_id,official_court_url,snapshot_sha256)
                   DO NOTHING RETURNING id""",
                (source[0],data["courtUrl"],digest,captured_on,
                 data["pageLastUpdated"],len(data["judges"]),reviewer.strip())
            ).fetchone()
            if not inserted:
                existing=conn.execute(
                    """SELECT id FROM court_staff_roster_batches
                       WHERE source_id=%s AND official_court_url=%s AND snapshot_sha256=%s""",
                    (source[0],data["courtUrl"],digest)
                ).fetchone()
                assert existing
                return {"batch_id":existing[0],"created":False,"rows":len(data["judges"]),
                        "published":0}
            batch_id=inserted[0]
            for item in data["judges"]:
                conn.execute(
                    """INSERT INTO court_staff_roster_rows
                       (batch_id,full_name,stated_position,decree_number,decree_date,
                        room,telephone,raw_record)
                       VALUES(%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (batch_id,item["fullName"],item["position"],item.get("decreeNumber"),
                     item.get("decreeDate"),item.get("room"),item.get("telephone"),Jsonb(item))
                )
    return {"batch_id":batch_id,"created":True,"rows":len(data["judges"]),"published":0}


def main():
    cli=argparse.ArgumentParser(description="Offline sourced judge roster staging; no auto publication")
    cli.add_argument("action",choices=("validate","stage"))
    cli.add_argument("file",type=Path)
    cli.add_argument("--captured-on")
    cli.add_argument("--reviewer")
    cli.add_argument("--attest-source-observed",action="store_true")
    args=cli.parse_args()
    try:
        if not args.file.is_file() or args.file.stat().st_size>MAX_BYTES:
            raise ImportValidationError("Roster file missing or too large")
        data=parse(args.file.read_bytes())
        if args.action=="validate":
            result={"valid":True,"rows":len(data["judges"]),"source":data["sourceUrl"],
                    "published":0}
        else:
            if not args.attest_source_observed:
                raise ImportValidationError("Explicit official source observation required")
            result=stage(data,captured_date(args.captured_on),args.reviewer or "")
    except ImportValidationError as exc:
        cli.exit(2,"Validation error: "+str(exc)+"\n")
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
