"""Stage the audited seven-file court seed corpus into private Neon/Postgres queues.

No network scraping; does not write `courts`, `judges`, verified flags or source
reuse attestations. All files are vetted before the first database mutation.
Do not use this to declare any court active or verified.

  python importer/stage_seed_corpus.py --validate
  python importer/stage_seed_corpus.py --stage --confirm
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import date
import json
from pathlib import Path

from contacts import ImportValidationError
from federation import parse_export, stage as stage_federal
from discovery import parse_snapshot, stage as stage_discovery

ROOT = Path(__file__).resolve().parent / "seeds"
CAPTURED_ON = date(2026, 10, 14)  # Date of the stored research corpus, NOT a freshness attestation.
FILES = (
    ("novosibirsk-federal-official-unreviewed.json", "federal", "sudrf-federal", 10),
    ("novosibirsk-federal-additional-official-unreviewed.json", "federal", "sudrf-federal", 26),
    ("omsk-federal-official-unreviewed.json", "federal", "sudrf-federal", 40),
    ("omsk-federal-official-ambiguous-unreviewed.json", "discovery", "sudrf-federal", 1),
    ("khabarovsk-magistrates-official-unreviewed.json", "discovery", "sudrf-magistrate", 75),
    ("arbitration-subjects-official-list-unreviewed.json", "discovery", "arbitr-courts", 89),
    ("arbitration-appellate-district-ip-official-unreviewed.json", "discovery", "arbitr-courts", 32),
)


def preflight(seed_dir: Path = ROOT) -> tuple[list[tuple[str, str, bytes, list]], dict]:
    prepared: list[tuple[str, str, bytes, list]] = []
    counts: Counter[str] = Counter()
    seen_federal: set[str] = set()
    cross_region_flags = []
    for filename, kind, registry, expected in FILES:
        file = seed_dir / filename
        if not file.is_file() or file.is_symlink() or file.stat().st_size > 5_000_000:
            raise ImportValidationError("Missing or unsafe seed file: " + filename)
        payload = file.read_bytes()
        rows = parse_export(payload, registry) if kind == "federal" else parse_snapshot(payload)
        if len(rows) != expected:
            raise ImportValidationError(
                f"{filename}: expected {expected} records, found {len(rows)}"
            )
        if kind == "federal":
            for candidate in rows:
                code = candidate.record.external_code
                if code in seen_federal:
                    raise ImportValidationError("Duplicate federal court code across files: " + code)
                seen_federal.add(code)
        else:
            for candidate in rows:
                if candidate.registry != registry:
                    raise ImportValidationError("Discovery registry mismatch: " + filename)
                if candidate.external_code and candidate.region_code and (
                    candidate.external_code[:2] != candidate.region_code
                ):
                    cross_region_flags.append({
                        "file": filename,
                        "code": candidate.external_code,
                        "region": candidate.region_code,
                        "reason": "Classification prefix mismatches listing region; editor must resolve",
                    })
        counts[kind] += len(rows)
        prepared.append((filename, kind, payload, rows))
    if counts["federal"] != 76 or counts["discovery"] != 197:
        raise ImportValidationError("Unexpected research corpus coverage")
    return prepared, {
        "scope": "historical_offline_official_directory_research",
        "captured_on": CAPTURED_ON.isoformat(),
        "records_total": sum(counts.values()),
        "complete_contact_candidates": counts["federal"],
        "discovery_candidates": counts["discovery"],
        "file_batches": len(prepared),
        "cross_region_flags": cross_region_flags,
        "published": 0,
        "verified": 0,
        "permissions_attested": 0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Stage previously collected unreviewed official court seeds"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--validate", action="store_true")
    group.add_argument("--stage", action="store_true")
    parser.add_argument("--confirm", action="store_true")
    parser.add_argument("--seed-dir", type=Path, default=ROOT)
    args = parser.parse_args()
    if args.stage and not args.confirm:
        parser.error("Database writes require --stage --confirm")
    try:
        staged, report = preflight(args.seed_dir)
        if args.stage:
            # Explicitly idempotent: each underlying importer keys a batch
            # by exact source URL and original file SHA256.
            report["batches"] = []
            for filename, kind, payload, rows in staged:
                result = (stage_federal(payload, rows, "sudrf-federal") if kind == "federal"
                          else stage_discovery(payload, rows, CAPTURED_ON))
                report["batches"].append({"file": filename, **result})
            report["database_staging_completed"] = True
        else:
            report["database_staging_completed"] = False
        print(json.dumps(report, ensure_ascii=False, indent=2))
    except ImportValidationError as exc:
        parser.exit(2, "Validation error: " + str(exc) + "\n")


if __name__ == "__main__":
    main()
