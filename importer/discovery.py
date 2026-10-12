"""Offline discovery of courts in authoritative lists when codes/contacts are missing.

This imports only metadata into PRIVATE court_discovery_* staging. It has NO
write path to the public courts table. Fetch the source HTML/JSON separately
after verifying source permissions. Accept only a sourced JSON snapshot.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import date, timedelta
from hashlib import sha256
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

from contacts import ImportValidationError, MAX_BYTES, clean
from federation import REGISTRIES, host_in

KINDS = {
    "federal-district", "federal-regional", "federal-military", "federal-other",
    "magistrate-area", "arbitration-subject", "arbitration-appeal",
    "arbitration-district", "arbitration-ip", "arbitration-presence",
}
REGISTRY_KINDS = {
    "sudrf-federal": {"federal-district", "federal-regional", "federal-military", "federal-other"},
    "sudrf-magistrate": {"magistrate-area"},
    "arbitr-courts": {"arbitration-subject", "arbitration-appeal", "arbitration-district",
                     "arbitration-ip", "arbitration-presence"},
}
HOSTS = {
    "sudrf-federal": ("sudrf.ru",),
    "sudrf-magistrate": ("sudrf.ru",),
    "arbitr-courts": ("arbitr.ru",),
}
IDENTIFIER_RE = re.compile(r"^[0-9A-Z-]{1,32}$")
REGION_RE = re.compile(r"^[0-9]{2}$")


def validate_url(value: str, allowed: tuple[str, ...]) -> bool:
    try:
        url = urlsplit(value)
        host = (url.hostname or "").lower()
        return (
            url.scheme == "https" and host_in(host, allowed)
            and url.username is None and url.password is None
            and url.port in (None, 443) and not url.fragment
            and len(value) <= 1024
        )
    except ValueError:
        return False


@dataclass(frozen=True)
class DiscoveryRecord:
    row_key: str
    registry: str
    court_name: str
    court_kind: str
    source_record_url: str
    region_code: str | None
    region_name: str | None
    external_code: str | None
    official_court_url: str | None
    address: str | None
    raw_record: dict


def parse_record(row: object) -> DiscoveryRecord:
    if not isinstance(row, dict):
        raise ImportValidationError("Expected a JSON object")
    registry = clean(row.get("registry"), "registry", required=True, limit=40)
    if registry not in REGISTRIES:
        raise ImportValidationError("Unsupported registry")
    name = clean(row.get("courtName"), "courtName", required=True, limit=250)
    kind = clean(row.get("courtKind"), "courtKind", required=True, limit=48)
    if kind not in REGISTRY_KINDS[registry]:
        raise ImportValidationError("Court kind does not belong to this registry")
    source = clean(row.get("sourceRecordUrl"), "sourceRecordUrl", required=True, limit=1024)
    if not source or not validate_url(source, HOSTS[registry]):
        raise ImportValidationError("Source URL must be HTTPS on the registry official domain")
    region_code = clean(row.get("regionCode"), "regionCode", limit=2)
    region_name = clean(row.get("regionName"), "regionName", limit=120)
    if region_code and not REGION_RE.fullmatch(region_code):
        raise ImportValidationError("Invalid regionCode")
    if (region_code is None) != (region_name is None):
        raise ImportValidationError("regionCode and regionName must be supplied together")
    external = clean(row.get("courtCode"), "courtCode", limit=32)
    if external and not IDENTIFIER_RE.fullmatch(external):
        raise ImportValidationError("Invalid courtCode")
    website = clean(row.get("courtSiteUrl"), "courtSiteUrl", limit=1024)
    if website:
        website_allowed = ("sudrf.ru",) if registry == "sudrf-federal" else (
            ("sudrf.ru", "msudrf.ru") if registry == "sudrf-magistrate" else ("arbitr.ru",)
        )
        if not validate_url(website, website_allowed):
            raise ImportValidationError("Official court URL must be HTTPS on approved hosts")
    address = clean(row.get("courtAddress"), "courtAddress", limit=500)

    # Identifier intentionally independent of courtCode, which may be unknown.
    # Prevent duplicate names in the same official listing without fabricating IDs.
    digest = sha256(
        json.dumps([registry, name, source], ensure_ascii=False, separators=(",", ":"))
        .encode("utf-8")
    ).hexdigest()
    return DiscoveryRecord(digest, registry, name, kind, source, region_code,
                           region_name, external, website, address, row)


def parse_snapshot(raw: bytes) -> list[DiscoveryRecord]:
    if len(raw) > MAX_BYTES:
        raise ImportValidationError("Snapshot exceeds 5 MB")
    try:
        payload = json.loads(raw.decode("utf-8-sig"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ImportValidationError("Invalid UTF-8 JSON") from exc
    if not isinstance(payload, list) or not 1 <= len(payload) <= 5000:
        raise ImportValidationError("Expected 1–5000 records in a JSON array")
    result: list[DiscoveryRecord] = []
    seen: set[str] = set()
    source: str | None = None
    registry: str | None = None
    for index, row in enumerate(payload, 1):
        try:
            candidate = parse_record(row)
        except ImportValidationError as exc:
            raise ImportValidationError(f"Row {index}: {exc}") from exc
        if candidate.row_key in seen:
            raise ImportValidationError(f"Duplicate name/source in row {index}")
        if registry and registry != candidate.registry:
            raise ImportValidationError("One batch cannot mix registries")
        if source and source != candidate.source_record_url:
            raise ImportValidationError("One batch must refer to one exact listing URL")
        seen.add(candidate.row_key)
        registry, source = candidate.registry, candidate.source_record_url
        result.append(candidate)
    return result


def capture_date(value: str) -> date:
    try:
        captured = date.fromisoformat(value)
    except ValueError as exc:
        raise ImportValidationError("captured-on must be YYYY-MM-DD") from exc
    days = date.today() - captured
    if days < timedelta(days=0) or days > timedelta(days=365):
        raise ImportValidationError("Capture date must be within the past year")
    return captured


def stage(raw: bytes, records: list[DiscoveryRecord], captured_on: date) -> dict:
    """Idempotent private staging; no UPDATE/INSERT anywhere into public courts."""
    from psycopg.types.json import Jsonb
    from cli import database_connect

    first = records[0]
    digest = sha256(raw).hexdigest()
    with database_connect() as conn:
        with conn.transaction():
            source_row = conn.execute(
                """INSERT INTO sources(url,publisher,source_type)
                   VALUES(%s,%s,%s) ON CONFLICT(url) DO UPDATE
                   SET publisher=excluded.publisher RETURNING id""",
                (first.source_record_url, REGISTRIES[first.registry]["publisher"],
                 "court-directory-discovery")
            ).fetchone()
            assert source_row is not None
            source_id = source_row[0]
            batch = conn.execute(
                """INSERT INTO court_discovery_batches
                   (source_id,registry,content_sha256,captured_on,record_count)
                   VALUES(%s,%s,%s,%s,%s)
                   ON CONFLICT(source_id,registry,content_sha256)
                   DO NOTHING RETURNING id""",
                (source_id,first.registry,digest,captured_on,len(records))
            ).fetchone()
            if batch is None:
                prior = conn.execute(
                    """SELECT id FROM court_discovery_batches
                       WHERE source_id=%s AND registry=%s AND content_sha256=%s""",
                    (source_id,first.registry,digest)
                ).fetchone()
                assert prior is not None
                return {"batch_id":prior[0],"registry":first.registry,"records":len(records),
                        "created":False,"published":0}
            batch_id = batch[0]
            for item in records:
                conn.execute(
                    """INSERT INTO court_discovery_rows
                       (batch_id,row_key,court_name,court_kind,region_code,region_name,
                        external_code,official_court_url,source_record_url,address,raw_record)
                       VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (batch_id,item.row_key,item.court_name,item.court_kind,
                     item.region_code,item.region_name,item.external_code,
                     item.official_court_url,item.source_record_url,item.address,
                     Jsonb(item.raw_record))
                )
        return {"batch_id":batch_id,"registry":first.registry,
                "records":len(records),"created":True,"published":0}


def stats() -> dict:
    from cli import database_connect
    with database_connect() as conn:
        rows=conn.execute(
            """SELECT b.registry, r.court_kind, COUNT(*)::integer,
                      COUNT(*) FILTER(WHERE r.review_status='pending')::integer,
                      COUNT(*) FILTER(WHERE r.review_status='matched')::integer
               FROM court_discovery_rows r
               JOIN court_discovery_batches b ON b.id=r.batch_id
               GROUP BY b.registry,r.court_kind
               ORDER BY b.registry,r.court_kind"""
        ).fetchall()
        return {
            "count_type":"staged_discovery_rows_including_historical_snapshots",
            "categories":[{"registry":x[0],"kind":x[1],"staged":x[2],
                           "pending":x[3],"matched":x[4]} for x in rows],
            "warning":"Staged discovery rows are NOT published or verified court totals",
        }


def main() -> None:
    parser=argparse.ArgumentParser(description="Offline incomplete court discovery. Never publishes.")
    commands=parser.add_subparsers(dest="command", required=True)
    for cmd in ("validate","stage"):
        sub=commands.add_parser(cmd)
        sub.add_argument("file", type=Path)
        sub.add_argument("--captured-on", required=(cmd=="stage"))
    commands.add_parser("stats")
    args=parser.parse_args()
    try:
        if args.command=="stats":
            output=stats()
        else:
            if not args.file.is_file() or args.file.stat().st_size > MAX_BYTES:
                raise ImportValidationError("Snapshot missing or exceeds size limit")
            data=args.file.read_bytes()
            entries=parse_snapshot(data)
            output=(stage(data, entries, capture_date(args.captured_on))
                    if args.command=="stage"
                    else {"valid":True, "records":len(entries),
                          "registry":entries[0].registry,"published":0})
    except ImportValidationError as exc:
        parser.exit(2,f"Validation error: {exc}\n")
    print(json.dumps(output,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
