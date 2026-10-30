"""Read-only readiness check for *licensed* nationwide court source exports.

Never crawls a third-party site and never inserts or publishes courts.
The data owner/official source and rights for bulk reuse require independent
documentary confirmation. This tool only audits local JSON candidate files.

Usage:
 python importer/national_registry_preflight.py --file /path/to/courts.json
 python importer/national_registry_preflight.py --file /path/to/courts.json --manifest /path/to/source.json

Expected rows are objects with:
 name, region_code, kind, source_url, observed_on, official_code?, registry?, official_url?
A name, street, email, office-holder, or source site alone DOES NOT verify a court.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import date
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

BASE = Path(__file__).resolve().parents[1]
REGIONS = BASE / "apps/web/app/lib/regions.ts"
MAX_BYTES = 24_000_000
MAX_ROWS = 20_000
CATEGORIES = frozenset({
    "constitutional", "supreme", "general-magistrate", "general-district",
    "general-regional", "general-appeal", "general-cassation",
    "military-garrison", "military-district", "military-appeal",
    "military-cassation", "arbitration-subject", "arbitration-appeal",
    "arbitration-district", "arbitration-ip",
})
FIELDS = frozenset({
    "name", "region_code", "kind", "source_url", "observed_on",
    "official_code", "registry", "official_url", "address",
})
REQUIRED = frozenset({"name", "region_code", "kind", "source_url", "observed_on"})


def _https(url: object) -> bool:
    if not isinstance(url, str) or len(url) > 1600:
        return False
    try:
        u = urlsplit(url)
        return u.scheme == "https" and bool(u.hostname) and u.port in (None, 443) and not (
            u.username or u.password or u.fragment
        )
    except ValueError:
        return False


def _safe_file(path: Path) -> bytes:
    if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_BYTES:
        raise ValueError("Missing, symlink or oversized input")
    return path.read_bytes()


def region_codes(path: Path = REGIONS) -> set[str]:
    text = _safe_file(path).decode("utf-8")
    codes = set(re.findall(r"^\s*\['(\d{2})','", text, flags=re.M))
    if len(codes) != 89:
        raise ValueError(f"Expected 89 codes in maintained regional taxonomy, found {len(codes)}")
    return codes


def source_declaration(path: Path | None) -> dict:
    if path is None:
        return {"documentation_declared": False, "source_authorisation_verified": False}
    raw = json.loads(_safe_file(path))
    if not isinstance(raw, dict):
        raise ValueError("Source manifest must be an object")
    keys = {"provider", "dataset_url", "terms_url", "license_or_permission_url",
            "bulk_access_declared", "reuse_declared", "reviewed_on"}
    if set(raw) != keys:
        raise ValueError("Unexpected rights/source manifest fields")
    if any(not _https(raw[k]) for k in ("dataset_url", "terms_url", "license_or_permission_url")):
        raise ValueError("Missing HTTPS primary rights document URLs")
    if any(not isinstance(raw[k], bool) for k in ("bulk_access_declared", "reuse_declared")):
        raise ValueError("Permission statements must be explicit booleans")
    if not isinstance(raw["provider"], str) or len(raw["provider"].strip()) < 3:
        raise ValueError("Source provider missing")
    reviewed = date.fromisoformat(raw["reviewed_on"])
    if reviewed > date.today():
        raise ValueError("Manifest review cannot be in future")
    return {
        "provider": raw["provider"],
        "documentation_declared": bool(raw["bulk_access_declared"] and raw["reuse_declared"]),
        "source_authorisation_verified": False,  # Needs actual human/legal verification.
    }


def audit(corpus: Path, manifest: Path | None = None, region_file: Path = REGIONS) -> dict:
    regions = region_codes(region_file)
    payload = json.loads(_safe_file(corpus))
    if not isinstance(payload, list):
        raise ValueError("Expected JSON array of court candidates")
    if len(payload) > MAX_ROWS:
        raise ValueError("Too many rows in one offline audit")
    counts: Counter[str] = Counter()
    by_region: Counter[str] = Counter()
    exact_seen: set[tuple[str, str]] = set()
    provisional_seen: set[tuple[str, str, str]] = set()
    duplicated_codes: list[int] = []
    suspected_duplicates: list[int] = []
    missing_official_codes = 0
    missing_official_urls = 0
    name_only = 0
    flagged = []
    for index, row in enumerate(payload, 1):
        if not isinstance(row, dict) or not REQUIRED.issubset(row) or set(row) - FIELDS:
            raise ValueError(f"Row {index} has invalid fields")
        name = row["name"]
        if not isinstance(name, str) or not (4 <= len(name.strip()) <= 250):
            raise ValueError(f"Row {index} has invalid court name")
        region = row["region_code"]
        kind = row["kind"]
        if region not in regions or kind not in CATEGORIES:
            raise ValueError(f"Row {index}: unknown region or court category")
        if not _https(row["source_url"]):
            raise ValueError(f"Row {index}: invalid HTTPS source URL")
        observed = date.fromisoformat(row["observed_on"])
        if observed > date.today():
            raise ValueError(f"Row {index}: future observation date")
        registry = row.get("registry")
        code = row.get("official_code")
        official_url = row.get("official_url")
        if registry is not None and (not isinstance(registry, str) or len(registry) > 80):
            raise ValueError(f"Row {index}: invalid registry name")
        if code is not None and (not isinstance(code, str) or not re.fullmatch(r"[\w.-]{3,70}", code, re.ASCII)):
            raise ValueError(f"Row {index}: invalid official code")
        if official_url is not None and not _https(official_url):
            raise ValueError(f"Row {index}: invalid official URL")
        if not code or not registry:
            missing_official_codes += 1
        else:
            key = (registry.lower(), code.upper())
            if key in exact_seen:
                duplicated_codes.append(index)
            exact_seen.add(key)
        if not official_url:
            missing_official_urls += 1
        if not code and not official_url:
            name_only += 1
        fingerprint = (region, kind, re.sub(r"\s+", " ", name.strip().casefold().replace("ё", "е")))
        if fingerprint in provisional_seen:
            suspected_duplicates.append(index)
        provisional_seen.add(fingerprint)
        counts[kind] += 1
        by_region[region] += 1
        if len(flagged) < 100 and (not code or not registry or not official_url):
            flagged.append({"row": index, "missing_official_code": not bool(code and registry),
                            "missing_official_url": not bool(official_url)})
    src = source_declaration(manifest)
    absent = sorted(regions - set(by_region))
    return {
        "scope": "third_party_or_official_offline_candidates_not_live_verified",
        "candidate_rows": len(payload),
        "regions_present": len(by_region),
        "regions_missing_from_batch": absent,
        "court_types": dict(sorted(counts.items())),
        "regions": dict(sorted(by_region.items())),
        "missing_official_registry_codes": missing_official_codes,
        "missing_official_urls": missing_official_urls,
        "name_only_candidates": name_only,
        "duplicate_official_registry_code_rows": duplicated_codes,
        "suspected_duplicate_names_rows": suspected_duplicates,
        "sample_unresolved_rows": flagged,
        "source": src,
        "actual_courts_verified": 0,
        "published": 0,
        "database_writes": 0,
        "network_requests": 0,
        "may_be_auto_published": False,
        "notice": "Audit is not evidence of completeness or a license. Official corroboration and editor approval required.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Offline non-publishing nationwide courts corpus audit")
    parser.add_argument("--file", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, default=None)
    args = parser.parse_args()
    print(json.dumps(audit(args.file, args.manifest), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
