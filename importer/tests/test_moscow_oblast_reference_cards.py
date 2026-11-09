"""Quality gates for the initial Moscow Oblast official-reference dossiers.

These cards record sourced contacts ONLY. This test deliberately does not infer
judge employment, hearing schedules, case outcomes or legal conclusions.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "apps/web/app/lib/official-reference-courts.ts"
DOSSIER = ROOT / "apps/web/app/courts/reference/[slug]/page.tsx"

class MoscowOblastReferenceCoverage(unittest.TestCase):
    def test_official_source_and_observation_dates(self):
        text = SOURCE.read_text(encoding="utf-8")
        sections = text.split("region:'region-50'")
        self.assertEqual(len(sections)-1, 15)
        self.assertEqual(text.count("sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud'"), 15)
        self.assertEqual(text.count("observedOn:'2026-11-09'"), 15)
        slugs = re.findall(r'slug:"(.*?)"', text)
        self.assertEqual(len(slugs), len(set(slugs)))
        for item in ("moscow-oblast-court","vidnoe-city-court","dubna-city-court",
                     "ramenskoe-city-court","shelkovo-city-court"):
            self.assertIn("slug:"+repr(item).replace("'",'"'), text)
    def test_dossier_does_not_assert_current_judges_or_unreviewed_cases(self):
        page = DOSSIER.read_text(encoding="utf-8")
        self.assertIn("court.observedOn", page)
        self.assertIn("состав судей, судебные дела", page)
        self.assertIn("robots:{index:false,follow:true}", page)
        self.assertIn("Именные сведения не публикуются без отдельной сверки", page)

if __name__ == "__main__":
    unittest.main()
