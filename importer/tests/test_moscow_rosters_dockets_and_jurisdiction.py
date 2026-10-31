"""No invented judges, case outcomes, or address-level territory assertions."""
import json,re,unittest
from pathlib import Path
from urllib.parse import urlsplit

APP=Path(__file__).resolve().parents[2]/"apps/web/app"
ROSTERS=json.loads((APP/"data/moscow-district-judges-samples.json").read_text(encoding="utf-8"))["records"]
CASES=json.loads((APP/"data/moscow-district-sourced-case-samples.json").read_text(encoding="utf-8"))["records"]
VISITS=json.loads((APP/"data/moscow-court-judge-specific-visits.json").read_text(encoding="utf-8"))["records"]
OUTCOMES=json.loads((APP/"data/moscow-verified-court-outcomes.json").read_text(encoding="utf-8"))["records"]
COURTS=json.loads((APP/"data/moscow-district-individual-dossiers.json").read_text(encoding="utf-8"))["records"]
UI=(APP/"_components/moscow-district-individual-dossier.tsx").read_text(encoding="utf-8")
CHECKER=(APP/"_components/moscow-district-address-lookup.tsx").read_text(encoding="utf-8")
GUIDE=(APP/"_components/moscow-district-registry-guide.tsx").read_text(encoding="utf-8")

class MoscowPublishedEvidenceTests(unittest.TestCase):
 def test_judge_rosters_exactly_sourced_and_not_live_certified(self):
  expected={x["slug"] for x in COURTS}-{"tverskoy","tushinskiy","chertanovskiy"}
  self.assertEqual({c["slug"] for c in ROSTERS},expected)
  self.assertEqual(len(ROSTERS),20)
  self.assertEqual(sum(len(x["judges"]) for x in ROSTERS),283)
  for court in ROSTERS:
   self.assertGreaterEqual(len(court["judges"]),8)
   self.assertEqual(len(set(court["judges"])),len(court["judges"]))
   self.assertIn(court["sourceUrl"],("https://mos-gorsud.ru/rs/"+court["officialSlug"]+"/structure/judges","https://mos-gorsud.ru/rs/"+court["officialSlug"]+"/info/structure/judges"))
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
 def test_relocation_by_nine_judges_is_primary_sourced(self):
  self.assertEqual(len(VISITS),1)
  self.assertEqual(VISITS[0]["slug"],"cheryomushkinskiy")
  self.assertEqual(len(VISITS[0]["judgeVisits"]),9)
  self.assertEqual(len({x["judge"] for x in VISITS[0]["judgeVisits"]}),9)
  self.assertIn("Кржижановского",VISITS[0]["postalAddress"])
  self.assertIn("/news/",VISITS[0]["sourceUrl"])
  self.assertIn("judgeVisits.judgeVisits.map",UI)
 def test_confirmed_court_result_without_invented_reasoning(self):
  self.assertEqual(len(OUTCOMES),1)
  x=OUTCOMES[0]
  self.assertEqual(x["number"],"02-3978/2026")
  self.assertEqual(x["publishedOutcome"],"Удовлетворено частично")
  self.assertFalse(x["fullDecisionTextVerified"])
  self.assertFalse(x["reasoningVerified"])
  self.assertIn("/civil/details/",x["sourceUrl"])
  self.assertIn("moscowVerifiedOutcome",UI)
  self.assertIn("подборку обязательно полной",UI)
  self.assertIn("judgesLink=publishedRoster?.sourceUrl??official.courtStructure",UI)
if __name__=="__main__":unittest.main()
