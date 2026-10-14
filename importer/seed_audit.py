"""Offline inventory for preliminary court seed files. Never verifies or publishes rows."""
from __future__ import annotations
import argparse
import json
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent / "seeds"
FILES = (
    "novosibirsk-federal-official-unreviewed.json",
    "arbitration-subjects-official-list-unreviewed.json",
    "arbitration-appellate-district-ip-official-unreviewed.json",
    "khabarovsk-magistrates-official-unreviewed.json",
)
MAX_BYTES = 5_000_000


def audit(root: Path = ROOT) -> dict:
    report = []
    codes: set[tuple[str, str]] = set()
    duplicates = []
    counts = Counter()
    for filename in FILES:
        path = root / filename
        if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_BYTES:
            raise ValueError("Missing or unsafe seed: " + filename)
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            raise ValueError("Seed must be an array: " + filename)
        missing_code = 0
        insecure_sites = 0
        for index, row in enumerate(payload, 1):
            if not isinstance(row, dict):
                raise ValueError("Non-object row: " + filename)
            code = row.get("courtCode")
            region = row.get("regionCode")
            if code is None or code == "":
                missing_code += 1
            elif isinstance(code, str) and isinstance(region, str):
                pair = (region, code)
                if pair in codes:
                    duplicates.append({"file": filename, "row": index, "region": region, "code": code})
                codes.add(pair)
            site = row.get("courtSiteUrl")
            if isinstance(site, str) and urlsplit(site).scheme == "http":
                insecure_sites += 1
        counts["source_records"] += len(payload)
        report.append({
            "file": filename, "source_records": len(payload),
            "missing_court_code": missing_code,
            "http_website_urls": insecure_sites,
            "verified_or_published": 0,
        })
    return {
        "scope": "offline_preliminary_seeds_only",
        "source_records": counts["source_records"],
        "distinct_coded_records": len(codes),
        "duplicate_codes_across_seed_files": duplicates,
        "files": report,
        "actual_verified_courts": "NOT_ASSESSED",
        "published_by_this_command": 0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Inventory unreviewed seed files; read-only")
    parser.add_argument("--seed-dir", type=Path, default=ROOT)
    args = parser.parse_args()
    print(json.dumps(audit(args.seed_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
