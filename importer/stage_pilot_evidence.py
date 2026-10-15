"""Stage first-ten official-page research as unapproved, field-level evidence.

Never publishes a court. The source was retrieved via cached public webpages,
not a live attestation of current operation or permission to crawl.

 python importer/stage_pilot_evidence.py --validate
 python importer/stage_pilot_evidence.py --stage --confirm
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

from contacts import ImportValidationError
from cli import database_connect

ROOT = Path(__file__).resolve().parents[1]
MATRIX = ROOT / "apps/web/app/lib/pilot-review-matrix.json"
PILOT = ROOT / "importer/review/pilot-first-ten-2026-10-15.json"
FIELDS = ("court_name", "address", "phone", "email")


def valid_evidence_url(value: str, court_host: str) -> bool:
    try:
        u = urlsplit(value)
        return (u.scheme == "https" and u.hostname == court_host
                and court_host.endswith(".sudrf.ru")
                and u.port in (None, 443) and u.username is None
                and u.password is None and not u.fragment)
    except (ValueError, TypeError):
        return False


def observations() -> list[dict]:
    matrix = json.loads(MATRIX.read_text(encoding="utf-8"))
    manifest = json.loads(PILOT.read_text(encoding="utf-8"))
    original = {r["external_code"]: r for r in manifest["candidates"]}
    if (len(original) != 10 or matrix.get("purpose") != "editorial_research_only"
        or matrix.get("automatic_publication_permitted") is not False
        or matrix.get("not_human_attestation") is not True
        or len(matrix["records"]) != 10):
        raise ImportValidationError("Editorial matrix was modified or approved")
    rows = []
    seen = set()
    for record in matrix["records"]:
        code = record["external_code"]
        if code in seen or code not in original:
            raise ImportValidationError("Duplicate or unknown pilot court code")
        seen.add(code)
        source = original[code]
        snap = source["snapshot"]
        if (record["record_sha256"] != snap["record_sha256"] or
            record["batch_id"] != source["batch_id"] or
            record["court_name"] != source["court_name"] or
            record["publication_state"] != "pending" or
            record["editorial_approved"] is not False or
            record["source_date_confirmed"] is not None or
            record["reviewer"] is not None):
            raise ImportValidationError("Pilot has changed since unreviewed snapshot")
        individual = record["individual_source_url"]
        host = urlsplit(record["https_site_url"]).hostname
        if not host or not valid_evidence_url(individual, host):
            raise ImportValidationError("Unsafe official evidence URL")
        official_heading = record.get("official_header_court_name")
        if not isinstance(official_heading,str) or not official_heading.strip():
            raise ImportValidationError("Official heading observation missing")
        if record.get("archived_name_matches_official_header") != (official_heading == record["court_name"]):
            raise ImportValidationError("Official heading mismatch status is inconsistent")
        values = {"court_name": official_heading, **record["archived_values"]}
        for field in FIELDS:
            if field != "court_name" and values[field] != snap[field]:
                raise ImportValidationError("Snapshot field conflict: " + field)
            value = values[field]
            if not isinstance(value, str) or not 1 <= len(value.strip()) <= 500:
                raise ImportValidationError("Missing or oversized observed field")
            rows.append({
                "batch_id": record["batch_id"], "external_code": code,
                "record_sha256": snap["record_sha256"], "field_name": field,
                "observed_value": value, "evidence_url": individual,
                "channel": "cached_official_page",
                "researched_on": matrix["observed_on"],
            })
        case = record.get("uid_case_evidence_url")
        if case is not None:
            if record.get("uid_case_code_observed") is not True or not valid_evidence_url(case, host):
                raise ImportValidationError("Invalid official case UID observation")
            rows.append({
                "batch_id": record["batch_id"], "external_code": code,
                "record_sha256": snap["record_sha256"],
                "field_name": "classification_code", "observed_value": code,
                "evidence_url": case, "channel": "cached_official_case_uid",
                "researched_on": matrix["observed_on"],
            })
        elif record.get("uid_case_code_observed") is not False:
            raise ImportValidationError("Conflicting code evidence status")
    if len(seen) != 10 or len(rows) != 48:
        raise ImportValidationError("Expected exactly ten courts and 48 unapproved observations")
    return rows


def stage(rows: list[dict]) -> dict:
    added = 0
    with database_connect() as conn:
        with conn.transaction():
            for row in rows:
                selected = conn.execute(
                    """SELECT id,record_sha256 FROM court_import_rows
                       WHERE batch_id=%s AND external_code=%s AND review_status='pending'
                       FOR SHARE""",
                    (row["batch_id"], row["external_code"]),
                ).fetchone()
                if selected is None or selected[1] != row["record_sha256"]:
                    raise ImportValidationError("Changed staging record; abort entire transaction")
                inserted = conn.execute(
                    """INSERT INTO court_import_evidence
                       (import_row_id,field_name,observed_value,evidence_url,
                        observation_channel,researched_on)
                       VALUES(%s,%s,%s,%s,%s,%s)
                       ON CONFLICT DO NOTHING RETURNING id""",
                    (selected[0], row["field_name"], row["observed_value"],
                     row["evidence_url"], row["channel"], row["researched_on"]),
                ).fetchone()
                added += int(inserted is not None)
    return {"staged": added, "unchanged": len(rows)-added, "published": 0}


def main() -> None:
    parser = argparse.ArgumentParser(description="Pilot source research intake: never approve or publish")
    actions = parser.add_mutually_exclusive_group(required=True)
    actions.add_argument("--validate", action="store_true")
    actions.add_argument("--stage", action="store_true")
    parser.add_argument("--confirm", action="store_true")
    args = parser.parse_args()
    if args.stage and not args.confirm:
        parser.error("Staging research requires --stage --confirm")
    try:
        rows = observations()
        summary = {"records": len(rows), "courts": 10, "source_freshness_attested": 0,
                   "reviewed": 0, "published": 0}
        if args.stage:
            summary.update(stage(rows))
        else:
            summary["staged"] = 0
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    except (ImportValidationError, OSError, ValueError) as exc:
        parser.exit(2, "Research intake validation failed: " + str(exc) + "\n")


if __name__ == "__main__":
    main()
