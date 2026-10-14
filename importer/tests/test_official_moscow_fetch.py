import io
import json
import sys
import tempfile
import unittest
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError, MAX_BYTES
from official_moscow_fetch import (
    NoRedirect, acquire, export_url, load_settings, parse_snapshot, settings, write_evidence
)

SOURCE = "https://data.mos-gorsud.ru/opendata/TEST-CONTACTS-2026-EXAMPLE"
EXPORT = "https://data.mos-gorsud.ru/download/official-contacts.json"
TERMS = "https://data.mos-gorsud.ru/terms-of-use"
ROW = {
    "courtCode": "77RS9999", "courtName": "ТЕСТОВЫЙ СУД НЕ СУЩЕСТВУЕТ",
    "courtAddress": "ВЫМЫШЛЕННЫЙ АДРЕС",
    "courtSiteUrl": "https://www.mos-gorsud.ru/rs/demo-nonexistent",
}
TODAY = date(2026, 10, 14)


def config(**updates):
    data = {
        "dataset_url": SOURCE, "export_url": EXPORT, "terms_url": TERMS,
        "reviewed_on": str(TODAY), "reviewer": "CI Test Operator",
        "permission_basis": "Operator confirms license and authorized automatic HTTPS fetching.",
        "automatic_access_confirmed": True,
        "reuse_rights_confirmed": True
    }
    data.update(updates)
    return data


class FakeResponse:
    status = 200
    def __init__(self, body, content_type="application/json"):
        self.buffer = io.BytesIO(body)
        self.headers = {"Content-Type": content_type, "Content-Length": str(len(body))}
    def __enter__(self):
        return self
    def __exit__(self, *_args):
        pass
    def read(self, size):
        return self.buffer.read(size)


class MoscowOfficialFetchTests(unittest.TestCase):
    def test_explicit_permission_gate(self):
        self.assertEqual(settings(config(), TODAY)["reviewer"], "CI Test Operator")
        for change in (
            {"automatic_access_confirmed": False},
            {"reuse_rights_confirmed": False},
            {"reviewed_on": str(TODAY - timedelta(days=8))},
            {"reviewed_on": str(TODAY + timedelta(days=1))},
            {"reviewer": ""},
            {"terms_url": "https://fake.example/terms"},
            {"permission_basis": "No"}
        ):
            with self.subTest(change=change), self.assertRaises(ImportValidationError):
                settings(config(**change), TODAY)

    def test_network_address_is_exactly_official_host(self):
        for url in (
            "http://data.mos-gorsud.ru/download/official-contacts.json",
            "https://data.mos-gorsud.ru.evil.example/download/contacts.json",
            "https://data.mos-gorsud.ru@evil.example/download/contacts.json",
            "https://data.mos-gorsud.ru:8443/download/contacts.json",
            "https://data.mos-gorsud.ru/download/contacts.json?token=123",
            "https://data.mos-gorsud.ru/download/../contacts.json",
            "https://data.mos-gorsud.ru/terms-of-use",
            "https://data.mos-gorsud.ru/"
        ):
            with self.subTest(url=url), self.assertRaises(ImportValidationError):
                export_url(url)
        self.assertEqual(export_url(EXPORT), EXPORT)

    def test_dry_run_has_no_network(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "settings.json"
            path.write_text(json.dumps(config()), encoding="utf-8")
            self.assertEqual(load_settings(path, TODAY)["export_url"], EXPORT)
            with self.assertRaises(ImportValidationError):
                load_settings(Path(tmp) / "missing.json", TODAY)
            with self.assertRaises(ImportValidationError):
                settings({**config(), "unknown": "value"}, TODAY)

    def test_no_redirects(self):
        self.assertIsNone(NoRedirect().redirect_request(None, None, 302, "Moved", {}, "https://evil.example"))
        
    def test_acquire_valid_json_with_fake_transport_only(self):
        body = json.dumps([ROW], ensure_ascii=False).encode("utf-8")
        class FakeOpener:
            def open(self, request, timeout):
                self.request = request
                self.timeout = timeout
                return FakeResponse(body)
        fake = FakeOpener()
        with patch("official_moscow_fetch.build_opener", return_value=fake):
            self.assertEqual(acquire(EXPORT), body)
        self.assertEqual(fake.timeout, 15)
        self.assertEqual(fake.request.get_method(), "GET")
        self.assertEqual(fake.request.full_url, EXPORT)

    def test_reject_nonjson_and_oversized_http(self):
        for content_type in ("text/html", "text/plain"):
            class Fake:
                def open(self, request, timeout):
                    return FakeResponse(b"<html>not JSON</html>", content_type)
            with patch("official_moscow_fetch.build_opener", return_value=Fake()):
                with self.assertRaises(ImportValidationError):
                    acquire(EXPORT)
        with self.assertRaises(ImportValidationError):
            parse_snapshot(b"x" * (MAX_BYTES + 1))
        with self.assertRaises(ImportValidationError):
            parse_snapshot(b'{"status":"blocked"}')

    def test_evidence_is_exclusive_and_not_published(self):
        raw = json.dumps([ROW], ensure_ascii=False).encode("utf-8")
        stamp = datetime(2026, 10, 14, 8, 0, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            data = write_evidence(directory, raw, config(), now=stamp)
            source = Path(data["raw_file"])
            evidence = Path(data["evidence_file"])
            self.assertEqual(source.read_bytes(), raw)
            record = json.loads(evidence.read_text(encoding="utf-8"))
            self.assertEqual(record["raw_sha256"], data["raw_sha256"])
            self.assertFalse(record["record_currentness_verified"])
            self.assertEqual(record["auto_published"], 0)
            self.assertEqual(data["published"], 0)
            with self.assertRaises(FileExistsError):
                write_evidence(directory, raw, config(), now=stamp)
            self.assertEqual(source.read_bytes(), raw)


if __name__ == "__main__":
    unittest.main()
