"""Permissioned offline inbox for official Moscow and regional sudrf snapshots.

No live downloads. All exports and source attestations are supplied by a
responsible operator. Identical snapshots are idempotent and never publish
a court or judge without a separate editorial approval.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from contacts import ImportValidationError
from moscow_sync import capture_date, dataset_url, read_file, synchronize
from sudrf_listing import canonical_source, extract as extract_federal, synchronize as sync_federal

ROOT = Path("/input")
MAX_MANIFESTS = 100
MAX_MANIFEST_BYTES = 16_384
COMMON = {"format", "file", "captured_on", "reviewer", "reuse_rights_confirmed"}
MOSCOW = COMMON | {"dataset_url"}
FEDERAL = COMMON | {"source_url", "region", "region_name"}


def manifests(directory: Path, root: Path = ROOT) -> list[dict]:
    root_resolved = root.resolve()
    folder = directory.resolve()
    if folder != root_resolved / "inbox" or not folder.is_dir():
        raise ImportValidationError("Manifest folder must be /input/inbox")
    files = sorted(folder.glob("*.manifest.json"))
    if len(files) > MAX_MANIFESTS:
        raise ImportValidationError("Too many inbox manifests; archive old snapshots")
    entries: list[dict] = []
    for file in files:
        if file.is_symlink() or file.stat().st_size > MAX_MANIFEST_BYTES:
            raise ImportValidationError("Unsafe manifest: " + file.name)
        try:
            doc = json.loads(file.read_text(encoding="utf-8"))
        except (UnicodeError, json.JSONDecodeError) as exc:
            raise ImportValidationError("Invalid manifest: " + file.name) from exc
        if not isinstance(doc, dict):
            raise ImportValidationError("Manifest must be a JSON object")
        kind = doc.get("format")
        expected = MOSCOW if kind == "moscow-contacts-v1" else (
            FEDERAL if kind == "sudrf-federal-list-v1" else None
        )
        if expected is None or set(doc) != expected or doc["reuse_rights_confirmed"] is not True:
            raise ImportValidationError("Unsupported manifest format, schema or rights attestation")
        path_value = doc["file"]
        if not isinstance(path_value, str) or not path_value.startswith("inbox/") or "\\" in path_value:
            raise ImportValidationError("Source snapshot must be inside /input/inbox")
        filename = root_resolved / path_value
        if filename.is_symlink():
            raise ImportValidationError("Symlinked source files are not accepted")
        target = filename.resolve()
        extensions = {".json"} if kind == "moscow-contacts-v1" else {".txt", ".html", ".htm"}
        if target.parent != folder or target.suffix.lower() not in extensions:
            raise ImportValidationError("Unrecognized source path or extension")
        if not target.is_file() or target == file:
            raise ImportValidationError("Snapshot missing for manifest " + file.name)
        captured = capture_date(doc["captured_on"])
        reviewer = doc["reviewer"]
        if not isinstance(reviewer, str) or not 2 <= len(reviewer.strip()) <= 120:
            raise ImportValidationError("Named reviewer required")
        result = {
            "manifest": file.name, "format": kind, "path": target,
            "captured": captured, "reviewer": reviewer.strip()
        }
        if kind == "moscow-contacts-v1":
            result["source"] = dataset_url(doc["dataset_url"])
        else:
            region = doc["region"]
            name = doc["region_name"]
            if not isinstance(region, str) or len(region) != 2 or not region.isdigit():
                raise ImportValidationError("Federal region must be two digits")
            if not isinstance(name, str) or not 2 <= len(name) <= 120:
                raise ImportValidationError("Federal region name required")
            canonical_source(region, doc["source_url"])
            result.update(source=doc["source_url"], region=region, region_name=name)
        entries.append(result)
    return sorted(entries, key=lambda x: (x["captured"], x["manifest"]))


def execute(directory: Path, apply: bool, root: Path = ROOT) -> dict:
    entries = manifests(directory, root)
    staged = []
    failures = []
    for item in entries:
        try:
            if item["format"] == "moscow-contacts-v1":
                raw, records = read_file(item["path"])
                normalized = None
            else:
                raw = item["path"].read_bytes()
                normalized, records = extract_federal(
                    raw, item["region"], item["region_name"], item["source"]
                )
            if apply:
                if item["format"] == "moscow-contacts-v1":
                    result = synchronize(raw, records, item["source"], item["captured"],
                                         item["reviewer"], True)
                else:
                    assert normalized is not None
                    result = sync_federal(
                        raw, normalized, item["reviewer"], str(item["captured"]), True
                    )
                staged.append({
                    "manifest": item["manifest"], "format": item["format"],
                    "records": len(records), "created": result["created"],
                    "batch_id": result["batch_id"],
                    "diff_run": result["diff_run"], "published": 0
                })
            else:
                staged.append({
                    "manifest": item["manifest"], "format": item["format"],
                    "records": len(records), "would_stage": True, "published": 0
                })
        except (ImportValidationError, OSError) as exc:
            failures.append({"manifest": item["manifest"], "error": str(exc)[:250]})
    result = {
        "dry_run": not apply, "handled": len(staged), "failed": len(failures),
        "entries": staged, "errors": failures, "auto_published": 0
    }
    if apply:
        from cli import database_connect
        from psycopg.types.json import Jsonb
        with database_connect() as conn:
            entry = conn.execute(
                """INSERT INTO court_intake_runs
                   (handled,failed,manifest_count,error_summary)
                   VALUES(%s,%s,%s,%s) RETURNING id""",
                (len(staged),len(failures),len(entries),Jsonb(failures))
            ).fetchone()
            assert entry
            result["intake_run_id"] = entry[0]
    return result


def main() -> None:
    p = argparse.ArgumentParser(description="Permissioned Moscow and regional court snapshot inbox")
    p.add_argument("action", choices=("check", "stage"))
    p.add_argument("--directory", type=Path, default=ROOT / "inbox")
    args = p.parse_args()
    try:
        output = execute(args.directory, args.action == "stage")
    except ImportValidationError as exc:
        p.exit(2, "Validation error: " + str(exc) + "\n")
    print(json.dumps(output, ensure_ascii=False, indent=2))
    if output["failed"]:
        p.exit(3)


if __name__ == "__main__":
    main()
