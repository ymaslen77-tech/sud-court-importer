#!/usr/bin/env python3
"""Read-only, bounded first-instance/appeal join probe using private Moscow JSON.

All original case values stay in local process memory. Only aggregate counts
go to stdout. NO database writes, no Git modifications, no network, no Deploy.
A match is TECHNICAL concordance, not independently verified judicial reasoning.
"""
import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path

from moscow_bulk_judge_pipeline import (
    appeal_row, court_directory, extract_initials, first_row, norm, records,
)
from moscow_preflight_triage import FIRST, APPEAL, PRIVATE


def judge_agrees(appeal_label, first):
    if not isinstance(appeal_label, str) or not appeal_label.strip():
        return False
    label = norm(appeal_label)
    if label in {norm(first["sourceJudgeLabel"]), norm(first["judgeName"])}:
        return True
    initials = extract_initials(label)
    return initials is not None and initials == extract_initials(
        first["sourceJudgeLabel"])


def first_sample(path, limit, mapping):
    if not path.is_file() or not 1 <= limit <= 100000:
        raise ValueError("Valid private first-instance file and 1..100000 limit required")
    aliases, official, judges = mapping
    index = defaultdict(dict)
    totals = Counter()
    uids = set()
    stream = records(path)
    try:
        for i, row in enumerate(stream):
            if i >= limit:
                break
            totals["sampled"] += 1
            candidate, reason = first_row(row, aliases, official, judges)
            if reason:
                totals["rejected_" + reason] += 1
                continue
            totals["accepted_row"] += 1
            key = (candidate["uin"], candidate["number"])
            uids.add(candidate["uin"])
            signature = (candidate["courtSlug"], candidate["judgeName"],
                         candidate["sourceJudgeLabel"])
            if signature in index[key]:
                totals["duplicate_identical"] += 1
            else:
                if index[key]:
                    totals["ambiguous_uid_number"] += 1
                index[key][signature] = candidate
    finally:
        stream.close()
    totals["distinct_uid_number_keys"] = len(index)
    totals["ambiguous_keys"] = sum(len(v) > 1 for v in index.values())
    return index, uids, dict(totals)


def appeal_sample(path, limit, index, first_uids):
    if not path.is_file() or not 1 <= limit <= 100000:
        raise ValueError("Valid private appeal file and 1..100000 limit required")
    totals = Counter()
    matched = set()
    stream = records(path)
    try:
        for i, row in enumerate(stream):
            if i >= limit:
                break
            totals["sampled"] += 1
            appeal, reason = appeal_row(row)
            if reason:
                totals["rejected_" + reason] += 1
                continue
            totals["field_level_candidates"] += 1
            hits = {}
            for lower in appeal["lower"]:
                key = (appeal["uin"], lower["number"])
                for signature, first in index.get(key, {}).items():
                    hits[(key, signature)] = (first, lower)
            if not hits:
                if appeal["uin"] in first_uids:
                    totals["uid_present_but_lower_number_not_matched"] += 1
                else:
                    totals["uid_absent_from_accepted_first_sample"] += 1
                continue
            if len(hits) != 1:
                totals["ambiguous_first_case_candidates"] += 1
                continue
            (case_key, signature), (first, lower) = next(iter(hits.items()))
            if not judge_agrees(lower["judgeLabel"], first):
                totals["lower_judge_not_concordant"] += 1
                continue
            totals["technical_correspondence"] += 1
            if case_key in matched:
                totals["repeated_appeal_to_same_first_case"] += 1
            matched.add(case_key)
    finally:
        stream.close()
    totals["distinct_first_cases_with_candidate_appeal"] = len(matched)
    return dict(totals)


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--first", type=Path, default=PRIVATE / (FIRST + ".json"))
    p.add_argument("--appeal", type=Path, default=PRIVATE / (APPEAL + ".json"))
    p.add_argument("--first-limit", type=int, default=30000)
    p.add_argument("--appeal-limit", type=int, default=3000)
    args = p.parse_args(argv)
    mapping = court_directory()
    index, first_uids, first_counts = first_sample(args.first, args.first_limit, mapping)
    appeal_counts = appeal_sample(args.appeal, args.appeal_limit, index, first_uids)
    result = {
        "first": first_counts,
        "appeal": appeal_counts,
        "sampleCaveat": "Only the FIRST N source records are examined; unmatched here does not mean an original case does not exist.",
        "matchCaveat": "Technical metadata concordance only, not verification of judicial text, legal reasoning or appeal result.",
        "participantValuesPrinted": False,
        "recordsPublished": 0,
        "network": False,
        "writesToDisk": False,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
