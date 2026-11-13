#!/usr/bin/env python3
"""Read-only bounded schema audit of private Moscow court JSON exports.

Shows field names/types and aggregate mapper results only. No record values,
participant names, decision texts, network requests, publication or Git writes.
"""
import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
from moscow_bulk_judge_pipeline import (FIELDS, NUMBER, UIN, records, value, first_row,
    appeal_row, court_directory, date_str, url_check, judge_for, norm, plain)

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
    formats = defaultdict(Counter)
    judge_team_matches = Counter()
    lower_reference_formats = Counter()
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
            # Aggregate format validation ONLY; never output values or samples.
            # "uid" field existence does not prove it is a valid 77RS UIN.
            uid_candidate = value(row, "uin")
            if uid_candidate in (None, ""):
                formats["uin"]["missing"] += 1
            elif not isinstance(uid_candidate, str):
                formats["uin"]["non_string"] += 1
            elif UIN.fullmatch(uid_candidate.strip()):
                formats["uin"]["matches_current_pattern"] += 1
            else:
                formats["uin"]["other_format"] += 1
            case_number = value(row, "number")
            if case_number in (None, ""):
                formats["number"]["missing"] += 1
            elif isinstance(case_number, str) and NUMBER.fullmatch(case_number.strip()):
                formats["number"]["matches_current_pattern"] += 1
            else:
                formats["number"]["other_format"] += 1
            official_url = value(row, "url")
            prefix = "/rs/" if role == "first" else "/mgs/services/cases/appeal-"
            formats["url"]["official_expected_path" if url_check(official_url, prefix)
                           else "missing_or_other_path"] += 1
            for key in ("judgeTeam", "lower", "dateReg", "dateFinal"):
                if key in row:
                    formats[key][kind(row[key])] += 1
                else:
                    formats[key]["missing"] += 1
            for field in ("date", "regdate"):
                raw_date = value(row, field)
                if raw_date is None:
                    formats[field]["missing"] += 1
                elif date_str(raw_date):
                    formats[field]["recognized_date"] += 1
                else:
                    formats[field]["other_date_format"] += 1
            # Determine whether judgeTeam equals one known judge for this exact court,
            # without publishing a name or interpreting arbitrary team strings as judges.
            if mapping is not None:
                aliases, _, judges = mapping
                court_slug = aliases.get(norm(plain(value(row, "court"), 150)))
                team = row.get("judgeTeam")
                if not isinstance(team, str):
                    judge_team_matches["not_a_string"] += 1
                elif not team.strip():
                    judge_team_matches["empty_string"] += 1
                elif not court_slug:
                    judge_team_matches["court_not_in_35"] += 1
                else:
                    matched, basis = judge_for(team, court_slug, judges)
                    judge_team_matches[basis if matched else "unknown_or_ambiguous"] += 1
            lower = row.get("lower")
            if not isinstance(lower, list):
                lower_reference_formats["missing_or_not_array"] += 1
            elif not lower:
                lower_reference_formats["empty_array"] += 1
            else:
                for item in lower[:100]:
                    if not isinstance(item, dict):
                        lower_reference_formats["not_an_object"] += 1
                        continue
                    number = item.get("number")
                    if not isinstance(number, str) or not number.strip():
                        lower_reference_formats["number_missing_or_wrong_type"] += 1
                    elif NUMBER.fullmatch(number.strip()):
                        lower_reference_formats["number_matches_current_pattern"] += 1
                    else:
                        lower_reference_formats["number_other_format"] += 1
                    lower_reference_formats["judge_present" if isinstance(item.get("judge"), str)
                                            and item["judge"].strip() else "judge_missing"] += 1
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
        "fieldFormatCounts": {k: dict(v) for k, v in sorted(formats.items())},
        "judgeTeamRosterMatch": dict(sorted(judge_team_matches.items())),
        "lowerReferenceFormat": dict(sorted(lower_reference_formats.items())),
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
                "fieldFormatCounts": section["fieldFormatCounts"],
                "judgeTeamRosterMatch": section["judgeTeamRosterMatch"],
                "lowerReferenceFormat": section["lowerReferenceFormat"],
                "fieldTypes": {key: section["topLevel"].get(key, {})
                               for key in ("uid", "number", "url", "judgeTeam", "lower",
                                           "category", "dateFinal", "dateReg")},
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
