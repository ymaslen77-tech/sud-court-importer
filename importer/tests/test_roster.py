import copy
import json
import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from roster import captured_date, official_moscow_url, parse

FIXTURE=Path(__file__).resolve().parents[1]/"seeds"/"lefortovsky-judges-official-page-unreviewed.json"


class RosterTests(unittest.TestCase):
    def sample(self):
        return json.loads(FIXTURE.read_text(encoding="utf-8"))

    def test_official_roster_is_evidence_not_appointments(self):
        doc=parse(FIXTURE.read_bytes())
        self.assertEqual(len(doc["judges"]),11)
        self.assertEqual(doc["pageLastUpdated"],"2026-04-22")
        self.assertTrue(all(x["position"]=="судья" for x in doc["judges"]))
        self.assertEqual(len({x["fullName"] for x in doc["judges"]}),11)
        self.assertEqual(doc["sourceUrl"],
            "https://www.mos-gorsud.ru/rs/lefortovskij/structure/judges")

    def test_court_roster_must_be_from_same_official_court(self):
        obj=self.sample()
        for source in (
            "https://www.mos-gorsud.ru/rs/another/structure/judges",
            "https://mos-gorsud.ru.evil.invalid/rs/lefortovskij/structure/judges",
            "http://www.mos-gorsud.ru/rs/lefortovskij/structure/judges",
            "file:///etc/passwd",
        ):
            with self.subTest(url=source), self.assertRaises(ImportValidationError):
                parse(json.dumps({**obj,"sourceUrl":source}).encode())

    def test_duplicate_names_rejected(self):
        obj=self.sample()
        obj["judges"].append(copy.deepcopy(obj["judges"][0]))
        with self.assertRaises(ImportValidationError):
            parse(json.dumps(obj,ensure_ascii=False).encode())

    def test_invalid_decree_and_phone(self):
        obj=self.sample()
        obj["judges"][0]["decreeNumber"]="!!"
        with self.assertRaises(ImportValidationError):
            parse(json.dumps(obj,ensure_ascii=False).encode())
        obj=self.sample()
        obj["judges"][0]["telephone"]="javascript:alert(1)"
        with self.assertRaises(ImportValidationError):
            parse(json.dumps(obj,ensure_ascii=False).encode())

    def test_future_capture_rejected(self):
        with self.assertRaises(ImportValidationError):
            captured_date(str(date.today().replace(year=date.today().year+1)))

    def test_roster_may_be_old_but_capture_must_be_current(self):
        self.assertEqual(captured_date("2026-04-22",max_age=365*10),date(2026,4,22))
        self.assertEqual(official_moscow_url("https://www.mos-gorsud.ru/rs/lefortovskij")[1],
                         "/rs/lefortovskij")

if __name__=="__main__":
    unittest.main()
