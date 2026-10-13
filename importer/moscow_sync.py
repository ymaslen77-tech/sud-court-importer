"""Moscow court contacts: source-attested offline JSON sync and semantic diffs.

Use a file actually exported through a permitted official channel, normalized
to the documented courtCode/courtName/courtAddress/courtTelephone/courtEmail/
courtSiteUrl contract. This CLI does NOT download anything or publish courts.

  python importer/moscow_sync.py validate /input/contacts.json
  python importer/moscow_sync.py sync /input/contacts.json \
    --dataset-url https://data.mos-gorsud.ru/opendata/REAL_DATASET_ID \
    --captured-on YYYY-MM-DD --reviewer "Editorial reviewer" \
    --attest-reuse-rights
"""
from __future__ import annotations

import argparse
from datetime import date, timedelta
from hashlib import sha256
import json
from pathlib import Path
from urllib.parse import urlsplit

from contacts import ImportValidationError, MAX_BYTES, parse_export
from cli import database_connect, stage as stage_contacts
from registry_diff import queue


def dataset_url(url: str) -> str:
    """Require a specific official dataset, not the home/catalogue URL."""
    try:
        parts = urlsplit(url)
        if (
            parts.scheme != "https"
            or parts.hostname != "data.mos-gorsud.ru"
            or parts.port not in (None, 443)
            or parts.username is not None
            or parts.password is not None
            or parts.fragment
            or parts.query
            or not parts.path.startswith("/opendata/")
            or len(parts.path.strip("/").split("/")) != 2
            or len(parts.path.rstrip("/").split("/")[-1]) < 8
            or len(url) > 1024
        ):
            raise ImportValidationError("A specific official Moscow open-data dataset HTTPS URL is required")
    except ValueError as exc:
        raise ImportValidationError("Invalid official dataset URL") from exc
    return url


def capture_date(raw: str) -> date:
    try:
        captured = date.fromisoformat(raw)
    except (ValueError, TypeError) as exc:
        raise ImportValidationError("--captured-on must be YYYY-MM-DD") from exc
    age = date.today() - captured
    if age < timedelta(0) or age > timedelta(days=30):
        raise ImportValidationError("The supplied official snapshot must be captured within 30 days")
    return captured


def read_file(path: Path) -> tuple[bytes, list]:
    if not path.is_file() or path.stat().st_size > MAX_BYTES:
        raise ImportValidationError("Snapshot missing or larger than 5 MB")
    raw = path.read_bytes()
    records = parse_export(raw)
    return raw, records


def synchronize(raw: bytes, records: list, source: str, captured: date,
                reviewer: str, rights_attested: bool) -> dict:
    """Idempotent, write-only to PRIVATE import and diff queues."""
    dataset_url(source)
    if not rights_attested or not 2 <= len(reviewer.strip()) <= 120:
        raise ImportValidationError("Named editorial reviewer and source reuse attestation are required")

    staged = stage_contacts(raw, records, source)
    batch_id = staged["batch_id"]
    original_sha = sha256(raw).hexdigest()
    with database_connect() as conn:
        with conn.transaction():
            batch = conn.execute(
                """SELECT source_id,primary_snapshot_sha256
                   FROM court_import_batches WHERE id=%s FOR UPDATE""", (batch_id,)
            ).fetchone()
            if not batch:
                raise ImportValidationError("Staged batch disappeared")
            if staged["created"]:
                conn.execute(
                    """UPDATE court_import_batches
                       SET primary_snapshot_sha256=%s,snapshot_captured_on=%s,
                       snapshot_verified_by=%s,snapshot_use_attested=true
                       WHERE id=%s""",
                    (original_sha, captured, reviewer.strip(), batch_id)
                )
            earlier = conn.execute(
                """SELECT id FROM court_import_batches
                   WHERE source_id=%s AND id<%s
                   ORDER BY id DESC LIMIT 1""",
                (batch[0], batch_id)
            ).fetchone()

    result = {
        **staged,
        "raw_source_sha256": original_sha,
        "source_only_changed": bool(batch[1] and batch[1] != original_sha),
        "diff_run": None,
        "auto_published": 0,
    }
    # Repair half-completed runs on retry without creating duplicate diff rows.
    if earlier:
        result["diff_run"] = queue(earlier[0], batch_id)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Offline Moscow contacts staging; never auto-publishes")
    parser.add_argument("action", choices=("validate", "sync"))
    parser.add_argument("file", type=Path)
    parser.add_argument("--dataset-url")
    parser.add_argument("--captured-on")
    parser.add_argument("--reviewer")
    parser.add_argument("--attest-reuse-rights", action="store_true")
    args = parser.parse_args()
    try:
        raw, rows = read_file(args.file)
        if args.action == "validate":
            result = {
                "valid": True, "records": len(rows),
                "sample_codes": [item.external_code for item in rows[:10]],
                "published": 0
            }
        else:
            result = synchronize(
                raw, rows, dataset_url(args.dataset_url or ""),
                capture_date(args.captured_on),
                args.reviewer or "", args.attest_reuse_rights
            )
    except ImportValidationError as exc:
        parser.exit(2, "Validation error: " + str(exc) + "\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
