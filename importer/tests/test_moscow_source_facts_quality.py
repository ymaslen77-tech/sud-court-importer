import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "apps/web/app/data"


class MoscowSourceFactsQuality(unittest.TestCase):
    def test_source_records_are_unique_and_anchored_in_official_roster(self):
        data = json.loads((DATA / "moscow-district-practical-facts.json").read_text(encoding="utf-8"))
        courts = json.loads((DATA / "moscow-official-minimum-registry.json").read_text(encoding="utf-8"))
        allowed = {r["slug"] for r in courts["records"] if r["kind"] == "general-district"}
        rows = data["records"]
        self.assertEqual(len(rows), 21)
        self.assertEqual(len({r["slug"] for r in rows}), 21)
        self.assertTrue({r["slug"] for r in rows} <= allowed)
        for row in rows:
            with self.subTest(court=row["slug"]):
                self.assertTrue(re.fullmatch(r"https://(?:www\.)?mos-gorsud\.ru/rs/[a-z0-9-]+/help/hours", row["sourceUrl"]))
                if row["accessiblePhone"] is not None:
                    self.assertRegex(row["accessiblePhone"], r"^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$")
                if row["anticorruptionPhone"] is not None:
                    self.assertRegex(row["anticorruptionPhone"], r"^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$")
                self.assertTrue(all(bool(i["label"]) and bool(i["schedule"]) for i in row["serviceHours"]))
                self.assertNotIn("participants", str(row))

    def test_no_unsupported_publication_claims(self):
        src = (ROOT / "apps/web/app/_components/moscow-court-evidence-and-journey.tsx").read_text(encoding="utf-8")
        self.assertIn("officialSlug", src)
        self.assertIn("moscowJudgeProfilesForCourt", src)
        self.assertIn("item.sourceUrl", src)
        self.assertIn("без обязательных дополнительных страниц", src)
        self.assertIn("Полный текст акта не проверен", src)
        self.assertIn("Это не все дела суда", src)


if __name__ == "__main__":
    unittest.main()
