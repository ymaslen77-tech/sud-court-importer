"""Court categories are court-level metadata; NEVER equate them with judge titles.

Only recognized court registry codes produce automatic category proposals;
unknown records remain unclassified until explicitly reviewed.
"""
from __future__ import annotations

KNOWN = frozenset({
 "constitutional","supreme","general-magistrate","general-district",
 "general-regional","general-appeal","general-cassation",
 "military-garrison","military-district","military-appeal",
 "military-cassation","arbitration-subject","arbitration-appeal",
 "arbitration-district","arbitration-ip"
})


def infer_verified_kind(registry: str, code: str, name: str) -> str:
    if registry == "mos-gorsud-courts":
        # Exact code is a valid discriminator of the named Moscow City Court;
        # do NOT treat every court with "городской" in its name as a regional court.
        if code == "77OS0000" and name == "Московский городской суд":
            return "general-regional"
        return "general-district" if code.startswith("77RS") and len(code)==8 else "unclassified"
    if registry == "sudrf-federal":
        if code.endswith("OS0000") and len(code)==8:
            return "general-regional"
        if len(code)==8 and code[2:4] == "RS":
            return "general-district"
        if len(code)==8 and code[2:4] == "KV":
            return "military-cassation"
    # Arbitration codes, magistrate areas and many military levels need
    # individual model/source validation before assigning court categories.
    return "unclassified"
