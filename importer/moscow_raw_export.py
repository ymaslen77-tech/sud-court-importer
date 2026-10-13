"""Offline inspection and explicit normalization of Moscow court-contact JSON.

Never infer unknown field names, synthesize a court code, download a website,
confirm data reuse rights, or publish a court. A human must inspect the actual
file, map its exact keys, and independently verify provenance/currentness.
"""
from __future__ import annotations
import argparse
from collections import Counter
from hashlib import sha256
import json
from pathlib import Path
import re

from contacts import MAX_BYTES, ImportValidationError, parse_export
from moscow_details import FIELDS as DETAIL_FIELDS, extract as validate_details

CORE_REQUIRED = ("courtCode", "courtName", "courtAddress", "courtSiteUrl")
CORE_OPTIONAL = ("courtTelephone", "courtEmail")
DETAIL_NAMES = tuple(k for k, _ in DETAIL_FIELDS)
ALLOWED = frozenset(CORE_REQUIRED + CORE_OPTIONAL + DETAIL_NAMES)
SHA256 = re.compile(r"^[a-f0-9]{64}$")
MAX_MAPPING_BYTES = 16384
MAX_ROWS = 5000


def read_raw(path: Path) -> tuple[bytes, list[dict]]:
    if not path.is_file() or path.stat().st_size > MAX_BYTES:
        raise ImportValidationError("Raw export missing or exceeds 5 MB")
    raw = path.read_bytes()
    try:
        document = json.loads(raw.decode("utf-8-sig"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ImportValidationError("Raw export is not UTF-8 JSON") from exc
    if isinstance(document, dict):
        if isinstance(document.get("data"), list):
            document = document["data"]
        elif isinstance(document.get("records"), list):
            document = document["records"]
    if not isinstance(document, list) or not 1 <= len(document) <= MAX_ROWS:
        raise ImportValidationError("Expected a non-empty JSON records array (max 5000)")
    if any(not isinstance(row, dict) for row in document):
        raise ImportValidationError("Each raw record must be an object")
    return raw, document


def inspect(raw: bytes, records: list[dict]) -> dict:
    field_types: dict[str, Counter] = {}
    for record in records:
        if len(record) > 200:
            raise ImportValidationError("Too many fields in raw record")
        for key, value in record.items():
            if not isinstance(key, str) or not 1 <= len(key) <= 150:
                raise ImportValidationError("Invalid source field name")
            if len(field_types) > 200:
                raise ImportValidationError("Too many different source fields")
            if value is None:
                kind = "null"
            elif isinstance(value, bool):
                kind = "boolean"
            elif isinstance(value, str):
                kind = "string"
            elif isinstance(value, (int, float)):
                kind = "number"
            elif isinstance(value, list):
                kind = "array"
            else:
                kind = "object"
            field_types.setdefault(key, Counter())[kind] += 1
    return {
        "raw_sha256": sha256(raw).hexdigest(),
        "record_count": len(records),
        "source_keys_and_types": [
            {"key": key, "types": dict(sorted(types.items()))}
            for key, types in sorted(field_types.items())
        ],
        "source_values_included": False,
        "source_rights_verified": False,
        "currentness_verified": False,
        "published": 0
    }


def load_mapping(path: Path) -> dict[str, str]:
    if not path.is_file() or path.stat().st_size > MAX_MAPPING_BYTES:
        raise ImportValidationError("Missing or oversized mapping configuration")
    try:
        configuration = json.loads(path.read_text(encoding="utf-8"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ImportValidationError("Invalid mapping JSON") from exc
    if not isinstance(configuration, dict) or set(configuration) != {"fields"}:
        raise ImportValidationError("Mapping must contain only a fields object")
    mapping = configuration["fields"]
    if not isinstance(mapping, dict) or not set(CORE_REQUIRED).issubset(mapping) or set(mapping) - ALLOWED:
        raise ImportValidationError("Mapping must declare each mandatory target and no unsupported fields")
    if any(not isinstance(key, str) or not isinstance(value, str) or
           not 1 <= len(value) <= 150 for key, value in mapping.items()):
        raise ImportValidationError("Mapping fields require literal source key names")
    if len(set(mapping.values())) != len(mapping):
        raise ImportValidationError("Each source key must map to exactly one target")
    return mapping


def normalize(raw: bytes, records: list[dict], mapping: dict[str, str],
              expected_digest: str, attested: bool) -> tuple[bytes, dict]:
    if not attested or not SHA256.fullmatch(expected_digest or ""):
        raise ImportValidationError("Reviewed schema and exact raw SHA-256 are mandatory")
    if sha256(raw).hexdigest() != expected_digest:
        raise ImportValidationError("Raw export checksum mismatch")
    normalized = []
    for index, row in enumerate(records, start=1):
        mapped = {}
        for target, source in mapping.items():
            if source not in row:
                if target in CORE_REQUIRED:
                    raise ImportValidationError(f"Record {index}: missing mandatory source key for {target}")
                continue
            mapped[target] = row[source]
        # All values remain source-provided, without lookup/inference. Optional
        # detailed fields may be nested, but have strict validation in their parser.
        validate_details(mapped)
        normalized.append(mapped)
    # This validates actual court codes, official page URLs and uniqueness before
    # anything is written, so no guessed identifier can pass automatically.
    candidates = parse_export(json.dumps(normalized, ensure_ascii=False,
                        separators=(",", ":"), allow_nan=False).encode("utf-8"))
    compact = json.dumps(normalized, ensure_ascii=False, sort_keys=True,
                         separators=(",", ":"), allow_nan=False).encode("utf-8")
    if len(compact) > MAX_BYTES:
        raise ImportValidationError("Normalized export exceeds 5 MB")
    return compact, {
        "raw_sha256": expected_digest,
        "normalized_sha256": sha256(compact).hexdigest(),
        "record_count": len(candidates),
        "source_rights_verified": False,
        "currentness_verified": False,
        "auto_published": 0,
        "next_step": "Operator must separately verify official dataset URL, terms and each candidate"
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Offline evidence inspection/normalization; no publication")
    sub = parser.add_subparsers(dest="action", required=True)
    view = sub.add_parser("inspect")
    view.add_argument("file", type=Path)
    convert = sub.add_parser("normalize")
    convert.add_argument("file", type=Path)
    convert.add_argument("--mapping", type=Path, required=True)
    convert.add_argument("--expected-sha256", required=True)
    convert.add_argument("--attest-schema-reviewed", action="store_true")
    convert.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        raw, records = read_raw(args.file)
        if args.action == "inspect":
            result = inspect(raw, records)
        else:
            mapping = load_mapping(args.mapping)
            normalized, result = normalize(raw, records, mapping,
                             args.expected_sha256, args.attest_schema_reviewed)
            # No overwritten or symlinked destination. An operator must explicitly
            # choose a new destination for every normalized snapshot.
            with args.output.open("xb") as stream:
                stream.write(normalized)
            result["output"] = str(args.output)
    except (ImportValidationError, OSError, ValueError) as exc:
        parser.exit(2, "Validation error: " + str(exc) + "\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
