import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError, is_official_url, parse_export


def example(**overrides):
    row = {
        "courtCode": "77RS9999",
        "courtName": "Тестовый районный суд (искусственные данные)",
        "courtAddress": "г. Москва, вымышленный адрес, дом 99",
        "courtTelephone": "+7 000 000 00 00",
        "courtEmail": "testing@example.org",
        "courtSiteUrl": "https://www.mos-gorsud.ru/rs/test-court",
    }
    row.update(overrides)
    return row


def encoded(rows):
    return json.dumps(rows, ensure_ascii=False).encode("utf-8")


class ContactsTests(unittest.TestCase):
    def test_valid_record_normalizes(self):
        court = parse_export(encoded([example()]))[0]
        self.assertEqual(court.external_code, "77RS9999")
        self.assertEqual(court.slug, "test-court")
        self.assertEqual(court.court_type, "Районный суд")
        self.assertEqual(len(court.record_hash), 64)

    def test_rejects_host_spoofing(self):
        for url in ["https://mos-gorsud.ru.evil.com/rs/test-court",
                    "http://www.mos-gorsud.ru/rs/test-court",
                    "https://evil.ru/rs/test-court",
                    "https://www.mos-gorsud.ru@evil.ru/rs/test-court"]:
            with self.subTest(url=url), self.assertRaises(ImportValidationError):
                parse_export(encoded([example(courtSiteUrl=url)]))

    def test_rejects_duplicate_codes_and_slugs(self):
        with self.assertRaises(ImportValidationError):
            parse_export(encoded([example(), example()]))
        with self.assertRaises(ImportValidationError):
            parse_export(encoded([example(), example(courtCode="77RS9998")]))

    def test_rejects_unknown_layout(self):
        for value in [[], {"rows": [example()]}, {"data": "bad"}]:
            with self.subTest(value=value), self.assertRaises(ImportValidationError):
                parse_export(encoded(value))

    def test_data_envelope(self):
        self.assertEqual(len(parse_export(encoded({"data": [example()]}))), 1)

    def test_no_auto_email_from_multiple_values(self):
        court = parse_export(encoded([example(courtEmail="a@b.ru c@d.ru")]))[0]
        self.assertIsNone(court.email)
        self.assertIn("courtEmail", court.raw_record)

    def test_rejects_nonstring_and_empty(self):
        with self.assertRaises(ImportValidationError):
            parse_export(encoded([example(courtCode=12)]))
        with self.assertRaises(ImportValidationError):
            parse_export(encoded([example(courtName="")]))

    def test_official_url_criteria(self):
        self.assertTrue(is_official_url("https://data.mos-gorsud.ru/opendata", dataset=True))
        self.assertFalse(is_official_url("https://www.mos-gorsud.ru/opendata", dataset=True))
        self.assertFalse(is_official_url("https://data.mos-gorsud.ru.evil.org/opendata", dataset=True))

    def test_rejects_misleading_code_for_city(self):
        with self.assertRaises(ImportValidationError):
            parse_export(encoded([example(courtCode="77OS0000")]))

if __name__ == "__main__":
    unittest.main()
