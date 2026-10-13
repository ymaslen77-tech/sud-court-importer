"""Opt-in inbox runner for OFFLINE, permissioned Moscow court-contact exports.

Never downloads official websites. Each manifest must be written by an operator
and references a corresponding normalized JSON export inside /input.
The worker only validates, stages and queues diffs: zero automatic publication.

Manifest file /input/inbox/*.manifest.json:
{
  "format": "moscow-contacts-v1",
  "file": "inbox/2026-10-13-moscow.json",
  "dataset_url": "https://data.mos-gorsud.ru/opendata/REAL_DATASET_ID",
  "captured_on": "2026-10-13",
  "reviewer": "Name of editor",
  "reuse_rights_confirmed": true
}
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from contacts import ImportValidationError
from moscow_sync import capture_date, dataset_url, read_file, synchronize

ROOT = Path("/input")
MAX_MANIFESTS = 100
MAX_MANIFEST_BYTES = 16_384


def manifests(directory: Path, root: Path = ROOT) -> list[dict]:
    root_resolved = root.resolve()
    folder = directory.resolve()
    if folder != root_resolved / "inbox" or not folder.is_dir():
        raise ImportValidationError("Manifest folder must be /input/inbox")
    files = sorted(folder.glob("*.manifest.json"))
    if len(files) > MAX_MANIFESTS:
        raise ImportValidationError("Too many inbox manifests; archive completed snapshots")
    results: list[dict] = []
    for file in files:
        if file.is_symlink() or file.stat().st_size > MAX_MANIFEST_BYTES:
            raise ImportValidationError("Unsafe manifest: " + file.name)
        try:
            doc = json.loads(file.read_text(encoding="utf-8"))
        except (UnicodeError, json.JSONDecodeError) as exc:
            raise ImportValidationError("Invalid manifest: " + file.name) from exc
        if not isinstance(doc, dict) or set(doc) != {
            "format", "file", "dataset_url", "captured_on",
            "reviewer", "reuse_rights_confirmed"
        }:
            raise ImportValidationError("Manifest schema mismatch: " + file.name)
        if doc["format"] != "moscow-contacts-v1" or doc["reuse_rights_confirmed"] is not True:
            raise ImportValidationError("Unsupported format or missing explicit rights review")
        path_value = doc["file"]
        if not isinstance(path_value, str) or not path_value.startswith("inbox/") or "\\" in path_value:
            raise ImportValidationError("Input must be inside the inbox")
        target = (root_resolved / path_value).resolve()
        if target.parent != folder or target.suffix.lower() != ".json" or target.is_symlink():
            raise ImportValidationError("Invalid snapshot path")
        if not target.is_file() or target == file:
            raise ImportValidationError("Snapshot missing for manifest " + file.name)
        source = dataset_url(doc["dataset_url"])
        captured = capture_date(doc["captured_on"])
        reviewer = doc["reviewer"]
        if not isinstance(reviewer, str) or not 2 <= len(reviewer.strip()) <= 120:
            raise ImportValidationError("Named reviewer required")
        results.append({
            "manifest": file.name, "path": target, "source": source,
            "captured": captured, "reviewer": reviewer.strip()
        })
    return sorted(results, key=lambda x: (x["captured"], x["manifest"]))


def execute(directory: Path, apply: bool, root: Path = ROOT) -> dict:
    entries = manifests(directory, root)
    staged = []
    failures = []
    for item in entries:
        try:
            raw, records = read_file(item["path"])
            if apply:
                result = synchronize(raw, records, item["source"], item["captured"],
                                     item["reviewer"], True)
                staged.append({
                    "manifest": item["manifest"], "records": len(records),
                    "created": result["created"],
                    "batch_id": result["batch_id"],
                    "diff_run": result["diff_run"],
                    "published": 0
                })
            else:
                staged.append({
                    "manifest": item["manifest"], "records": len(records),
                    "would_stage": True, "published": 0
                })
        except (ImportValidationError, OSError) as exc:
            failures.append({"manifest": item["manifest"], "error": str(exc)[:250]})
    return {
        "dry_run": not apply, "handled": len(staged), "failed": len(failures),
        "entries": staged, "errors": failures, "auto_published": 0
    }


def main() -> None:
    p = argparse.ArgumentParser(description="Permissioned local Moscow source inbox")
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
