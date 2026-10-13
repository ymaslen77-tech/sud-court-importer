import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from court_kind import infer_verified_kind
from federation import parse_export, parse_record, official_url

FILE=Path(__file__).resolve().parents[1]/"seeds"/"lefortovsky-official-page-staging-unreviewed.json"
SOURCE="https://mos-gorsud.ru/rs/lefortovskij"


class MoscowOfficialCourtTests(unittest.TestCase):
    def test_real_official_pilot_is_candidate_not_published(self):
        rows=parse_export(FILE.read_bytes(),"mos-gorsud-court")
        self.assertEqual(len(rows),1)
        record=rows[0].record
        self.assertEqual(record.external_code,"77RS0014")
        self.assertEqual(rows[0].source_record_url,SOURCE)
        self.assertEqual(record.slug,"sud-77rs0014")
        self.assertEqual(record.phone,"+7 (495) 912-78-86")
        self.assertEqual(infer_verified_kind("mos-gorsud-court",record.external_code,record.name),
                         "general-district")
        self.assertEqual(record.raw_record["_registry"],"mos-gorsud-court")
        self.assertIn("77RS0014",record.raw_record["courtCodeEvidenceUrl"]+
                      record.raw_record["courtCode"])

    def test_source_and_website_must_match_same_official_court(self):
        original=json.loads(FILE.read_text(encoding="utf-8"))[0]
        for change in [
            {"sourceRecordUrl":"https://mos-gorsud.ru/rs/another"},
            {"courtSiteUrl":"https://mos-gorsud.ru/rs/another"},
            {"sourceRecordUrl":"https://mos-gorsud.ru@attacker.invalid/rs/lefortovskij"},
            {"sourceRecordUrl":"http://mos-gorsud.ru/rs/lefortovskij"},
            {"sourceRecordUrl":"https://himki.mos-gorsud.ru/rs/lefortovskij"},
            {"regionCode":"54","regionName":"Новосибирская область"},
            {"courtCode":"54RS0014"},
        ]:
            with self.subTest(change=change),self.assertRaises(ImportValidationError):
                parse_record({**original,**change},"mos-gorsud-court")

    def test_direct_source_strict_https_and_path(self):
        self.assertTrue(official_url(SOURCE,"mos-gorsud-court",listing=True))
        self.assertTrue(official_url("https://www.mos-gorsud.ru/rs/lefortovskij",
                                     "mos-gorsud-court",listing=False))
        self.assertFalse(official_url("https://mos-gorsud.ru/opendata",
                                      "mos-gorsud-court",listing=True))
        self.assertFalse(official_url("https://mos-gorsud.ru/rs/lefortovskij?redirect=1",
                                      "mos-gorsud-court",listing=True))


if __name__=="__main__":
    unittest.main()
