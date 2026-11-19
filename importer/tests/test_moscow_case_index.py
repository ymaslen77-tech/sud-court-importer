"""Public Moscow case index: source provenance, privacy and honest coverage.

No live scraping or personal data from litigants. This test validates the
published index boundary, not the legal correctness of any court decision.
"""
import json
import unittest
from pathlib import Path
from urllib.parse import urlsplit

APP = Path(__file__).resolve().parents[2] / "apps" / "web" / "app"
DATA = APP / "data"


def records(filename):
    return json.loads((DATA / filename).read_text(encoding="utf-8"))["records"]


class MoscowCaseIndexTests(unittest.TestCase):
    def test_case_search_is_available_and_linked_from_court_journeys(self):
        page = (APP / "courts/moscow/cases/page.tsx").read_text(encoding="utf-8")
        explorer = (APP / "_components/moscow-case-index-explorer.tsx").read_text(encoding="utf-8")
        main = (APP / "courts/moscow/page.tsx").read_text(encoding="utf-8")
        judges = (APP / "courts/moscow/judges/page.tsx").read_text(encoding="utf-8")
        court_cases = (APP / "_components/moscow-court-published-evidence.tsx").read_text(encoding="utf-8")
        self.assertIn("MOSCOW_JUDGE_CASE_EVIDENCE.map", page)
        self.assertIn("moscowJudgeCaseCrosscheck(item.courtSlug,item.number)", page)
        self.assertIn("robots:{index:false,follow:true}", page)
        self.assertIn("MoscowCaseIndexExplorer", page)
        self.assertIn("case-search", explorer)
        self.assertIn("c.status==='outcome_recorded'", explorer)
        self.assertIn("single_official_record_unchecked_live", explorer)
        self.assertIn("Результат пересмотра не установлен", explorer)
        self.assertIn("Мотивировка судебного акта", explorer)
        for section in (main, judges, court_cases):
            self.assertIn('href="/courts/moscow/cases"', section)

    def test_public_search_dataset_has_only_official_non_participant_metadata(self):
        courts = [r for r in records("moscow-official-minimum-registry.json")
                  if r["kind"] == "general-district"]
        known = {r["slug"] for r in courts}
        self.assertEqual(len(known), 35)
        cases = records("moscow-judge-case-evidence.json") + records("moscow-judge-bulk-cases.json")
        self.assertTrue(cases)
        for row in cases:
            with self.subTest(court=row["courtSlug"], case=row["number"]):
                self.assertIn(row["courtSlug"], known)
                self.assertTrue(row["judgeName"].strip())
                self.assertTrue(row["number"].strip())
                self.assertTrue(row["category"].strip())
                self.assertIn(row["status"], {"outcome_recorded", "pending"})
                self.assertIs(row["judicialActTextVerified"], False)
                self.assertEqual(urlsplit(row["sourceUrl"]).scheme, "https")
                self.assertIn(urlsplit(row["sourceUrl"]).hostname,
                              {"mos-gorsud.ru", "www.mos-gorsud.ru", "m.mos-gorsud.ru"})
                self.assertNotIn("participants", row)
                self.assertNotIn("parties", row)
                self.assertNotIn("claimant", row)
                self.assertNotIn("respondent", row)


if __name__ == "__main__":
    unittest.main()
