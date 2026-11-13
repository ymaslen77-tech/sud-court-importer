#!/usr/bin/env python3
"""Read-only triage for real Moscow court exports.

Reports ONLY counts and field shapes: no participant values, judges' names,
case numbers, URLs or judicial texts. The existing import and publishing
pipeline remains unchanged. The first N records are a NONREPRESENTATIVE sample.
"""
import argparse
from collections import Counter
import json
from pathlib import Path

from moscow_bulk_judge_pipeline import (
    UIN, NUMBER, appeal_row, court_directory, date_str, first_row,
    judge_for, norm, plain, records, value,
)

FIRST = "1577116594824-casesgroupfirstcivilhxvgb"
APPEAL = "1577117744056-casesgroupmgsappealcivilwtxga"
PRIVATE = Path("/srv/sudy-private/moscow-open-data")


def safe_type(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, dict):
        return "object"
    if isinstance(value, list):
        return "array"
    if isinstance(value, str):
        return "string"
    if isinstance(value, (int, float)):
        return "number"
    return "other"


def judge_evidence(row, aliases, judges):
    court = aliases.get(norm(plain(value(row, "court"), 150)))
    if not court:
        return "court_not_in_35"
    candidate = value(row, "judge")
    if candidate is None:
        return "judge_field_missing"
    if not isinstance(candidate, str):
        return "judge_field_wrong_type"
    if not candidate.strip():
        return "judge_field_blank"
    judge, basis = judge_for(candidate, court, judges)
    return ("roster_" + basis) if judge else "not_unique_in_official_roster"


def uid_evidence(row):
    candidate = value(row, "uin")
    if candidate is None:
        return "missing"
    if not isinstance(candidate, str):
        return "wrong_type"
    return "matches_pattern" if UIN.fullmatch(candidate.strip()) else "other_format"


def appeal_lower_evidence(row):
    lower = value(row, "first")
    if lower is None:
        return ("missing", 0, 0, 0)
    if not isinstance(lower, list):
        return ("not_array", 0, 0, 0)
    if not lower:
        return ("empty", 0, 0, 0)
    valid = invalid = judges_present = 0
    for item in lower[:100]:
        if not isinstance(item, dict):
            invalid += 1
            continue
        number = item.get("number")
        if not isinstance(number, str):
            number = next(
                (v for k in ("Номер дела в суде нижестоящей инстанции",
                             "Номер дела", "caseNumber")
                 if isinstance((v := item.get(k)), str)), "")
        if NUMBER.fullmatch(number.strip()):
            valid += 1
        else:
            invalid += 1
        direct_judge = next(
            (item.get(k) for k in ("judge", "Судья первой инстанции", "Судья")
             if isinstance(item.get(k), str) and item.get(k).strip()), None)
        if direct_judge:
            judges_present += 1
    return ("has_valid_number" if valid else "no_valid_number",
            valid, invalid, judges_present)


def audit_one(path, role, limit, mapping):
    if limit < 1 or limit > 5000:
        raise ValueError("limit must be between 1 and 5000")
    if not path.is_file() or path.suffix.lower() not in {".json", ".ndjson"}:
        raise ValueError("Missing private JSON/NDJSON export")
    aliases, official, judges = mapping
    counts = Counter()
    outcomes = Counter()
    uids = Counter()
    judge_field = Counter()
    judge_team_type = Counter()
    lower_status = Counter()
    lower_entries = Counter()
    sampled = 0
    stream = records(path)
    try:
        for row in stream:
            if sampled >= limit:
                break
            sampled += 1
            if not isinstance(row, dict):
                outcomes["not_an_object"] += 1
                continue
            uids[uid_evidence(row)] += 1
            if role == "first":
                _, why = first_row(row, aliases, official, judges)
                outcomes[why or "candidate_accepted"] += 1
                judge_field[judge_evidence(row, aliases, judges)] += 1
                judge_team_type[safe_type(row.get("judgeTeam"))] += 1
            else:
                _, why = appeal_row(row)
                outcomes[why or "candidate_accepted"] += 1
                status, valid, invalid, labels = appeal_lower_evidence(row)
                lower_status[status] += 1
                lower_entries["valid_number"] += valid
                lower_entries["other_or_invalid_number"] += invalid
                lower_entries["has_judge_label"] += labels
    finally:
        stream.close()
    if not sampled:
        raise ValueError("Empty source: cannot report as successful sample")
    summary = {
        "sampledRows": sampled,
        "existingImporterResults": dict(sorted(outcomes.items())),
        "uidPattern": dict(sorted(uids.items())),
    }
    if role == "first":
        summary["judgeFieldRosterEvidence"] = dict(sorted(judge_field.items()))
        summary["judgeTeamTypes"] = dict(sorted(judge_team_type.items()))
        summary["lowerReferenceInterpretation"] = "not_applied_to_first_instance"
    else:
        summary["judgeRosterInterpretation"] = "not_applicable_mgs_appeal"
        summary["lowerReferenceByRow"] = dict(sorted(lower_status.items()))
        summary["lowerReferenceEntries"] = dict(sorted(lower_entries.items()))
        summary["appealCandidateNote"] = (
            "The field-level candidates are NOT linked cases or checked appeal results")
    return summary


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--first", type=Path, default=PRIVATE / (FIRST + ".json"))
    p.add_argument("--appeal", type=Path, default=PRIVATE / (APPEAL + ".json"))
    p.add_argument("--limit", type=int, default=1000)
    args = p.parse_args(argv)
    mapping = court_directory()
    result = {
        "first": audit_one(args.first, "first", args.limit, mapping),
        "appeal": audit_one(args.appeal, "appeal", args.limit, mapping),
        "sampleInterpretation": "First N records only; not statistically representative",
        "rawValuesIncluded": False,
        "network": False,
        "writesToDisk": False,
        "published": False,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
