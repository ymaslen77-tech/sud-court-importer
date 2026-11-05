#!/usr/bin/env python3
"""Read-only bounded schema audit of private Moscow court JSON exports.

Shows field names/types and aggregate mapper results only. No record values,
participant names, decision texts, network requests, publication or Git writes.
"""
import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
from moscow_bulk_judge_pipeline import FIELDS, records, value, first_row, appeal_row, court_directory

FIRST = "1577116594824-casesgroupfirstcivilhxvgb"
APPEAL = "1577117744056-casesgroupmgsappealcivilwtxga"
FOLDER = Path("/srv/sudy-private/moscow-open-data")
NESTED_ALLOWED = ("judgeTeam", "lower", "category", "court", "documentType",
                  "result", "decision", "appeal", "acts", "documents")


def kind(obj):
    if obj is None: return "null"
    if isinstance(obj, bool): return "boolean"
    if isinstance(obj, dict): return "object"
    if isinstance(obj, list): return "array"
    if isinstance(obj, str): return "string"
    if isinstance(obj, (int, float)): return "number"
    return "other"


def safe_key(key):
    return isinstance(key, str) and len(key) <= 100 and all(
        ch.isalnum() or ch in "_ -./" for ch in key)


def audit(path, role, limit, mapping=None):
    if not 1 <= limit <= 3000: raise ValueError("Sample size must be 1..3000")
    if not path.is_file() or path.suffix.lower() not in (".json", ".ndjson"):
        raise ValueError("Expected a local JSON/NDJSON source")
    fields = defaultdict(Counter)
    nested = defaultdict(lambda: defaultdict(Counter))
    existing_aliases = Counter()
    outcomes = Counter()
    count = 0
    stream = records(path)
    try:
        for row in stream:
            if count >= limit: break
            count += 1
            if not isinstance(row, dict):
                outcomes["not_object"] += 1
                continue
            for key, item in row.items():
                if safe_key(key) and (len(fields) < 150 or key in fields):
                    fields[key][kind(item)] += 1
            for key in NESTED_ALLOWED:
                container = row.get(key)
                if isinstance(container, dict): items = (container,)
                elif isinstance(container, list): items = (
                    item for item in container[:3] if isinstance(item, dict))
                else: items = ()
                for item in items:
                    for child, val in item.items():
                        if safe_key(child) and (len(nested[key]) < 150 or child in nested[key]):
                            nested[key][child][kind(val)] += 1
            for name in FIELDS:
                if value(row, name) is not None:
                    existing_aliases[name] += 1
            if mapping is not None:
                if role == "first":
                    aliases, official, judges = mapping
                    _, reason = first_row(row, aliases, official, judges)
                else:
                    _, reason = appeal_row(row)
                outcomes[reason or "candidate_accepted"] += 1
    finally:
        stream.close()
    return {
        "sampledRecords": count,
        "topLevel": {k: dict(v) for k, v in sorted(fields.items())},
        "nestedFieldNamesOnly": {
            k: {x: dict(types) for x, types in sorted(children.items())}
            for k, children in sorted(nested.items())},
        "existingAliasMatches": dict(sorted(existing_aliases.items())),
        "existingImporterOutcomes": dict(sorted(outcomes.items())),
        "containsPersonalDataValues": False,
        "published": False,
    }


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--first", type=Path, default=FOLDER / (FIRST + ".json"))
    p.add_argument("--appeal", type=Path, default=FOLDER / (APPEAL + ".json"))
    p.add_argument("--limit", type=int, default=300)
    p.add_argument("--compact", action="store_true")
    args = p.parse_args(argv)
    directory = court_directory()
    data = {
        "first": audit(args.first, "first", args.limit, directory),
        "appeal": audit(args.appeal, "appeal", args.limit, directory),
    }
    if args.compact:
        data = {
            name: {
                "sampledRecords": section["sampledRecords"],
                "topLevelFields": sorted(section["topLevel"]),
                "nestedFieldNamesOnly": {
                    key: sorted(children)
                    for key, children in section["nestedFieldNamesOnly"].items()},
                "existingAliasMatches": section["existingAliasMatches"],
                "existingImporterOutcomes": section["existingImporterOutcomes"],
            }
            for name, section in data.items()
        }
    data["network"] = False
    data["containsPersonalDataValues"] = False
    data["published"] = False
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
