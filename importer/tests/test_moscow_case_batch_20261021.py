"""Verify the new (2026-10-21) official case batch without pretending to have full acts."""
import json
import re
import unittest
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/"apps/web/app/lib/moscow-adjudicated-cases.json"
class CourtCases20261021Tests(unittest.TestCase):
    def test_exact_verified_batch_count_and_topics(self):
        records=json.loads(DATA.read_text(encoding="utf-8"))
        self.assertEqual(len(records),74)
        new=[x for x in records if x.get("researched_on")=="2026-10-21"]
        self.assertEqual(len(new),29)
        self.assertEqual(Counter(x["topic_id"] for x in new),
           Counter({"consumer":18,"labor":6,"housing":5}))
        self.assertEqual(len({x["court_slug"] for x in new}),10)
        all_keys={(x["court_slug"],x["number"]) for x in records}
        self.assertEqual(len(all_keys),len(records))
        for case in new:
            self.assertRegex(case["number"],r"^02-\d+/(?:2025|2026)$")
            self.assertEqual(case["slug"],case["number"].replace("/","-"))
            u=urlsplit(case["source_url"])
            self.assertEqual(u.scheme,"https")
            self.assertEqual(u.hostname,"m.mos-gorsud.ru")
            self.assertTrue(u.path.startswith("/rs/"+case["court_slug"]+"/services/cases/civil/details/"))
            self.assertLessEqual(date.fromisoformat(case["decision_date"]),date.fromisoformat("2026-10-21"))
            self.assertGreater(len(case["subject"]),25)
            self.assertTrue(case["disposition"])
            self.assertEqual(case["status"],"official_docket_result")
            self.assertIsNone(case["published_document"])
            self.assertEqual(case["document_status"],"source_document_not_ingested")
            self.assertFalse(case["official_file_listed"])
            for personal_marker in ("Истец:","Ответчик:","паспорт", "телефон"):
                self.assertNotIn(personal_marker,case["subject"])

    def test_terminated_cases_not_described_as_judgments(self):
        ui=(ROOT/"apps/web/app/_components/moscow-cases-explorer.tsx").read_text(encoding="utf-8")
        self.assertIn("Итог первой инстанции:",ui)
        records=json.loads(DATA.read_text(encoding="utf-8"))
        settled=[x for x in records if x["number"]=="02-5557/2026" and x["court_slug"]=="nikulinskij"]
        self.assertEqual(len(settled),1)
        self.assertIn("прекращено",settled[0]["disposition"].lower())

if __name__=="__main__":
    unittest.main()
