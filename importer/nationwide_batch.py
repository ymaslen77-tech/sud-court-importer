"""Safely prepare and stage saved official federal-court listings region by region.

The workflow is deliberately OFFLINE and has no public court/judge/case writes.
Every region is validated before any database staging starts.

  python importer/nationwide_batch.py init --manifest /data/regions.json
  python importer/nationwide_batch.py validate --manifest /data/regions.json
  python importer/nationwide_batch.py stage --manifest /data/regions.json \
      --captured-on 2026-10-27 --reviewer "Name" \
      --attest-reuse-rights --confirm

Snapshots are UTF-8 files captured from the official URL in each manifest row.
Start with a manifest containing only the regions whose complete pages are saved.
"""
from __future__ import annotations

import argparse
from datetime import date, timedelta
from hashlib import sha256
import json
from pathlib import Path
import re
from typing import Any

from contacts import ImportValidationError
from sudrf_listing import extract, synchronize

REGIONS_FILE = Path(__file__).resolve().parents[1] / "apps/web/app/lib/regions.ts"
SOURCE = "https://sudrf.ru/index.php?act=go_search&court_subj={code}&id=300&searchtype=fs"
MAX_MANIFEST_BYTES = 250_000


def known_regions(path: Path = REGIONS_FILE) -> dict[str, str]:
    """Follow the site's single list of 89 region labels without copying it."""
    data = path.read_text(encoding="utf-8")
    rows = re.findall(r"\['([0-9]{2})','([^']+)'\]", data)
    result = dict(rows)
    if len(rows) != 89 or len(result) != 89:
        raise ImportValidationError("The site region classifier has changed; audit it first")
    return result


def manifest_rows(path: Path, regions: dict[str, str]) -> list[dict[str, str]]:
    if not path.is_file() or path.is_symlink() or path.stat().st_size > MAX_MANIFEST_BYTES:
        raise ImportValidationError("Manifest is missing, unsafe or too large")
    try:
        entries = json.loads(path.read_text(encoding="utf-8"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ImportValidationError("Manifest must be valid UTF-8 JSON") from exc
    if not isinstance(entries, list) or not 1 <= len(entries) <= len(regions):
        raise ImportValidationError("Manifest must contain between 1 and 89 regions")
    seen: set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict) or set(entry) != {"region", "region_name", "snapshot", "source_url"}:
            raise ImportValidationError("Each row needs region, region_name, snapshot, source_url")
        code = entry["region"]
        if not isinstance(code, str) or code not in regions or code in seen:
            raise ImportValidationError("Unknown or duplicate region code")
        seen.add(code)
        if entry["region_name"] != regions[code]:
            raise ImportValidationError("Region name differs from the site classifier")
        if entry["source_url"] != SOURCE.format(code=code):
            raise ImportValidationError("Unexpected listing URL for region " + code)
        snapshot = entry["snapshot"]
        if (not isinstance(snapshot, str) or not re.fullmatch(r"[0-9]{2}\.txt", snapshot)
                or snapshot != code + ".txt"):
            raise ImportValidationError("Snapshot filename must be <region>.txt")
    return sorted(entries, key=lambda row: row["region"])


def preflight(path: Path, regions: dict[str, str] | None = None) -> tuple[list[tuple[dict[str, str], bytes, bytes]], dict[str, Any]]:
    regions = regions if regions is not None else known_regions()
    entries = manifest_rows(path, regions)
    folder = path.resolve().parent
    prepared: list[tuple[dict[str, str], bytes, bytes]] = []
    codes: set[str] = set()
    report: list[dict[str, Any]] = []
    for entry in entries:
        file = folder / entry["snapshot"]
        if not file.is_file() or file.is_symlink() or file.stat().st_size > 5_000_000:
            raise ImportValidationError("Missing or unsafe snapshot for region " + entry["region"])
        raw = file.read_bytes()
        normalized, records = extract(raw, entry["region"], entry["region_name"], entry["source_url"])
        for record in records:
            code = record["courtCode"]
            if code in codes:
                raise ImportValidationError("Duplicate court code across regions: " + code)
            codes.add(code)
        report.append({
            "region": entry["region"],
            "name": entry["region_name"],
            "candidates": len(records),
            "snapshot_sha256": sha256(raw).hexdigest(),
            "published": 0,
        })
        prepared.append((entry, raw, normalized))
    return prepared, {
        "regions_preflighted": len(prepared),
        "candidates_preflighted": len(codes),
        "all_89_regions": len(prepared) == 89,
        "publication_allowed": False,
        "regions": report,
    }


def init_manifest(path: Path, regions: dict[str, str], selected: list[str]) -> dict[str, Any]:
    codes = selected or sorted(regions)
    if len(set(codes)) != len(codes) or any(code not in regions for code in codes):
        raise ImportValidationError("Unknown or duplicate region argument")
    if path.exists():
        raise ImportValidationError("Refusing to overwrite an existing manifest")
    if not path.parent.is_dir():
        raise ImportValidationError("Manifest destination directory does not exist")
    entries = [{
        "region": code, "region_name": regions[code],
        "snapshot": code + ".txt", "source_url": SOURCE.format(code=code),
    } for code in sorted(codes)]
    path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"manifest": str(path), "regions": len(entries), "snapshots_written": 0}


def stage(prepared: list[tuple[dict[str, str], bytes, bytes]], captured_on: str,
          reviewer: str, rights_attested: bool) -> list[dict[str, Any]]:
    if not rights_attested or not isinstance(reviewer, str) or not 2 <= len(reviewer.strip()) <= 120:
        raise ImportValidationError("Named reviewer and source reuse-rights attestation required")
    try:
        captured = date.fromisoformat(captured_on)
    except (TypeError, ValueError) as exc:
        raise ImportValidationError("captured-on must be YYYY-MM-DD") from exc
    if not timedelta(0) <= date.today() - captured <= timedelta(days=30):
        raise ImportValidationError("The saved official listings must be captured within 30 days")
    # preflight() has already validated EVERY region; stage is idempotent and
    # may partially complete if the DB goes down, so rerun the same manifest.
    return [{
        "region": entry["region"],
        **synchronize(raw, normalized, reviewer.strip(), captured_on, rights_attested),
    } for entry, raw, normalized in prepared]


def main() -> None:
    parser = argparse.ArgumentParser(description="Offline bulk federal-court intake, never auto-publish")
    parser.add_argument("command", choices=("init", "validate", "stage"))
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--region", action="append", default=[], help="Two-digit region (init only)")
    parser.add_argument("--captured-on")
    parser.add_argument("--reviewer")
    parser.add_argument("--attest-reuse-rights", action="store_true")
    parser.add_argument("--confirm", action="store_true")
    args = parser.parse_args()
    try:
        regions = known_regions()
        if args.command == "init":
            if args.confirm or args.attest_reuse_rights or args.captured_on or args.reviewer:
                raise ImportValidationError("init never reads or stages data")
            report = init_manifest(args.manifest, regions, args.region)
        else:
            if args.region:
                raise ImportValidationError("--region is only for init")
            if args.command == "stage" and not args.confirm:
                raise ImportValidationError("stage requires explicit --confirm")
            if args.command == "validate" and (args.confirm or args.attest_reuse_rights):
                raise ImportValidationError("validate is read-only")
            prepared, report = preflight(args.manifest, regions)
            if args.command == "stage":
                report["staging"] = stage(
                    prepared, args.captured_on, args.reviewer, args.attest_reuse_rights
                )
            report["database_staging_completed"] = args.command == "stage"
        print(json.dumps(report, ensure_ascii=False, indent=2))
    except ImportValidationError as exc:
        parser.exit(2, "Validation error: " + str(exc) + "\n")


if __name__ == "__main__":
    main()
