"""Nationwide court registry manifest, strict normalization and staging.

Input is a HUMAN-EXTRACTED official-source JSON array with explicit provenance,
not an automated scraping license. None of the rows becomes public at this step.

    python importer/federation.py validate /input/courts.json --registry sudrf-federal
    python importer/federation.py stage /input/courts.json --registry sudrf-federal

One row example:
{"courtCode":"54RS0012","regionCode":"54","regionName":"Новосибирская область",
 "courtName":"...","courtType":"Федеральный суд общей юрисдикции",
 "courtAddress":"...","courtSiteUrl":"http://example.nsk.sudrf.ru",
 "sourceRecordUrl":"https://sudrf.ru/index.php?act=go_search&id=300&searchtype=fs"}
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass, asdict
from hashlib import sha256
import json
import os
from pathlib import Path
import re
from urllib.parse import urlparse

from contacts import Candidate, ImportValidationError, MAX_BYTES, clean

CODE = re.compile(r"^(\d{2})([A-Z]{2,3})(\d{4})$")
REGION = re.compile(r"^\d{2}$")
REGISTRIES = {
    "sudrf-federal": {
        "publisher": "ГАС РФ «Правосудие»",
        "source_type": "official-federal-courts",
        "hosts": ("sudrf.ru",),
        "categories": {"RS", "OS", "KV", "GV", "AJ"},  # Codes evidenced in sudrf Novosibirsk listing
    },
    "mos-gorsud-court": {
        "publisher": "Официальный портал судов общей юрисдикции города Москвы",
        "source_type": "official-moscow-court-page",
        "hosts": ("mos-gorsud.ru",),
        "categories": {"RS", "OS"},
    },
    "sudrf-magistrate": {
        "publisher": "ГАС РФ «Правосудие»",
        "source_type": "official-magistrate-areas",
        "hosts": ("sudrf.ru",),
        "categories": {"MS"},
    },
    "arbitr-courts": {
        "publisher": "Федеральные арбитражные суды",
        "source_type": "official-arbitration-courts",
        "hosts": ("arbitr.ru",),
        "categories": set(),  # Arbitration uses A40/A56-like codes; model separately
    },
}


def host_in(hostname: str, suffixes: tuple[str, ...]) -> bool:
    return any(hostname == suffix or hostname.endswith("." + suffix) for suffix in suffixes)


def official_url(value: str, registry: str, *, listing: bool) -> bool:
    try:
        parsed = urlparse(value)
        if parsed.scheme not in ("https", "http") or not parsed.hostname:
            return False
        if parsed.username or parsed.password or parsed.fragment or parsed.port not in (None, 80, 443):
            return False
        host = parsed.hostname.lower()
        if registry == "mos-gorsud-court":
            # This is a per-court official page, NOT a guessed bulk feed.
            segments = parsed.path.strip("/").split("/")
            valid_path = (len(segments) == 2 and segments[0] == "rs"
                          and re.fullmatch(r"[a-z0-9-]+", segments[1])) or segments == ["mgs"]
            return (parsed.scheme == "https" and host in ("mos-gorsud.ru", "www.mos-gorsud.ru")
                    and bool(valid_path) and not parsed.query and parsed.port in (None,443))
        if listing:
            # HTTPS is required for the primary listing / provenance URL.
            return parsed.scheme == "https" and host_in(host, REGISTRIES[registry]["hosts"])
        if registry == "sudrf-federal":
            return host_in(host, ("sudrf.ru",))
        if registry == "sudrf-magistrate":
            return host_in(host, ("msudrf.ru", "sudrf.ru"))
        if registry == "arbitr-courts":
            return host_in(host, ("arbitr.ru",))
        return False
    except ValueError:
        return False


@dataclass(frozen=True)
class FederalCandidate:
    record: Candidate
    region_code: str
    region_name: str
    source_record_url: str

    def export(self) -> dict:
        return asdict(self)


def parse_record(raw: object, registry: str) -> FederalCandidate:
    if registry not in REGISTRIES:
        raise ImportValidationError("Unknown court registry")
    if not isinstance(raw, dict):
        raise ImportValidationError("Record is not an object")
    code = clean(raw.get("courtCode"), "courtCode", required=True, limit=20)
    if registry == "arbitr-courts":
        raise ImportValidationError("Arbitration codes are not this classification format; use discovery.py until official identifiers are modeled")
    match = CODE.fullmatch(code or "")
    if match is None or match.group(2) not in REGISTRIES[registry]["categories"]:
        raise ImportValidationError("Court code is missing or incompatible with its registry")
    region_code = clean(raw.get("regionCode"), "regionCode", required=True, limit=2)
    region_name = clean(raw.get("regionName"), "regionName", required=True, limit=120)
    if region_code is None or REGION.fullmatch(region_code) is None:
        raise ImportValidationError("Invalid region code")
    if region_code != match.group(1):
        raise ImportValidationError("Region code disagrees with court classification code")
    if registry == "mos-gorsud-court" and (region_code != "77" or region_name != "Москва"):
        raise ImportValidationError("Moscow direct court page must identify region 77 / Москва")
    name = clean(raw.get("courtName"), "courtName", required=True, limit=250)
    court_type = clean(raw.get("courtType"), "courtType", required=True, limit=100)
    address = clean(raw.get("courtAddress"), "courtAddress", required=True, limit=500)
    website = clean(raw.get("courtSiteUrl"), "courtSiteUrl", required=True, limit=500)
    source_url = clean(raw.get("sourceRecordUrl"), "sourceRecordUrl", required=True, limit=800)
    if not website or not official_url(website, registry, listing=False):
        raise ImportValidationError("Court website is not in the official domain allowlist")
    if not source_url or not official_url(source_url, registry, listing=True):
        raise ImportValidationError("Listing URL is not an official HTTPS URL")
    if registry == "mos-gorsud-court":
        # A single named official court page must be both the factual
        # evidence and the court's own official URL.
        a, b = urlparse(source_url), urlparse(website)
        if (a.path.rstrip("/"),a.hostname.replace("www.","")) != (
            b.path.rstrip("/"),b.hostname.replace("www.","")
        ):
            raise ImportValidationError("Direct Moscow court record must cite its own official page")
        if code.startswith("77RS") and not a.path.startswith("/rs/"):
            raise ImportValidationError("District court source must be the /rs/ official page")
        if code.startswith("77OS") and a.path.rstrip("/") != "/mgs":
            raise ImportValidationError("Moscow City Court source must be the /mgs official page")
    phone = clean(raw.get("courtTelephone"), "courtTelephone", limit=500)
    email = clean(raw.get("courtEmail"), "courtEmail", limit=500)
    if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        email = None
    canonical = json.dumps(raw, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    # Code-derived slug is stable across name changes and independent of transliteration.
    candidate = Candidate(
        external_code=code or "", slug="sud-" + (code or "").lower(),
        name=name or "", court_type=court_type or "", address=address or "",
        phone=phone, email=email, official_url=website,
        raw_record={**raw, "_registry": registry},
        record_hash=sha256(canonical.encode("utf-8")).hexdigest()
    )
    return FederalCandidate(candidate, region_code, region_name or "", source_url)


def parse_export(raw: bytes, registry: str) -> list[FederalCandidate]:
    if len(raw) > MAX_BYTES:
        raise ImportValidationError("File exceeds 5 MB")
    try:
        payload = json.loads(raw.decode("utf-8-sig"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ImportValidationError("Expected valid UTF-8 JSON") from exc
    if not isinstance(payload, list) or not 1 <= len(payload) <= 5000:
        raise ImportValidationError("Expected a nonempty JSON array of no more than 5000 records")
    candidates: list[FederalCandidate] = []
    codes: set[str] = set()
    for i, rec in enumerate(payload, 1):
        try:
            item = parse_record(rec, registry)
        except ImportValidationError as exc:
            raise ImportValidationError(f"Row {i}: {exc}") from exc
        if item.record.external_code in codes:
            raise ImportValidationError(f"Duplicate code at row {i}")
        codes.add(item.record.external_code)
        candidates.append(item)
    return candidates


def stage(raw: bytes, candidates: list[FederalCandidate], registry: str) -> dict:
    """Commit all candidates in one transaction; never touch public courts."""
    from psycopg.types.json import Jsonb
    from cli import database_connect

    config = REGISTRIES[registry]
    urls = {item.source_record_url for item in candidates}
    if len(urls) != 1:
        # A batch must correspond to one specific, audit-able official listing.
        raise ImportValidationError("Each staging file must represent exactly one official listing")
    url = next(iter(urls))
    digest = sha256(raw).hexdigest()
    with database_connect() as conn:
        with conn.transaction():
            source = conn.execute(
                """INSERT INTO sources(url,publisher,source_type)
                   VALUES(%s,%s,%s) ON CONFLICT(url) DO UPDATE
                   SET publisher=excluded.publisher RETURNING id""",
                (url, config["publisher"], config["source_type"])
            ).fetchone()
            assert source is not None
            source_id = source[0]
            batch = conn.execute(
                """INSERT INTO court_import_batches(source_id,content_sha256,record_count)
                   VALUES(%s,%s,%s) ON CONFLICT(source_id,content_sha256)
                   DO NOTHING RETURNING id""",
                (source_id,digest,len(candidates))
            ).fetchone()
            if not batch:
                prior = conn.execute(
                    "SELECT id FROM court_import_batches WHERE source_id=%s AND content_sha256=%s",
                    (source_id,digest)
                ).fetchone()
                assert prior is not None
                return {"batch_id":prior[0],"records":len(candidates),"created":False,"published":0}
            batch_id = batch[0]
            for item in candidates:
                c = item.record
                conn.execute(
                    """INSERT INTO court_import_rows
                       (batch_id,external_code,proposed_slug,court_name,court_type,
                        address,phone,email,official_url,raw_record,record_sha256)
                       VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (batch_id,c.external_code,c.slug,c.name,c.court_type,c.address,
                     c.phone,c.email,c.official_url,Jsonb(c.raw_record),c.record_hash)
                )
        return {"batch_id":batch_id,"records":len(candidates),"created":True,"published":0,"registry":registry}


def main() -> None:
    parser = argparse.ArgumentParser(description="Nationwide official court directory intake — NEVER auto-publishes")
    parser.add_argument("command", choices=["validate","stage"])
    parser.add_argument("file", type=Path)
    parser.add_argument("--registry", choices=sorted(REGISTRIES), required=True)
    args = parser.parse_args()
    if not args.file.is_file() or args.file.stat().st_size > MAX_BYTES:
        parser.error("Input file missing or too large")
    try:
        raw = args.file.read_bytes()
        candidates = parse_export(raw, args.registry)
        if args.command == "validate":
            result = {"valid":True,"records":len(candidates),"registry":args.registry,
                      "published":0,"sample_codes":[c.record.external_code for c in candidates[:10]]}
        else:
            result = stage(raw,candidates,args.registry)
    except ImportValidationError as exc:
        parser.exit(2,f"Validation error: {exc}\n")
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__ == "__main__":
    main()
