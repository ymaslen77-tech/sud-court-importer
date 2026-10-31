"""Prevent the 12 rich Moscow court dossiers from hiding the full 36-entry official registry."""
import json
import re
import unittest
from pathlib import Path

APP=Path(__file__).resolve().parents[2]/"apps"/"web"/"app"
DATA=json.loads((APP/"data/moscow-official-minimum-registry.json").read_text(encoding="utf-8"))["records"]
RICH=json.loads((APP/"lib/moscow-court-dossiers.json").read_text(encoding="utf-8"))
HOME=(APP/"courts/page.tsx").read_text(encoding="utf-8")
MOSCOW=(APP/"courts/moscow/page.tsx").read_text(encoding="utf-8")
SEARCH=(APP/"search/page.tsx").read_text(encoding="utf-8")
DETAIL=(APP/"courts/moscow/registry/[slug]/page.tsx").read_text(encoding="utf-8")
HELP=(APP/"lib/moscow-official-minimum.ts").read_text(encoding="utf-8")
GUIDE=(APP/"_components/moscow-district-registry-guide.tsx").read_text(encoding="utf-8")
INDIVIDUAL=(APP/"lib/moscow-district-reviewed-contacts.ts").read_text(encoding="utf-8")

def normalize(s):
 return re.sub(r"\s+"," ",s.lower().replace("ё","е")).strip()

class MoscowCompleteDirectoryTests(unittest.TestCase):
 def test_complete_unique_36_records_and_rich_dossier_mapping(self):
  self.assertEqual(len(DATA),36)
  self.assertEqual(len({r["slug"] for r in DATA}),36)
  self.assertEqual(len({normalize(r["name"]) for r in DATA}),36)
  self.assertEqual(sum(r["kind"]=="general-district" for r in DATA),35)
  self.assertEqual(sum(r["kind"]=="general-regional" for r in DATA),1)
  self.assertEqual(len(RICH),12)
  for row in RICH:
   matches=[c for c in DATA if normalize(row["name"]).startswith(normalize(c["name"]))]
   self.assertEqual(len(matches),1,row["name"])
   self.assertEqual(matches[0]["kind"],"general-district")
  for row in DATA:
   self.assertTrue(row["address"])
   self.assertTrue(row["email"])

 def test_national_directory_uses_official_count_not_research_subset(self):
  self.assertIn("moscowCount=MOSCOW_OFFICIAL_MINIMUM_COURTS.length",HOME)
  self.assertIn("moscowRichCount=moscowCourts().length",HOME)
  self.assertIn("{moscowCount} карточек",HOME)
  self.assertIn('href="/courts/moscow"',HOME)
  self.assertIn('href="/search?region=moscow"',HOME)

 def test_search_uses_full_registry_with_both_court_levels(self):
  self.assertIn("MOSCOW_OFFICIAL_MINIMUM_COURTS.filter",SEARCH)
  self.assertIn("kind==='general-regional'",SEARCH)
  self.assertIn("kind==='general-district'",SEARCH)
  self.assertIn("href={MoscowOfficialCourtHref(c)}",SEARCH)
  self.assertIn("c.directory_code??''",SEARCH)
  self.assertNotIn("moscowCourts().filter(c=>",SEARCH)
  self.assertIn("moscowCourts().find",HELP)

 def test_all_basic_districts_have_guidance_not_fictitious_case_data(self):
  self.assertIn("<MoscowDistrictRegistryGuide court={court}/>",DETAIL)
  self.assertIn("court.kind==='general-district'",DETAIL)
  self.assertIn("if(slug==='moscow-city-court')return <MoscowCityCourtDossier court={court}/>;",DETAIL)
  for anchor in ("jurisdiction","competence","filing","cases","appeal","fees","judges","faq"):
   self.assertIn('id="district-'+anchor+'"',GUIDE)
  for url in ("https://mos-gorsud.ru/rs","https://mos-gorsud.ru/territorial",
              "https://mos-gorsud.ru/search","https://mos-gorsud.ru/lk"):
   self.assertIn(url,GUIDE)
  self.assertIn("Сведения о судьях, делах и адресных границах",GUIDE)
  self.assertIn("moscowDistrictTopicHref(court.slug,id)",GUIDE)
  self.assertIn("неподтверждённые номера дел",GUIDE)
  self.assertIn("robots:moscowDistrictSeoRobots()",DETAIL)
  self.assertIn("Московский городской суд",MOSCOW)

 def test_first_five_individual_court_contacts_have_primary_sources(self):
  for slug in ("butyrskiy","golovinskiy","izmaylovskiy","savelovskiy","tverskoy"):
   self.assertIn(slug+":{",INDIVIDUAL)
   self.assertTrue(any(row["slug"]==slug for row in DATA))
  self.assertIn("https://mos-gorsud.ru/rs/butyrskij",INDIVIDUAL)
  self.assertIn("https://mos-gorsud.ru/rs/golovinskij",INDIVIDUAL)
  self.assertIn("https://mos-gorsud.ru/rs/izmajlovskij",INDIVIDUAL)
  self.assertIn("https://mos-gorsud.ru/rs/savelovskij",INDIVIDUAL)
  self.assertIn("https://mos-gorsud.ru/rs/tverskoj",INDIVIDUAL)
  self.assertIn("archiveHours:",INDIVIDUAL)
  self.assertIn("reviewedContact.expeditionPhone",DETAIL)
  self.assertIn("reviewedContact.archivePhone",DETAIL)
  self.assertIn("rel=\"noopener noreferrer\"",DETAIL)

if __name__=="__main__":unittest.main()
