"""Read-only inventory of official source channels and release permissions.

The catalog intentionally contains NO authorisation for mass network access.
This script never requests a remote URL, downloads data or mutates a database.
"""
from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

CATALOG = Path(__file__).resolve().parent / "sources" / "official-channels.json"
KNOWN = {"sudrf-federal", "sudrf-magistrate", "arbitr-courts", "moscow-contacts"}
REQUIRED = {
    "key", "publisher", "listing_url", "scope", "listing_observed",
    "machine_feed_url", "permission_document_url", "terms_reviewed",
    "automated_access_confirmed", "reuse_rights_confirmed", "status", "reason",
}


def _https(url: object) -> bool:
    if not isinstance(url, str) or len(url) > 1500:
        return False
    try:
        parsed = urlsplit(url)
        return parsed.scheme == "https" and bool(parsed.hostname) and not (
            parsed.username or parsed.password or parsed.fragment
        ) and parsed.port in (None, 443)
    except ValueError:
        return False


def audit(path: Path = CATALOG) -> dict:
    if path.is_symlink() or not path.is_file() or path.stat().st_size > 100_000:
        raise ValueError("Source catalog missing or unsafe")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or set(data) != {
        "version", "observed_on", "attestation", "channels"
    } or data["version"] != 1:
        raise ValueError("Unexpected source catalog format")
    if not isinstance(data["channels"], list) or not data["channels"]:
        raise ValueError("Source catalog is empty")
    try:
        observed = date.fromisoformat(data["observed_on"])
    except (TypeError, ValueError) as exc:
        raise ValueError("Invalid observation date") from exc
    if observed > date.today():
        raise ValueError("Observation date cannot be future")
    keys: set[str] = set()
    result = []
    for channel in data["channels"]:
        if not isinstance(channel, dict) or set(channel) != REQUIRED:
            raise ValueError("Invalid official channel fields")
        key = channel["key"]
        if key not in KNOWN or key in keys:
            raise ValueError("Unknown or duplicated channel key")
        keys.add(key)
        if not _https(channel["listing_url"]):
            raise ValueError("Invalid official HTTPS listing URL")
        if not isinstance(channel["listing_observed"], bool):
            raise ValueError("Invalid listing observation")
        if not isinstance(channel["reason"], str) or not channel["reason"].strip():
            raise ValueError("A reason is mandatory")
        if not isinstance(channel["publisher"], str) or not channel["publisher"].strip():
            raise ValueError("Missing official publisher")
        if not isinstance(channel["scope"], str) or not channel["scope"].strip():
            raise ValueError("Missing source scope")
        for name in ("terms_reviewed", "automated_access_confirmed", "reuse_rights_confirmed"):
            if not isinstance(channel[name], bool):
                raise ValueError("Invalid permission boolean")
        feed = channel["machine_feed_url"]
        proof = channel["permission_document_url"]
        if feed is not None and not _https(feed):
            raise ValueError("Invalid machine feed URL")
        if proof is not None and not _https(proof):
            raise ValueError("Invalid permission document URL")
        # Fail closed: only documented human-reviewed channels may be marked ready.
        ready = (bool(feed) and bool(proof) and channel["terms_reviewed"]
                 and channel["automated_access_confirmed"]
                 and channel["reuse_rights_confirmed"])
        if channel["status"] == "approved_feed":
            if not ready:
                raise ValueError("Approved feed lacks required explicit evidence")
        elif channel["status"] != "manual_review_only" or ready:
            raise ValueError("Channel permission status conflicts with evidence")
        result.append({
            "key": key, "publisher": channel["publisher"],
            "listing_url": channel["listing_url"],
            "listing_observed": channel["listing_observed"],
            "machine_access_ready": bool(ready),
            "status": channel["status"], "reason": channel["reason"],
        })
    return {
        "observed_on": str(observed),
        "sources_recorded": len(result),
        "permissioned_machine_feeds": sum(item["machine_access_ready"] for item in result),
        "manual_review_only": sum(not item["machine_access_ready"] for item in result),
        "channels": result, "automated_download_started": False, "auto_published": 0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Offline audit of official source conditions")
    parser.add_argument("--catalog", type=Path, default=CATALOG)
    parser.add_argument("--require-machine-feed", action="store_true")
    args = parser.parse_args()
    report = audit(args.catalog)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if args.require_machine_feed and report["permissioned_machine_feeds"] == 0:
        parser.exit(3, "No evidence-backed machine-readable feed approved; download remains disabled.\n")


if __name__ == "__main__":
    main()
