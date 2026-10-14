"""Explicit, opt-in HTTPS acquisition of *operator-authorized* Moscow JSON exports.

Default: no calls, no scheduler, no database writes and no publication.
A concrete official URL and recent independent review of access/reuse terms
must be recorded by an operator. The software cannot verify legal permission.
"""
from __future__ import annotations

import argparse
from datetime import date, datetime, timedelta, timezone
from hashlib import sha256
import json
from pathlib import Path
import ssl
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPSHandler, HTTPRedirectHandler, ProxyHandler, Request, build_opener

from contacts import ImportValidationError, MAX_BYTES
from moscow_raw_export import inspect
from moscow_sync import dataset_url

EXPECTED_KEYS = frozenset({
    "dataset_url", "export_url", "terms_url", "reviewed_on", "reviewer",
    "permission_basis", "automatic_access_confirmed", "reuse_rights_confirmed"
})
TERMS_URL = "https://data.mos-gorsud.ru/terms-of-use"
MAX_CONFIG_BYTES = 8192


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def export_url(value: str) -> str:
    if not isinstance(value, str) or len(value) > 1024:
        raise ImportValidationError("Exact export URL required")
    try:
        parts = urlsplit(value)
        segments = parts.path.split("/")
        if (parts.scheme != "https" or parts.netloc.lower() != "data.mos-gorsud.ru"
            or parts.username or parts.password or parts.port not in (None, 443)
            or parts.query or parts.fragment or parts.path in ("", "/", "/opendata")
            or "%" in value or "\\" in value or ".." in segments or "" in segments[1:]):
            raise ImportValidationError("Export URL must be a precise direct HTTPS path on data.mos-gorsud.ru")
    except ValueError as exc:
        raise ImportValidationError("Malformed export URL") from exc
    if value == TERMS_URL:
        raise ImportValidationError("Terms page is not a JSON export")
    return value


def settings(document: object, today: date | None = None) -> dict:
    today = today or date.today()
    if not isinstance(document, dict) or set(document) != EXPECTED_KEYS:
        raise ImportValidationError("Source configuration has missing or unexpected fields")
    source = dataset_url(document["dataset_url"])
    endpoint = export_url(document["export_url"])
    if source == endpoint:
        raise ImportValidationError("Dataset details page is not an export")
    if document["terms_url"] != TERMS_URL:
        raise ImportValidationError("Review the exact official terms page")
    reviewer = document["reviewer"]
    basis = document["permission_basis"]
    if (not isinstance(reviewer, str) or not 3 <= len(reviewer.strip()) <= 120
        or not isinstance(basis, str) or not 20 <= len(basis.strip()) <= 1500
        or document["automatic_access_confirmed"] is not True
        or document["reuse_rights_confirmed"] is not True):
        raise ImportValidationError("Explicit named, documented live-access and reuse authorization required")
    try:
        reviewed = date.fromisoformat(document["reviewed_on"])
    except (TypeError, ValueError) as exc:
        raise ImportValidationError("Invalid reviewed_on date") from exc
    if not timedelta(0) <= (today - reviewed) <= timedelta(days=7):
        raise ImportValidationError("Permission review must be dated within the previous seven days")
    return {**document, "reviewer": reviewer.strip(), "permission_basis": basis.strip()}


def load_settings(path: Path, today: date | None = None) -> dict:
    if not path.is_file() or path.is_symlink() or path.stat().st_size > MAX_CONFIG_BYTES:
        raise ImportValidationError("Missing, symlinked or oversized settings")
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ImportValidationError("Invalid source settings JSON") from exc
    return settings(doc, today)


def parse_snapshot(data: bytes) -> dict:
    if not data or len(data) > MAX_BYTES:
        raise ImportValidationError("Official JSON payload empty or larger than 5 MB")
    try:
        doc = json.loads(data.decode("utf-8-sig"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ImportValidationError("Official export did not return UTF-8 JSON") from exc
    if isinstance(doc, dict):
        doc = doc.get("data", doc.get("records"))
    if not isinstance(doc, list) or not 1 <= len(doc) <= 5000 or any(
        not isinstance(row, dict) for row in doc
    ):
        raise ImportValidationError("Unexpected raw JSON export format")
    return inspect(data, doc)


def acquire(endpoint: str) -> bytes:
    """HTTPS with standard certificate verification; no proxies or redirects."""
    endpoint = export_url(endpoint)
    opener = build_opener(ProxyHandler({}), HTTPSHandler(context=ssl.create_default_context()), NoRedirect())
    req = Request(endpoint, method="GET", headers={
        "Accept": "application/json", "Accept-Encoding": "identity",
        "User-Agent": "SudCourtImporter/1.0 authorized-offline-intake"
    })
    try:
        with opener.open(req, timeout=15) as response:
            if response.status != 200:
                raise ImportValidationError("Official endpoint did not return HTTP 200")
            media_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            if media_type not in ("application/json", "application/octet-stream") and not media_type.endswith("+json"):
                raise ImportValidationError("Official endpoint did not serve JSON")
            declared = response.headers.get("Content-Length")
            if declared:
                try:
                    length = int(declared)
                except ValueError as exc:
                    raise ImportValidationError("Invalid Content-Length") from exc
                if length > MAX_BYTES:
                    raise ImportValidationError("Official JSON exceeds 5 MB limit")
            data = response.read(MAX_BYTES + 1)
            if len(data) > MAX_BYTES:
                raise ImportValidationError("Official JSON exceeds 5 MB limit")
            return data
    except HTTPError as exc:
        raise ImportValidationError("HTTP response rejected (including redirects): " + str(exc.code)) from exc
    except URLError as exc:
        raise ImportValidationError("Official endpoint cannot be reached securely") from exc


def write_evidence(directory: Path, content: bytes, config: dict, now: datetime | None = None) -> dict:
    """Exclusive write of original bytes and accompanying operator attestation."""
    report = parse_snapshot(content)
    if not directory.is_dir() or directory.is_symlink():
        raise ImportValidationError("Create a regular dedicated output directory first")
    now = now or datetime.now(timezone.utc)
    digest = sha256(content).hexdigest()
    basename = "moscow-raw-" + now.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + digest[:16]
    destination = directory / (basename + ".json")
    receipt = directory / (basename + ".evidence.json")
    audit = {
        "dataset_url": config["dataset_url"],
        "export_url": config["export_url"],
        "terms_url": config["terms_url"],
        "permission_reviewed_on": config["reviewed_on"],
        "reviewed_by": config["reviewer"],
        "permission_basis": config["permission_basis"],
        "automatic_access_operator_attested": True,
        "reuse_rights_operator_attested": True,
        "downloaded_at_utc": now.astimezone(timezone.utc).isoformat(),
        "raw_sha256": digest,
        "record_count": report["record_count"],
        "publisher_release_date_verified": False,
        "record_currentness_verified": False,
        "auto_published": 0
    }
    data_created = False
    receipt_created = False
    try:
        with destination.open("xb") as stream:
            data_created = True
            stream.write(content)
        with receipt.open("x", encoding="utf-8") as stream:
            receipt_created = True
            json.dump(audit, stream, ensure_ascii=False, sort_keys=True, indent=2)
    except OSError:
        # Never remove a pre-existing file/symlink when exclusive creation
        # fails. Only roll back objects created by this invocation.
        if receipt_created:
            receipt.unlink(missing_ok=True)
        if data_created:
            destination.unlink(missing_ok=True)
        raise
    return {"raw_file": str(destination), "evidence_file": str(receipt),
            "raw_sha256": digest, "records": report["record_count"],
            "published": 0, "operator_attested_only": True}


def main() -> None:
    parser = argparse.ArgumentParser(description="Opt-in permitted Moscow JSON download, never publish")
    parser.add_argument("action", choices=("check", "fetch"))
    parser.add_argument("--settings", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("/output"))
    args = parser.parse_args()
    try:
        config = load_settings(args.settings)
        if args.action == "check":
            result = {"settings_valid": True, "network_access": False,
                      "permission_operator_attested": True, "published": 0}
        else:
            # Deliberately no automatic scheduling. Operational fetch requires
            # human-reviewed current authorization and a specific official URL.
            raw = acquire(config["export_url"])
            result = write_evidence(args.output_dir, raw, config)
    except (ImportValidationError, OSError) as exc:
        parser.exit(2, "Validation error: " + str(exc) + "\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
