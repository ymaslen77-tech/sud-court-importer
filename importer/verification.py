"""Validate a court's CURRENT official website and independent evidence URL.

Legacy register exports may hold old HTTP hostnames (e.g. barabinsky.nsk.sudrf.ru),
while the individual HTTPS court page uses a migrated sudrf.ru hostname.
A domain change is NEVER inferred automatically or treated as proof of identity:
a human reviewer must explicitly attest it after checking the court and code.
"""
from __future__ import annotations

from urllib.parse import urlsplit

from contacts import ImportValidationError, is_official_url
from federation import REGISTRIES, official_url as registry_official_url

MOSCOW_REGISTRY = "mos-gorsud-courts"


def _parsed_https(url: str):
    if not isinstance(url, str) or not url or url != url.strip():
        raise ImportValidationError("Official evidence must be an exact HTTPS URL")
    try:
        parsed = urlsplit(url)
        if (parsed.scheme != "https" or not parsed.hostname or
            parsed.username is not None or parsed.password is not None or
            parsed.port not in (None, 443) or parsed.fragment or
            any(ord(ch) < 32 for ch in url)):
            raise ImportValidationError("Official evidence requires safe HTTPS without credentials")
    except ValueError as exc:
        raise ImportValidationError("Malformed official evidence URL") from exc
    return parsed


def review_official_site(
    staged_url: str,
    current_site_url: str,
    verification_url: str,
    registry: str,
    *,
    attest_site_migration: bool = False,
) -> tuple[str, str, bool]:
    """Fail closed; returns (public_site_url, individual_evidence_url, changed_site).

    This is a URL/provenance safety gate, NOT automatic factual verification.
    """
    site = _parsed_https(current_site_url)
    evidence = _parsed_https(verification_url)
    allowed = (
        (lambda url: is_official_url(url))
        if registry == MOSCOW_REGISTRY else
        (lambda url: registry_official_url(url, registry, listing=False))
    )
    if registry != MOSCOW_REGISTRY and registry not in REGISTRIES:
        raise ImportValidationError("Unsupported official court registry")
    if not allowed(current_site_url) or not allowed(verification_url):
        raise ImportValidationError("Current court site and verification page must be official HTTPS")
    if site.hostname != evidence.hostname:
        raise ImportValidationError("Individual evidence page must belong to current court host")
    if registry in (MOSCOW_REGISTRY, "mos-gorsud-court"):
        # Several Moscow courts share the same host; court-specific path matters.
        root = site.path.rstrip("/")
        if not root or not (evidence.path == root or evidence.path.startswith(root + "/")):
            raise ImportValidationError("Moscow evidence must be within the same court path")
    elif site.path not in ("", "/"):
        raise ImportValidationError("Current court website must be the official site root")
    if site.query or site.fragment:
        raise ImportValidationError("Current official website cannot include a query")
    try:
        old = urlsplit(staged_url)
        if not old.hostname:
            raise ValueError()
    except ValueError as exc:
        raise ImportValidationError("Invalid staged court site URL") from exc
    changed = (
        old.hostname.lower() != site.hostname.lower()
        or old.path.rstrip("/") != site.path.rstrip("/")
    )
    if changed and not attest_site_migration:
        raise ImportValidationError(
            "Official court hostname/path changed: separate human migration attestation required"
        )
    return current_site_url, verification_url, changed
