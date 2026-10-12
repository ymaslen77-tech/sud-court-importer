"""Strict offline normalization of Moscow court contact JSON exports.

No network access and no automatic publication. All data remain untrusted until
a human checks each candidate against its current official court web page.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from hashlib import sha256
from urllib.parse import urlparse
import json
import re

MAX_BYTES = 5_000_000
MOSCOW_CODE = re.compile(r"^77(?:RS|OS)\d{4}$")
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{0,79}$")


class ImportValidationError(ValueError):
    pass


@dataclass(frozen=True)
class Candidate:
    external_code: str
    slug: str
    name: str
    court_type: str
    address: str
    phone: str | None
    email: str | None
    official_url: str
    record_hash: str
    raw_record: dict

    def json_dict(self) -> dict:
        return asdict(self)


def is_official_url(value: str, *, dataset: bool = False) -> bool:
    try:
        parsed = urlparse(value)
        host = parsed.hostname or ""
        allowed = host == "data.mos-gorsud.ru" if dataset else (
            host == "mos-gorsud.ru" or host.endswith(".mos-gorsud.ru")
        )
        return (
            parsed.scheme == "https" and allowed and parsed.port in (None, 443)
            and parsed.username is None and parsed.password is None
            and not parsed.fragment
        )
    except ValueError:
        return False


def clean(value: object, field: str, *, required: bool = False, limit: int = 2000) -> str | None:
    if value is None or value == "":
        if required:
            raise ImportValidationError(f"Missing {field}")
        return None
    if not isinstance(value, str):
        raise ImportValidationError(f"{field} must be a string")
    result = " ".join(value.split())
    if not result or len(result) > limit or any(ord(c) < 32 for c in result):
        raise ImportValidationError(f"Invalid {field}")
    return result


def parse_row(row: object) -> Candidate:
    if not isinstance(row, dict):
        raise ImportValidationError("Each record must be an object")
    code = clean(row.get("courtCode"), "courtCode", required=True, limit=12)
    if code is None or not MOSCOW_CODE.fullmatch(code):
        raise ImportValidationError("Unsupported Moscow court code")
    name = clean(row.get("courtName"), "courtName", required=True, limit=250)
    address = clean(row.get("courtAddress"), "courtAddress", required=True, limit=500)
    official = clean(row.get("courtSiteUrl"), "courtSiteUrl", required=True, limit=500)
    if official is None or not is_official_url(official):
        raise ImportValidationError(f"{code}: not an official HTTPS court URL")
    parsed_url = urlparse(official)
    segments = parsed_url.path.strip("/").split("/")
    if code.startswith("77RS"):
        if len(segments) != 2 or segments[0] != "rs":
            raise ImportValidationError(f"{code}: court URL does not look like a district court")
        slug, court_type = segments[1], "Районный суд"
    else:
        if segments != ["mgs"]:
            raise ImportValidationError(f"{code}: unsupported court URL")
        slug, court_type = "moskovskij-gorodskoj-sud", "Городской суд"
    if not SLUG.fullmatch(slug):
        raise ImportValidationError(f"{code}: invalid slug")
    phone = clean(row.get("courtTelephone"), "courtTelephone", limit=500)
    email = clean(row.get("courtEmail"), "courtEmail", limit=500)
    # Some source entries contain multiple addresses; avoid presenting such
    # a string as an email. Keep the verbatim value in raw_record for review.
    if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        email = None
    canonical = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return Candidate(
        external_code=code, slug=slug, name=name or "", address=address or "",
        court_type=court_type, phone=phone, email=email, official_url=official,
        record_hash=sha256(canonical.encode("utf-8")).hexdigest(), raw_record=row
    )


def parse_export(raw: bytes) -> list[Candidate]:
    if len(raw) > MAX_BYTES:
        raise ImportValidationError("Export exceeds 5 MB limit")
    try:
        payload = json.loads(raw.decode("utf-8-sig"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ImportValidationError("Invalid UTF-8 JSON") from exc
    if isinstance(payload, dict):
        if isinstance(payload.get("data"), list):
            payload = payload["data"]
        elif isinstance(payload.get("records"), list):
            payload = payload["records"]
    if not isinstance(payload, list) or not payload or len(payload) > 5000:
        raise ImportValidationError("Expected a nonempty JSON array of up to 5000 records")
    result: list[Candidate] = []
    codes: set[str] = set()
    slugs: set[str] = set()
    for index, item in enumerate(payload):
        try:
            candidate = parse_row(item)
        except ImportValidationError as exc:
            raise ImportValidationError(f"Row {index + 1}: {exc}") from exc
        if candidate.external_code in codes or candidate.slug in slugs:
            raise ImportValidationError(f"Duplicate external code or slug at row {index + 1}")
        codes.add(candidate.external_code)
        slugs.add(candidate.slug)
        result.append(candidate)
    return result
