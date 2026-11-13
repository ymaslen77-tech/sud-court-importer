#!/usr/bin/env python3
"""Offline Moscow district-court publication readiness: aggregate-only report.

This checks *which kinds of evidence* exist, never claims a historical judge
roster is current, or that an open case is a verified legal decision.
No network, raw case records, private data, deployment, or automatic publication.
"""
import argparse
from collections import Counter
import json
from pathlib import Path

DEFAULT_DATA = Path(__file__).resolve().parents[1] / "apps/web/app/data"
ROSTER_FILES = (
    "moscow-district-judges-samples.json",
    "moscow-legacy-judge-rosters.json",
    "moscow-additional-judge-rosters.json",
    "moscow-2026-roster-refresh.json",
)
PROHIBITED = {"publication_forbidden", "preparing_publication"}


def entries(root, name):
    path = root / name
    obj = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(obj, dict) or not isinstance(obj.get("records"), list):
        raise ValueError("Expected records array in source: " + name)
    return obj["records"]


def readiness(root=DEFAULT_DATA):
    registry = entries(root, "moscow-official-minimum-registry.json")
    courts = {r["slug"]:r for r in registry if r.get("kind") == "general-district"}
    if len(courts) != 35:
        raise ValueError("Official Moscow district court count is not 35")
    practical = entries(root, "moscow-district-practical-facts.json")
    practical_slugs = {r["slug"] for r in practical}
    if len(practical) != len(practical_slugs) or practical_slugs != set(courts):
        raise ValueError("Sourced practical facts do not cover exactly the 35 courts")
    published_rosters = [r for name in ROSTER_FILES for r in entries(root,name)]
    roster_by_court = {}
    for r in published_rosters:
        slug = r["slug"]
        if slug not in courts or slug in roster_by_court:
            raise ValueError("Duplicate/non-Moscow full-roster publication")
        if not r.get("judges") or not isinstance(r["judges"], list):
            raise ValueError("Roster must retain its source list")
        if not str(r.get("sourceUrl","")).startswith("https://"):
            raise ValueError("Roster has no secure source")
        roster_by_court[slug]=r
    full_text = entries(root, "moscow-judge-reviewed-decisions.json")
    queue = entries(root, "moscow-court-judgment-review-queue.json")
    queued_blocked = {(r["courtSlug"], r["number"]) for r in queue
                      if r.get("publicationStatus") in PROHIBITED}
    seen_reviewed = set()
    for row in full_text:
        key=(row["courtSlug"],row["caseNumber"])
        if key in queued_blocked:
            raise ValueError("Prohibited/unpublished judicial text must not be published")
        if key in seen_reviewed:
            raise ValueError("Duplicate approved full-text court act")
        seen_reviewed.add(key)
        if row.get("fullTextVerified") is not True or row.get("publicationPermissionChecked") is not True:
            raise ValueError("An unverified/unpermitted decision is in approved data")
    cases = entries(root, "moscow-judge-case-evidence.json")
    bulk = entries(root, "moscow-judge-bulk-cases.json")
    cross = entries(root, "moscow-judge-crosschecked-cases.json")
    if any(r.get("courtSlug") not in courts for r in cases + bulk):
        raise ValueError("Case refers to unknown district court")
    for row in cross:
        if row.get("appealResult") is not None and not row.get("fullTextVerified"):
            # A real appeal result may be established by official case registry
            # but must not silently masquerade as a *verified full-text holding*.
            raise ValueError("Unverified appeal result requires explicit separate review")
    thin = sorted(set(courts)-set(roster_by_court))
    return {
      "scope": "35 district courts of Moscow city; NOT Moscow Oblast",
      "sourcedPracticalFactSections": len(practical_slugs),
      "courtsWithHistoricalPublishedRoster": len(roster_by_court),
      "courtsWithoutFullOfficialRosterInLocalArchive": thin,
      "historicalRosterIsCurrentEmploymentProof": False,
      "caseSampleRecords": len(cases),
      "bulkMetadataRecords": len(bulk),
      "crossRegisterCaseLinks": len(cross),
      "editoriallyReviewedFullTexts": len(full_text),
      "awaitingOfficialFullTextReview": dict(Counter(r.get("publicationStatus","unknown") for r in queue)),
      "allFilesCurrentVerified": False,
      "autoApprovedForPublicRelease": False,
      "legalReasoningInferredFromRegister": False,
    }


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--data",type=Path,default=DEFAULT_DATA)
    args=p.parse_args(argv)
    report=readiness(args.data)
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
