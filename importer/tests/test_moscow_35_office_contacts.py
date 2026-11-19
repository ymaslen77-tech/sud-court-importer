"""All 35 Moscow district courts have individually sourced practical reception contacts.

The audit checks the presence and provenance of publication, not real-time
reachability or that a line still answers. No private case content is inspected.
"""
import json
import re
import unittest
from pathlib import Path

DATA=Path(__file__).resolve().parents[2]/"apps/web/app/data"
COURTS=json.loads((DATA/"moscow-official-minimum-registry.json").read_text(encoding="utf-8"))["records"]
FACTS=json.loads((DATA/"moscow-district-practical-facts.json").read_text(encoding="utf-8"))["records"]
OFFICIAL={r["slug"]:r for r in COURTS if r["kind"]=="general-district"}

class MoscowThirtyFiveOfficeCoverage(unittest.TestCase):
 def test_full_individual_department_coverage(self):
  self.assertEqual(len(OFFICIAL),35)
  self.assertEqual(len(FACTS),35)
  self.assertEqual({r["slug"] for r in FACTS},set(OFFICIAL))
  self.assertTrue(all(r["serviceHours"] for r in FACTS))
  self.assertTrue(all(isinstance(r["travel"],str) and len(r["travel"].strip())>15 for r in FACTS))
  for row in FACTS:
   with self.subTest(court=row["slug"]):
    self.assertRegex(row["sourceUrl"],
       r"^https://(?:(?:www|m|mks|interportal)\.)?mos-gorsud\.ru/rs/[a-z0-9-]+/(?:help/hours|hours)$")
    for item in row["serviceHours"]:
     self.assertTrue(item["label"] and item["schedule"])
     if item["phone"] is not None:
      self.assertRegex(item["phone"],r"^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$")

 def test_relocation_exceptions_are_preserved(self):
  for slug in ("presnenskiy","zyuzinskiy","zamoskvoretskiy","cheryomushkinskiy"):
   self.assertGreater(len(OFFICIAL[slug].get("visitor_locations",[])),0)
  pres=next(x for x in FACTS if x["slug"]=="presnenskiy")
  self.assertIn("Измайловского",pres["serviceHours"][0]["label"])
  self.assertIn("Первомайской",pres["travel"])
  zy=next(x for x in FACTS if x["slug"]=="zyuzinskiy")
  self.assertIn("Никулинского",zy["travel"])
  self.assertIn("Щербинского",zy["travel"])
  self.assertIn("КоАП",zy["travel"])

 def test_conflicting_phones_are_not_silently_certified(self):
  for slug in ("golovinskiy","presnenskiy","taganskiy","zyuzinskiy"):
   record=next(x for x in FACTS if x["slug"]==slug)
   self.assertIsNone(record["anticorruptionPhone"])
   self.assertTrue(any("различ" in note or "Неоднознач" in note
                       for note in record["notes"]))

 def test_official_updated_dates_are_publication_metadata(self):
  for slug in ("gagarinskiy","golovinskiy","nagatinskiy","presnenskiy",
               "savelovskiy"):
   row=next(r for r in FACTS if r["slug"]==slug)
   self.assertRegex(row["sourceUpdatedOn"],r"^2026-\d\d-\d\d$")

if __name__=="__main__": unittest.main()
