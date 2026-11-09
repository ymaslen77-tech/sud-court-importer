#!/usr/bin/env python3
"""Conservative, auditable review of non-sensitive Moscow court facts.

An official URL by itself does not verify a claim. For automatic acceptance,
two distinct official issuing bodies/documents must agree, with provenance and
a verified source snapshot. Contradictions remain on review hold; even a
"confirmed" field here does NOT publish to the website.
"""
import argparse
from collections import Counter, defaultdict
from datetime import date
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

VALID_FIELDS = {
    "court_address", "postal_address", "visitor_address", "expedition_phone",
    "archive_phone", "accessibility_phone", "anticorruption_phone",
    "court_email", "department_hours", "judge_appointment",
    "judge_roster_snapshot", "official_decree", "court_open_hours",
}
TRUSTED_OFFICIAL = (
    "mos-gorsud.ru", "sudrf.ru", "pravo.gov.ru",
    "publication.pravo.gov.ru",
)
SAFE_SLUG = re.compile(r"^[a-z0-9][a-z0-9_-]{1,99}$")
SHA = re.compile(r"^[a-f0-9]{64}$")


def is_official(url):
    if not isinstance(url, str):
        return False
    try:
        u = urlsplit(url)
        host = (u.hostname or "").lower()
        return (u.scheme == "https" and not (u.username or u.password or u.port)
                and bool(u.path.strip("/")) and host in TRUSTED_OFFICIAL
                or (u.scheme == "https" and not (u.username or u.password or u.port)
                    and bool(u.path.strip("/"))
                    and any(host.endswith("." + base) for base in ("mos-gorsud.ru", "sudrf.ru"))))
    except (ValueError, TypeError):
        return False


def normalized_value(field, raw):
    if not isinstance(raw, str) or not raw.strip() or len(raw) > 1000:
        return None
    cleaned = re.sub(r"\s+", " ", raw.strip().lower().replace("ё", "е"))
    if field.endswith("_phone"):
        digits = re.sub(r"\D", "", cleaned)
        if len(digits) == 11 and digits.startswith(("7", "8")):
            return "7" + digits[1:]
        return None
    if field == "court_email":
        return cleaned if re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", cleaned) else None
    # Do not normalize away street or legal-act punctuation: ambiguous facts must hold.
    return cleaned


def inspect_fact(row):
    if not isinstance(row, dict):
        return None, "malformed"
    slug = row.get("courtSlug")
    field = row.get("field")
    if not isinstance(slug, str) or not SAFE_SLUG.fullmatch(slug):
        return None, "bad_court"
    if field not in VALID_FIELDS:
        return None, "field_not_allowed"
    value = normalized_value(field, row.get("value"))
    if value is None:
        return None, "invalid_value"
    url = row.get("sourceUrl")
    kind = row.get("sourceKind")
    official = is_official(url) and kind in ("official_court_page", "official_legal_act")
    if kind == "official_legal_act" and not any(
        (urlsplit(url).hostname or "").lower() == h
        for h in ("publication.pravo.gov.ru", "pravo.gov.ru")
    ):
        official = False
    issuer = row.get("issuer")
    published = row.get("sourcePublishedOn")
    captured = row.get("capturedOn")
    digest = row.get("snapshotSha256")
    if not isinstance(issuer, str) or not 2 <= len(issuer.strip()) <= 120:
        return None, "missing_issuer"
    if not isinstance(digest, str) or not SHA.fullmatch(digest):
        return None, "missing_snapshot_hash"
    try:
        if not isinstance(published, str) or not isinstance(captured, str):
            raise ValueError("missing date")
        if date.fromisoformat(published) > date.fromisoformat(captured):
            return None, "source_date_after_capture"
    except ValueError:
        return None, "invalid_date"
    return (slug, field, value, url, issuer.strip(), digest, official), None


def review(records):
    grouped = defaultdict(list)
    invalid = Counter()
    for row in records:
        x, reason = inspect_fact(row)
        if reason:
            invalid[reason] += 1
        else:
            grouped[x[:2]].append(x)
    states = Counter()
    summaries = []
    for (court, field), evidence in sorted(grouped.items()):
        official = [x for x in evidence if x[6]]
        unofficial = [x for x in evidence if not x[6]]
        values = {x[2] for x in official}
        if not official:
            status = "no_official_evidence"
        elif len(values) != 1:
            status = "conflicting_official_sources_hold"
        elif unofficial and any(x[2] not in values for x in unofficial):
            status = "official_preferred_nonofficial_conflict_review"
        else:
            independent = {(x[4].casefold(), x[3], x[5]) for x in official}
            issuers = {x[4].casefold() for x in official}
            status = ("auto_concordant_official_evidence"
                      if len(independent) >= 2 and len(issuers) >= 2
                      else "single_issuer_or_source_requires_review")
        states[status] += 1
        summaries.append({
            "courtSlug": court, "field": field, "status": status,
            "officialEvidenceCount": len(official),
            "distinctOfficialIssuers": len({x[4].casefold() for x in official}),
            "sourceConflict": len(values) > 1,
            # Never echo values, participants, URL query strings, or judicial content.
            "publiclyPublished": False,
        })
    return {
        "factCount": len(summaries), "states": dict(states),
        "excluded": dict(invalid), "facts": summaries,
        "automaticPublication": False,
        "legalTextVerified": False,
        "notice": "Metadata fact review only. Verify source authenticity and temporal validity before release.",
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args(argv)
    # Fail closed if a source includes other fields/values than the reviewed schema.
    if not args.input.is_file() or args.input.stat().st_size > 20_000_000:
        parser.error("Expected a local bounded evidence manifest")
    dataset = json.loads(args.input.read_text(encoding="utf-8"))
    if not isinstance(dataset, list):
        parser.error("Manifest must be an array of evidence objects")
    print(json.dumps(review(dataset), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
