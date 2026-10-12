"""Court registry import CLI. No candidate is published during 'stage'.

Examples:
 python importer/cli.py validate /input/contacts.json
 python importer/cli.py stage /input/contacts.json --source-url https://data.mos-gorsud.ru/opendata
 python importer/cli.py approve --batch 1 --code 77RS0001 --reviewer Editor \
   --checked-on 2026-10-12 --verification-url https://www.mos-gorsud.ru/rs/babushkinskij \
   --attest-current --attest-reuse-rights

DO NOT pass test fixtures to 'approve'. Human verification is mandatory.
"""
from __future__ import annotations

import argparse
from datetime import date, datetime, timezone, timedelta
from hashlib import sha256
import json
import os
from pathlib import Path
from urllib.parse import urlparse

from contacts import Candidate, ImportValidationError, is_official_url, parse_export


REGISTRY = "mos-gorsud-courts"


def database_connect():
    try:
        import psycopg
    except ImportError as exc:
        raise SystemExit("Install importer/requirements.txt (or use Docker importer image)") from exc
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL is required for database commands")
    return psycopg.connect(dsn)


def load(path: Path) -> tuple[bytes, list[Candidate]]:
    if not path.is_file():
        raise ImportValidationError("Input file does not exist")
    if path.stat().st_size > 5_000_000:
        raise ImportValidationError("Input file exceeds size limit")
    raw = path.read_bytes()
    return raw, parse_export(raw)


def stage(raw: bytes, courts: list[Candidate], source_url: str) -> dict:
    if not is_official_url(source_url, dataset=True):
        raise ImportValidationError("Source URL must be HTTPS on data.mos-gorsud.ru")
    from psycopg.types.json import Jsonb

    digest = sha256(raw).hexdigest()
    with database_connect() as conn:
        with conn.transaction():
            source = conn.execute(
                """INSERT INTO sources(url,publisher,source_type)
                   VALUES (%s, %s, %s) ON CONFLICT(url)
                   DO UPDATE SET publisher=excluded.publisher
                   RETURNING id""",
                (source_url, "Московский городской суд", "official-court-contacts")
            ).fetchone()
            assert source is not None
            source_id = source[0]
            inserted = conn.execute(
                """INSERT INTO court_import_batches(source_id,content_sha256,record_count)
                   VALUES(%s,%s,%s) ON CONFLICT(source_id,content_sha256)
                   DO NOTHING RETURNING id""",
                (source_id,digest,len(courts))
            ).fetchone()
            if inserted is None:
                existing = conn.execute(
                    "SELECT id FROM court_import_batches WHERE source_id=%s AND content_sha256=%s",
                    (source_id,digest)
                ).fetchone()
                assert existing is not None
                return {"batch_id":existing[0],"records":len(courts),"created":False,"published":0}
            batch_id = inserted[0]
            for row in courts:
                conn.execute(
                    """INSERT INTO court_import_rows
                       (batch_id,external_code,proposed_slug,court_name,court_type,
                        address,phone,email,official_url,raw_record,record_sha256)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (batch_id,row.external_code,row.slug,row.name,row.court_type,
                     row.address,row.phone,row.email,row.official_url,Jsonb(row.raw_record),row.record_hash)
                )
        return {"batch_id":batch_id,"records":len(courts),"created":True,"published":0}


def checked_date(value: str) -> date:
    try:
        result = date.fromisoformat(value)
    except ValueError as exc:
        raise ImportValidationError("checked-on must be YYYY-MM-DD") from exc
    delta = date.today() - result
    if delta < timedelta(0) or delta > timedelta(days=7):
        raise ImportValidationError("Manual check date must be within the last 7 days")
    return result


def approve(args: argparse.Namespace) -> dict:
    reviewer = (args.reviewer or "").strip()
    if not 2 <= len(reviewer) <= 120:
        raise ImportValidationError("Reviewer name must be 2-120 characters")
    checked_on = checked_date(args.checked_on)
    checked_at = datetime.combine(checked_on, datetime.min.time(), tzinfo=timezone.utc)
    if not args.attest_current or not args.attest_reuse_rights:
        raise ImportValidationError("Both human attestations are required")
    with database_connect() as conn:
        with conn.transaction():
            row = conn.execute(
                """SELECT i.id,i.external_code,i.proposed_slug,i.court_name,i.court_type,
                          i.address,i.phone,i.email,i.official_url,i.review_status,
                          b.source_id,b.staged_at,i.raw_record,s.source_type,s.url
                   FROM court_import_rows i JOIN court_import_batches b ON b.id=i.batch_id
                   JOIN sources s ON s.id=b.source_id
                   WHERE i.batch_id=%s AND i.external_code=%s FOR UPDATE OF i""",
                (args.batch,args.code)
            ).fetchone()
            if row is None:
                raise ImportValidationError("Candidate not found in staging batch")
            (row_id,code,slug,name,court_type,address,phone,email,official_url,
             review_status,source_id,staged_at,raw_record,source_type,source_listing_url) = row
            if review_status != "pending":
                raise ImportValidationError("This candidate was already reviewed")
            # Different official page = deliberate manual mismatch; do not publish.
            a,b=urlparse(args.verification_url),urlparse(official_url)
            if (a.hostname, a.path.rstrip("/")) != (b.hostname,b.path.rstrip("/")):
                raise ImportValidationError("Verified court page differs from candidate source URL")
            registry = raw_record.get("_registry", REGISTRY)
            if registry == REGISTRY:
                if source_type != "official-court-contacts":
                    raise ImportValidationError("Moscow candidate has the wrong source classification")
                if not is_official_url(args.verification_url):
                    raise ImportValidationError("Moscow verification URL must be official HTTPS")
                region_code, region_name, region_slug = "77", "Москва", "moscow"
            else:
                from federation import REGISTRIES, official_url, parse_record
                if registry not in REGISTRIES or source_type != REGISTRIES[registry]["source_type"]:
                    raise ImportValidationError("Registry does not match its official source")
                if not official_url(args.verification_url, registry, listing=False):
                    raise ImportValidationError("Verification URL must match this official court registry")
                candidate = parse_record(raw_record, registry)
                if (candidate.record.external_code != code or candidate.record.slug != slug
                    or candidate.record.name != name or candidate.record.address != address
                    or candidate.record.official_url != official_url
                    or candidate.record.court_type != court_type or candidate.record.phone != phone
                    or candidate.record.email != email
                    or candidate.source_record_url != source_listing_url):
                    raise ImportValidationError("Staged record fields diverge from source evidence")
                region_code = candidate.region_code
                region_name = candidate.region_name
                region_slug = "region-" + region_code
            region = conn.execute(
                "SELECT id,name,slug FROM regions WHERE code=%s FOR UPDATE", (region_code,)
            ).fetchone()
            if region:
                if region[1] != region_name:
                    raise ImportValidationError("Existing region name conflicts with source candidate")
                region_id = region[0]
            else:
                region = conn.execute(
                    "INSERT INTO regions(code,name,slug) VALUES(%s,%s,%s) RETURNING id",
                    (region_code,region_name,region_slug)
                ).fetchone()
                assert region is not None
                region_id = region[0]
            # Courts with the same classification code cannot be silently duplicated
            # across separately curated official registries.
            duplicate_code = conn.execute(
                "SELECT id FROM court_external_identifiers WHERE external_code=%s AND registry<>%s LIMIT 1",
                (code, registry)
            ).fetchone()
            if duplicate_code:
                raise ImportValidationError("Court code already belongs to another registry; reconcile manually")
            linked = conn.execute(
                "SELECT court_id FROM court_external_identifiers WHERE registry=%s AND external_code=%s FOR UPDATE",
                (registry,code)
            ).fetchone()
            fields = {"name":name,"slug":slug,"court_type":court_type,
                      "address":address,"phone":phone,"email":email,"official_url":official_url}
            if linked is None:
                conflicting = conn.execute(
                    "SELECT id FROM courts WHERE region_id=%s AND slug=%s",
                    (region_id,slug)
                ).fetchone()
                if conflicting:
                    raise ImportValidationError("Court slug is already in use and has no linked external identifier")
                created = conn.execute(
                    """INSERT INTO courts(region_id,name,slug,court_type,address,phone,email,
                                         official_url,status,verified_at)
                       VALUES(%s,%s,%s,%s,%s,%s,%s,%s,'verified',%s) RETURNING id""",
                    (region_id,name,slug,court_type,address,phone,email,official_url,checked_at)
                ).fetchone()
                assert created is not None
                court_id=created[0]
                conn.execute(
                    "INSERT INTO court_external_identifiers(registry,external_code,court_id) VALUES(%s,%s,%s)",
                    (registry,code,court_id)
                )
            else:
                court_id=linked[0]
                existing=conn.execute(
                    """SELECT region_id,name,slug,court_type,address,phone,email,official_url
                       FROM courts WHERE id=%s FOR UPDATE""", (court_id,)
                ).fetchone()
                if existing is None or existing[0] != region_id:
                    raise ImportValidationError("External identifier is linked to a conflicting region")
                current=dict(zip(fields.keys(),existing[1:]))
                for field,new in fields.items():
                    if current[field] != new:
                        conn.execute(
                            """INSERT INTO change_events
                               (entity_type,entity_id,changed_field,old_value,new_value,source_id)
                               VALUES ('court',%s,%s,%s,%s,%s)""",
                            (court_id,field,current[field],new,source_id)
                        )
                conn.execute(
                    """UPDATE courts SET name=%s,slug=%s,court_type=%s,address=%s,phone=%s,
                       email=%s,official_url=%s,status='verified',verified_at=%s,updated_at=now()
                       WHERE id=%s""",
                    (name,slug,court_type,address,phone,email,official_url,checked_at,court_id)
                )
            for field,value in fields.items():
                if value:
                    conn.execute(
                        """INSERT INTO court_facts(court_id,field_name,value,source_id,retrieved_at,is_approved)
                           VALUES(%s,%s,%s,%s,%s,true)""",
                        (court_id,field,value,source_id,staged_at)
                    )
            conn.execute(
                """UPDATE court_import_rows SET review_status='approved',reviewed_by=%s,
                   reviewed_at=now(),verification_url=%s WHERE id=%s""",
                (reviewer,args.verification_url,row_id)
            )
            conn.execute(
                "UPDATE sources SET checked_at=%s WHERE id=%s", (checked_at,source_id)
            )
        return {"court_id":court_id,"external_code":code,"published":1,
                "checked_on":str(checked_on),"verified_by":reviewer}


def main() -> None:
    parser=argparse.ArgumentParser(description="Offline official Moscow court JSON intake and manually reviewed publication")
    commands=parser.add_subparsers(dest="command",required=True)
    validate=commands.add_parser("validate",help="Check file without a database or network")
    validate.add_argument("file",type=Path)
    stage_cmd=commands.add_parser("stage",help="Stage candidates only; never publishes")
    stage_cmd.add_argument("file",type=Path)
    stage_cmd.add_argument("--source-url",required=True,help="Exact official URL of the dataset used")
    accept=commands.add_parser("approve",help="Publish one record only after manual verification")
    accept.add_argument("--batch",type=int,required=True)
    accept.add_argument("--code",required=True)
    accept.add_argument("--reviewer",required=True)
    accept.add_argument("--checked-on",required=True)
    accept.add_argument("--verification-url",required=True)
    accept.add_argument("--attest-current",action="store_true")
    accept.add_argument("--attest-reuse-rights",action="store_true")
    args=parser.parse_args()
    try:
        if args.command=="approve":
            result=approve(args)
        else:
            raw,courts=load(args.file)
            result=stage(raw,courts,args.source_url) if args.command=="stage" else {
                "records":len(courts),"valid":True,"published":0,
                "sample_codes":[c.external_code for c in courts[:10]]
            }
    except ImportValidationError as exc:
        parser.exit(2,f"Validation error: {exc}\n")
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
