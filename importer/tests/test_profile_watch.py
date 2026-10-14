import json
import sys
import tempfile
from datetime import datetime,timedelta,timezone
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))

from contacts import ImportValidationError
from profile import official_url, validate
from watch import SafeRedirect, check_robots, MAX_BYTES, semantic_source_allowed, archive_contact_html


class ProfileTests(unittest.TestCase):
    def test_official_domains_only(self):
        self.assertTrue(official_url("https://mos-gorsud.ru/rs/lefortovskij"))
        self.assertTrue(official_url("https://www.mos-gorsud.ru/rs/lefortovskij"))
        self.assertTrue(official_url("https://sudrf.ru/index.php"))
        for url in ["https://mos-gorsud.ru.evil.invalid/path",
                    "http://mos-gorsud.ru/path",
                    "https://evil.invalid",
                    "https://mos-gorsud.ru@evil.invalid/path",
                    "file:///etc/passwd",
                    "https://mos-gorsud.ru:8000/"]:
            with self.subTest(url=url):
                self.assertFalse(official_url(url))

    def test_coordinates_canonicalized(self):
        result=validate("coordinates",'{"latitude":55.75,"longitude":37.6}')
        self.assertEqual(json.loads(result),{"latitude":55.75,"longitude":37.6})

    def test_coordinates_rejects_invalid(self):
        for coordinates in ['{"latitude":"nan","longitude":37}',
                            '{"latitude":91,"longitude":37}',
                            '{"latitude":true,"longitude":37}',
                            '{"latitude":55,"longitude":37,"fake":1}',
                            '{"latitude":1e309,"longitude":30}']:
            with self.subTest(coordinates=coordinates), self.assertRaises(ImportValidationError):
                validate("coordinates",coordinates)

    def test_phone_and_email(self):
        self.assertEqual(validate("phone","+7 (495) 678-05-22"),"+7 (495) 678-05-22")
        self.assertEqual(validate("email","test@example.ru"),"test@example.ru")
        with self.assertRaises(ImportValidationError):
            validate("email","multiple: test@example.ru other@example.ru")
        with self.assertRaises(ImportValidationError):
            validate("phone","CALL ME +7 000")

    def test_no_unverified_judge_proposal_as_court_field(self):
        with self.assertRaises(ImportValidationError):
            validate("judge_name","Пример Примеров")

    def test_official_links_and_controls(self):
        self.assertEqual(
            validate("jurisdiction_url","https://mos-gorsud.ru/rs/lefortovskij"),
            "https://mos-gorsud.ru/rs/lefortovskij")
        with self.assertRaises(ImportValidationError):
            validate("filing_instructions_url","https://not-official.example")
        with self.assertRaises(ImportValidationError):
            validate("accessibility","line\0other")


class MonitoringTests(unittest.TestCase):
    def test_cross_host_redirect_is_denied(self):
        from urllib.request import Request
        handler=SafeRedirect()
        req=Request("https://mos-gorsud.ru/rs/lefortovskij")
        with self.assertRaises(ImportValidationError):
            handler.redirect_request(req,None,302,"Found",{},
                                      "https://sudrf.ru/index.php")

    def test_insecure_redirect_is_denied(self):
        from urllib.request import Request
        handler=SafeRedirect()
        req=Request("https://mos-gorsud.ru/rs/lefortovskij")
        with self.assertRaises(ImportValidationError):
            handler.redirect_request(req,None,302,"Found",{},
                                      "http://mos-gorsud.ru/rs/lefortovskij")

    def test_semantic_contact_monitor_requires_recent_permission(self):
        now=datetime(2026,10,14,12,0,tzinfo=timezone.utc)
        page="https://mos-gorsud.ru/rs/lefortovskij/help/hours"
        self.assertTrue(semantic_source_allowed("contacts",page,now-timedelta(days=2),now))
        self.assertFalse(semantic_source_allowed("contacts",page,now-timedelta(days=31),now))
        self.assertFalse(semantic_source_allowed("general",page,now,now))
        self.assertFalse(semantic_source_allowed("hours","https://mos-gorsud.ru/rs/lefortovskij",now,now))
        self.assertFalse(semantic_source_allowed("contacts",page,None,now))

    def test_semantic_snapshot_archive_does_not_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            folder=Path(d)
            first=archive_contact_html(folder,2,b"<h1>Test court</h1>")
            self.assertEqual(first.read_bytes(),b"<h1>Test court</h1>")
            self.assertEqual(first,archive_contact_html(folder,2,b"<h1>Test court</h1>"))
            first.write_bytes(b"Different content")
            with self.assertRaises(ImportValidationError):
                archive_contact_html(folder,2,b"<h1>Test court</h1>")
            self.assertEqual(first.read_bytes(),b"Different content")

    def test_resource_limit(self):
        self.assertEqual(MAX_BYTES,1_000_000)


if __name__=="__main__":
    unittest.main()
