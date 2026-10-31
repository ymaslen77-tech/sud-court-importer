"""No invented judges, case outcomes, or address-level territory assertions."""
import json,re,unittest
from pathlib import Path
from urllib.parse import urlsplit

APP=Path(__file__).resolve().parents[2]/"apps/web/app"
ROSTERS=json.loads((APP/"data/moscow-district-judges-samples.json").read_text(encoding="utf-8"))["records"]
CASES=json.loads((APP/"data/moscow-district-sourced-case-samples.json").read_text(encoding="utf-8"))["records"]
COURTS=json.loads((APP/"data/moscow-district-individual-dossiers.json").read_text(encoding="utf-8"))["records"]
UI=(APP/"_components/moscow-district-individual-dossier.tsx").read_text(encoding="utf-8")
CHECKER=(APP/"_components/moscow-district-address-lookup.tsx").read_text(encoding="utf-8")
GUIDE=(APP/"_components/moscow-district-registry-guide.tsx").read_text(encoding="utf-8")

class MoscowPublishedEvidenceTests(unittest.TestCase):
 def test_judge_rosters_exactly_sourced_and_not_live_certified(self):
  self.assertEqual({c["slug"] for c in ROSTERS},{"butyrskiy","golovinskiy","dorogomilovskiy","cheryomushkinskiy","nagatinskiy"})
  counts={"butyrskiy":18,"golovinskiy":13,"dorogomilovskiy":14,"cheryomushkinskiy":17,"nagatinskiy":16}
  self.assertEqual(sum(len(x["judges"]) for x in ROSTERS),78)
  for court in ROSTERS:
   self.assertEqual(len(court["judges"]),counts[court["slug"]])
   self.assertEqual(len(set(court["judges"])),len(court["judges"]))
   self.assertEqual(court["sourceUrl"],"https://mos-gorsud.ru/rs/"+court["officialSlug"]+"/structure/judges")
   self.assertEqual(court["status"],"published_roster_not_live_certification")
   self.assertRegex(court["sourceLastUpdated"],r"^20\d\d-\d\d-\d\d$")
   for appointment in court["appointmentNotes"]:
    self.assertIn(appointment["name"],court["judges"])
    self.assertIn("Указ Президента РФ",appointment["decree"])
   self.assertNotIn("biographies",court)
 def test_cases_are_real_registry_records_not_outcome_claims(self):
  self.assertEqual(len(CASES),4)
  self.assertEqual(len({c["slug"] for c in CASES}),4)
  for court in CASES:
   self.assertIn(court["slug"],{c["slug"] for c in COURTS})
   self.assertEqual(court["sourceUrl"],"https://mos-gorsud.ru/rs/"+court["officialSlug"]+"/services/cases/civil")
   self.assertFalse(court["finalDecisionConfirmed"])
   for case in court["cases"]:
    self.assertRegex(case["number"],r"^02-\d+/2026$")
    self.assertGreater(len(case["category"]),20)
    self.assertNotIn("Истец:",case["category"])
    self.assertNotIn("Ответчик:",case["category"])
 def test_ui_cautions_and_official_sources(self):
  for fragment in ("publishedRoster.sourceLastUpdated","publishedRoster.judges.map","publishedRoster.sourceUrl",
                   "docket.sourceUrl","docket.cases.map","исход споров неизвестен",
                   "Судебная практика с мотивировкой"):
   self.assertIn(fragment,UI)
  self.assertIn('window.open(\'https://mos-gorsud.ru/territorial\'',CHECKER)
  self.assertIn("navigator.clipboard.writeText(value)",CHECKER)
  self.assertIn("Номер квартиры и ФИО",CHECKER)
  self.assertIn("MoscowDistrictAddressLookup courtName={court.name}",GUIDE)
  self.assertNotIn("approvedRules.map",CHECKER)
if __name__=="__main__":unittest.main()
