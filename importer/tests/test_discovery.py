import json
import sys
import unittest
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from discovery import parse_snapshot, parse_record, capture_date, validate_url

SEED = Path(__file__).resolve().parents[1] / "seeds" / "arbitration-subjects-official-list-unreviewed.json"
SOURCE = "https://arbitr.ru/?id_doc=20563&id_sec=353"
MAGISTRATE_SEED = Path(__file__).resolve().parents[1] / "seeds" / "khabarovsk-magistrates-official-unreviewed.json"


def candidate(**changes):
    row = {
        "registry":"arbitr-courts",
        "courtName":"Арбитражный суд тестового субъекта (НЕ СУЩЕСТВУЕТ)",
        "courtKind":"arbitration-subject",
        "sourceRecordUrl":SOURCE
    }
    return dict(row,**changes)


def payload(*rows):
    return json.dumps(list(rows),ensure_ascii=False).encode("utf-8")


class DiscoveryTests(unittest.TestCase):
    def test_official_list_names_without_guessed_fields(self):
        rows = parse_snapshot(SEED.read_bytes())
        self.assertEqual(len(rows),89)
        self.assertEqual(len([r for r in rows if r.court_kind=="arbitration-subject"]),87)
        self.assertEqual(len([r for r in rows if r.court_kind=="arbitration-presence"]),2)
        self.assertTrue(all(r.external_code is None and r.address is None for r in rows))
        self.assertTrue(all(r.region_code is None for r in rows))
        self.assertEqual(len({r.row_key for r in rows}),89)

    def test_source_backed_magistrate_area_codes(self):
        records=parse_snapshot(MAGISTRATE_SEED.read_bytes())
        self.assertEqual(len(records),75)
        self.assertEqual(records[0].external_code,"27MS0001")
        self.assertEqual(records[-1].external_code,"27MS0075")
        self.assertEqual(len({r.external_code for r in records}),75)
        self.assertTrue(all(r.region_code=="27" and r.region_name=="Хабаровский край"
                            and r.court_kind=="magistrate-area"
                            and r.address is None for r in records))

    def test_reject_duplicate_names_same_list(self):
        with self.assertRaises(ImportValidationError):
            parse_snapshot(payload(candidate(),candidate()))

    def test_mixed_registries_forbidden(self):
        with self.assertRaises(ImportValidationError):
            parse_snapshot(payload(candidate(), candidate(
                registry="sudrf-federal",courtKind="federal-district",
                sourceRecordUrl="https://sudrf.ru/index.php?act=go_search&id=300&searchtype=fs",
                courtName="Другой тестовый суд")))

    def test_mixed_official_list_sources_forbidden(self):
        with self.assertRaises(ImportValidationError):
            parse_snapshot(payload(candidate(), candidate(
                courtName="Другой тестовый суд",sourceRecordUrl="https://arbitr.ru/?another=true")))

    def test_host_spoofing_and_credentials(self):
        for url in ["http://arbitr.ru/", "https://arbitr.ru.evil.example/",
                    "https://arbitr.ru@evil.example/", "file:///etc/passwd",
                    "https://arbitr.ru:8080/", "https://evil.example"]:
            with self.subTest(url=url), self.assertRaises(ImportValidationError):
                parse_record(candidate(sourceRecordUrl=url))

    def test_no_guessed_code_required(self):
        c = parse_record(candidate())
        self.assertIsNone(c.external_code)
        self.assertIsNone(c.region_name)
        self.assertIsNone(c.official_court_url)

    def test_region_name_requires_code(self):
        with self.assertRaises(ImportValidationError):
            parse_record(candidate(regionName="Москва"))
        with self.assertRaises(ImportValidationError):
            parse_record(candidate(regionCode="77"))

    def test_bad_kind(self):
        with self.assertRaises(ImportValidationError):
            parse_record(candidate(courtKind="magistrate-area"))

    def test_reject_non_official_website(self):
        with self.assertRaises(ImportValidationError):
            parse_record(candidate(courtSiteUrl="https://arbitr.ru.evil.example"))

    def test_dates(self):
        self.assertEqual(capture_date(str(date.today())),date.today())
        with self.assertRaises(ImportValidationError):
            capture_date(str(date.today()+timedelta(days=1)))
        with self.assertRaises(ImportValidationError):
            capture_date(str(date.today()-timedelta(days=366)))

    def test_invalid_json(self):
        for raw in (b"",b"garbage",b"[]"):
            with self.subTest(raw=raw), self.assertRaises(ImportValidationError):
                parse_snapshot(raw)

    def test_exact_official_host_only(self):
        self.assertTrue(validate_url("https://arbitr.ru/anything",("arbitr.ru",)))
        self.assertFalse(validate_url("https://arbitr.ru.evil.net",("arbitr.ru",)))

if __name__=="__main__":
    unittest.main()
