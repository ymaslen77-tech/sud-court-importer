"""AllCourts nationwide snapshot quality gate. OFFLINE, read-only, no imports.

Accepts a lawful JSON/CSV export and an explicit supplier field mapping (since
the private API response schema has not been supplied). Reports duplicates,
missing codes/sites, unclassified types, stale records and evidence mismatches.
Never calls third-party APIs, changes the DB or approves court publication.

python importer/allcourts_dataset_audit.py \
  --file /private/allcourts.csv --mapping /private/mapping.json \
  --official /private/official-courts.json --as-of 2026-10-30
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
from datetime import date
import json
from pathlib import Path
import re
from typing import Any
from urllib.parse import urlsplit

from national_registry_preflight import region_codes, CATEGORIES, MAX_BYTES, MAX_ROWS

KNOWN_STATUS = {"active", "inactive", "closed", "renamed", "merged", "unknown"}
MAX_ISSUES = 250
REQUIRED_MAPPING = {"name", "region_code", "kind", "official_code", "observed_on"}
OPTIONAL_MAPPING = {"official_url", "status", "address", "registry", "source_url"}
FIELDS = REQUIRED_MAPPING | OPTIONAL_MAPPING
STANDARD_CODE = re.compile(r"^[A-Z0-9][A-Z0-9._-]{2,69}$", re.ASCII)


def read_blob(path: Path) -> bytes:
    if not path.is_file() or path.is_symlink() or path.stat().st_size > MAX_BYTES:
        raise ValueError("Missing, symlinked or oversized local input")
    return path.read_bytes()


def read_rows(path: Path) -> list[dict[str, Any]]:
    raw = read_blob(path)
    if path.suffix.lower() == ".csv":
        text = raw.decode("utf-8-sig")
        lines = text.splitlines()
        result = list(csv.DictReader(lines))
    elif path.suffix.lower() == ".json":
        result = json.loads(raw)
    else:
        raise ValueError("Only .csv and .json exports are supported")
    if not isinstance(result, list) or len(result) > MAX_ROWS:
        raise ValueError("Expected JSON array/CSV with at most 20,000 rows")
    if not all(isinstance(x, dict) for x in result):
        raise ValueError("All rows must be objects")
    return result


def read_mapping(path: Path) -> tuple[dict[str, str], dict[str, str]]:
    doc = json.loads(read_blob(path))
    if not isinstance(doc, dict) or set(doc) != {"fields", "court_type_map"}:
        raise ValueError("Mapping requires fields and court_type_map")
    fields, kinds = doc["fields"], doc["court_type_map"]
    if not isinstance(fields, dict) or not REQUIRED_MAPPING <= fields.keys() or set(fields) - FIELDS:
        raise ValueError("Mapping must specify required court fields")
    if not isinstance(kinds, dict) or not kinds or not all(v in CATEGORIES for v in kinds.values()):
        raise ValueError("Type map must use known internal court kinds")
    if not all(isinstance(v, str) and v and len(v) <= 100 for v in fields.values()):
        raise ValueError("Invalid field column name")
    return fields, kinds


def _txt(row: dict, column: str | None) -> str:
    if not column:
        return ""
    value = row.get(column)
    return value.strip() if isinstance(value, str) else ""


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.casefold().replace("ё", "е")).strip()


def _valid_url(s: str) -> bool:
    try:
        u = urlsplit(s)
        return u.scheme == "https" and bool(u.hostname) and not (u.username or u.password)
    except ValueError:
        return False


def _issue(issues: list, row: int, kind: str, **details: str) -> None:
    if len(issues) < MAX_ISSUES:
        issues.append({"row": row, "issue": kind, **details})


def audit_dataset(
    rows: list[dict], mapping: dict[str, str], type_map: dict[str, str],
    official: list[dict] | None = None, *, as_of: date,
    region_file: Path | None = None,
) -> dict:
    regions = region_codes(region_file) if region_file else region_codes()
    official_index: dict[str, dict] = {}
    for entry in official or []:
        if not isinstance(entry, dict):
            raise ValueError("Official reference rows must be objects")
        code = _txt(entry, "official_code").upper()
        if not code or code in official_index:
            raise ValueError("Missing/duplicate code in independent official reference")
        official_index[code] = entry

    counts: Counter[str] = Counter()
    regions_found: Counter[str] = Counter()
    states: Counter[str] = Counter()
    problems: Counter[str] = Counter()
    issues: list[dict] = []
    seen_codes: dict[str, int] = {}
    seen_names: dict[tuple[str, str, str], int] = {}
    code_collisions: list[int] = []
    name_collisions: list[int] = []
    official_matches = 0
    official_name_mismatches = 0
    official_region_mismatches = 0
    total = len(rows)
    for pos, row in enumerate(rows, 1):
        name = _txt(row, mapping.get("name"))
        region = _txt(row, mapping.get("region_code"))
        external_kind = _txt(row, mapping.get("kind"))
        kind = type_map.get(external_kind)
        code = _txt(row, mapping.get("official_code")).upper()
        status = _txt(row, mapping.get("status")).lower() or "unknown"
        official_url = _txt(row, mapping.get("official_url"))
        observed_raw = _txt(row, mapping.get("observed_on"))
        if not name or len(name) > 250:
            problems["invalid_name"] += 1
            _issue(issues, pos, "invalid_name")
        if region not in regions:
            problems["unknown_region"] += 1
            _issue(issues, pos, "unknown_region", region_code=region[:15])
        else:
            regions_found[region] += 1
        if not kind:
            problems["unknown_kind"] += 1
            _issue(issues, pos, "unmapped_court_type", source_type=external_kind[:90])
        else:
            counts[kind] += 1
        if not code or not STANDARD_CODE.fullmatch(code):
            problems["missing_or_invalid_official_code"] += 1
            _issue(issues, pos, "missing_or_invalid_official_code")
        else:
            if code in seen_codes:
                code_collisions.append(pos)
                _issue(issues, pos, "duplicate_official_code", first_row=str(seen_codes[code]), code=code)
            else:
                seen_codes[code] = pos
        if region in regions and name and kind:
            name_key = (region, kind, _norm(name))
            if name_key in seen_names:
                name_collisions.append(pos)
                _issue(issues, pos, "possible_duplicate_name", first_row=str(seen_names[name_key]))
            else:
                seen_names[name_key] = pos
        if not official_url or not _valid_url(official_url):
            problems["missing_or_invalid_official_site"] += 1
            _issue(issues, pos, "missing_or_invalid_official_site")
        if status not in KNOWN_STATUS:
            problems["unknown_status_value"] += 1
            _issue(issues, pos, "unknown_status_value", value=status[:30])
        states[status] += 1
        if status in {"inactive", "closed", "merged", "renamed"}:
            problems["possibly_not_active"] += 1
            _issue(issues, pos, "possibly_not_active", status=status)
        try:
            seen = date.fromisoformat(observed_raw)
            if seen > as_of:
                raise ValueError
            if (as_of-seen).days > 180:
                problems["stale_over_180_days"] += 1
                _issue(issues, pos, "stale_record", observed_on=observed_raw)
        except ValueError:
            problems["missing_or_invalid_observation_date"] += 1
            _issue(issues, pos, "missing_or_invalid_observation_date")
        if code and code in official_index:
            official_matches += 1
            reference = official_index[code]
            # Different code systems sometimes have different 2-digit prefixes.
            # We compare explicit official region field, not the court-code prefix.
            ref_name = _txt(reference, "name")
            ref_region = _txt(reference, "region_code")
            if ref_name and _norm(ref_name) != _norm(name):
                official_name_mismatches += 1
                _issue(issues, pos, "official_name_mismatch", code=code)
            if ref_region and region != ref_region:
                official_region_mismatches += 1
                _issue(issues, pos, "official_region_mismatch", code=code)
            ref_status = _txt(reference, "status").lower()
            if ref_status in {"inactive", "closed", "merged"}:
                problems["officially_not_active"] += 1
                _issue(issues, pos, "officially_not_active", code=code)
    return {
        "source": "vendor_snapshot_offline_quality_audit",
        "rows": total,
        "unique_nonempty_codes": len(seen_codes),
        "duplicate_code_rows": code_collisions[:MAX_ISSUES],
        "possible_duplicate_name_rows": name_collisions[:MAX_ISSUES],
        "courts_by_category": dict(sorted(counts.items())),
        "regions_present": len(regions_found),
        "regions_absent_from_snapshot": sorted(regions - set(regions_found)),
        "by_region": dict(sorted(regions_found.items())),
        "status_counts": dict(sorted(states.items())),
        "problem_counts": dict(sorted(problems.items())),
        "independent_reference_total": len(official_index),
        "independent_reference_matched": official_matches,
        "independent_name_conflicts": official_name_mismatches,
        "independent_region_conflicts": official_region_mismatches,
        "sample_issues": issues,
        "more_issues_not_shown": sum(problems.values()) + len(code_collisions) + len(name_collisions) > len(issues),
        "publishable_or_verified": 0,
        "database_writes": 0,
        "external_requests": 0,
        "attention": "Vendor active status and identical names/codes do NOT verify live existence. Requires independent court registry review and allowed reuse.",
    }


def main() -> None:
    p=argparse.ArgumentParser(description="Audit legal AllCourts CSV/JSON snapshot offline; never import to DB")
    p.add_argument("--file",type=Path,required=True)
    p.add_argument("--mapping",type=Path,required=True)
    p.add_argument("--official",type=Path)
    p.add_argument("--as-of",default=date.today().isoformat())
    args=p.parse_args()
    mapping,kinds=read_mapping(args.mapping)
    official=read_rows(args.official) if args.official else None
    result=audit_dataset(read_rows(args.file),mapping,kinds,official,as_of=date.fromisoformat(args.as_of))
    print(json.dumps(result,indent=2,ensure_ascii=False))


if __name__=="__main__":
    main()
