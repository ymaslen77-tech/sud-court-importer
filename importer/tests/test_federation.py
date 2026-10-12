import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from federation import parse_export, parse_record, official_url

SEED = Path(__file__).resolve().parents[1] / "seeds" / "novosibirsk-federal-official-unreviewed.json"
LISTING = "https://sudrf.ru/index.php?act=go_search&court_subj=54&id=300&searchtype=fs"


def row(**updates):
    item = {
        "courtCode": "54RS0012", "regionCode": "54",
        "regionName": "Новосибирская область",
        "courtName": "Демонстрационный районный суд — ТЕСТ, не публиковать",
        "courtType": "Районный суд", "courtAddress": "Вымышленный адрес 123",
        "courtTelephone": None, "courtEmail": "test@example.org",
        "courtSiteUrl": "http://test.nsk.sudrf.ru", "sourceRecordUrl": LISTING,
    }
    item.update(updates)
    return item


class FederationTests(unittest.TestCase):
    def test_official_source_example_has_ten_unreviewed_courts(self):
        result = parse_export(SEED.read_bytes(), "sudrf-federal")
        self.assertEqual(len(result), 10)
        self.assertEqual(result[0].record.external_code, "54RS0012")
        self.assertEqual(result[0].region_code, "54")
        self.assertEqual(result[0].record.slug, "sud-54rs0012")
        self.assertTrue(all(item.record.raw_record["_registry"] == "sudrf-federal" for item in result))

    def test_bad_registry_and_code(self):
        for registry in ["arbitr-courts", "sudrf-magistrate"]:
            with self.subTest(registry=registry), self.assertRaises(ImportValidationError):
                parse_record(row(), registry)

    def test_region_code_mismatch(self):
        with self.assertRaises(ImportValidationError):
            parse_record(row(regionCode="77"), "sudrf-federal")

    def test_duplicate_code(self):
        raw = json.dumps([row(), row()], ensure_ascii=False).encode()
        with self.assertRaises(ImportValidationError):
            parse_export(raw, "sudrf-federal")

    def test_host_spoofing_and_credentials(self):
        for url in [
            "https://sudrf.ru.evil.org/index.php", "https://sudrf.ru@evil.org/",
            "http://sudrf.ru/index.php", "https://evil.org/",
        ]:
            with self.subTest(url=url), self.assertRaises(ImportValidationError):
                parse_record(row(sourceRecordUrl=url), "sudrf-federal")

    def test_website_allowlist(self):
        for url in ["https://evil.org/", "https://sudrf.ru.evil.org/",
                    "ftp://foo.sudrf.ru", "http://admin:secret@foo.sudrf.ru/"]:
            with self.subTest(url=url), self.assertRaises(ImportValidationError):
                parse_record(row(courtSiteUrl=url), "sudrf-federal")

    def test_magistrate_host_and_codes(self):
        item = row(courtCode="54MS0021",courtSiteUrl="http://21.nsk.msudrf.ru",
                   sourceRecordUrl="https://sudrf.ru/index.php?act=go_ms_search&searchtype=ms")
        result = parse_record(item,"sudrf-magistrate")
        self.assertEqual(result.record.slug,"sud-54ms0021")

    def test_arbitration_host_and_codes(self):
        item = row(courtCode="77AS0040",regionCode="77",regionName="Москва",
                   courtSiteUrl="https://msk.arbitr.ru",
                   sourceRecordUrl="https://arbitr.ru/?id_doc=20563&id_sec=353")
        self.assertEqual(parse_record(item,"arbitr-courts").record.external_code,"77AS0040")

    def test_invalid_json_and_size(self):
        with self.assertRaises(ImportValidationError):
            parse_export(b"not json","sudrf-federal")
        with self.assertRaises(ImportValidationError):
            parse_export(b"x"*5_000_001,"sudrf-federal")

    def test_page_requires_https_but_legacy_official_website_can_be_http(self):
        self.assertTrue(official_url(LISTING,"sudrf-federal",listing=True))
        self.assertTrue(official_url("http://barabinsky.nsk.sudrf.ru","sudrf-federal",listing=False))
        self.assertFalse(official_url("http://sudrf.ru","sudrf-federal",listing=True))


if __name__=="__main__":
    unittest.main()
