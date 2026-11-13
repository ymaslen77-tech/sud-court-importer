"""Regression guard for the 36-entry official Moscow court minimum directory."""
from pathlib import Path
import json
import re
import unittest

APP=Path(__file__).resolve().parents[2]/"apps"/"web"/"app"
DB=APP/"data"/"moscow-official-minimum-registry.json"
RICH=APP/"lib"/"moscow-court-dossiers.json"

class MoscowOfficialMinimumTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.db=json.loads(DB.read_text(encoding="utf-8"))
  cls.rows=cls.db["records"]
  cls.rich=json.loads(RICH.read_text(encoding="utf-8"))
  cls.listing=(APP/"courts"/"moscow"/"page.tsx").read_text(encoding="utf-8")
  cls.details=(APP/"courts"/"moscow"/"registry"/"[slug]"/"page.tsx").read_text(encoding="utf-8")
  cls.helpers=(APP/"lib"/"moscow-official-minimum.ts").read_text(encoding="utf-8")

 def test_all_names_and_codes_have_unique_entries(self):
  self.assertEqual(len(self.rows),36)
  self.assertEqual(sum(r["kind"]=="general-district" for r in self.rows),35)
  self.assertEqual(sum(r["kind"]=="general-regional" for r in self.rows),1)
  self.assertEqual(len({r["slug"] for r in self.rows}),36)
  codes=[r["directory_code"] for r in self.rows if r["kind"]=="general-district"]
  self.assertEqual(set(codes),{str(i).zfill(2) for i in range(1,36)})
  self.assertEqual(self.rows[0]["name"],"Московский городской суд")
  self.assertEqual(len(self.rows[0]["other_locations"]),1)
  self.assertEqual(self.rows[0]["email"],"mgs@mos-gorsud.ru")

 def test_every_entry_has_verifiable_source_and_office_hours(self):
  for row in self.rows:
   with self.subTest(row=row["slug"]):
    self.assertTrue(row["source_url"].startswith("https://"))
    self.assertIn("mos-gorsud.ru",row["source_url"])
    self.assertIn("Москва",row["address"])
    self.assertIn("09:00",row["office_hours"])
    self.assertIn("16:45",row["office_hours"])
    self.assertIn("@",row["email"])
    self.assertEqual(row["status"],"official_directory_reference_unverified_live")
    self.assertIn("530-08-08",row["general_hotline"])
  self.assertFalse(self.db["meta"]["current_contact_details_verified"])
  self.assertEqual(self.db["meta"]["roster_updated_on"],"2026-05-29")

 def test_rich_profiles_remain_linked_not_overwritten(self):
  self.assertEqual(len(self.rich),12)
  normalized=lambda s:re.sub(r"\s+"," ",s.lower().replace("ё","е")).strip()
  for detailed in self.rich:
   self.assertTrue(any(normalized(detailed["name"]).startswith(normalized(row["name"]))
                  for row in self.rows),detailed["slug"])
  self.assertIn("moscowCourts().find",self.helpers)
  self.assertIn("MoscowOfficialCourtHref(c)",self.listing)
  self.assertIn("hasRich",self.details)

 def test_only_moscow_general_courts_claimed_and_noindex_stays(self):
  for text in (self.listing,self.details):
   self.assertIn("moscowDistrictSeoRobots()",text)
  self.assertIn("Мировые судьи",self.listing)
  self.assertIn("Арбитражные суды",self.listing)
  self.assertIn("не подтверждена повторно",self.details)
  self.assertNotIn("current_details_attested:true",self.details)
  self.assertNotIn("verified:true",self.helpers)
  self.assertIn("generateStaticParams()",self.details)
  self.assertIn("return MOSCOW_OFFICIAL_MINIMUM_COURTS.map",self.details)

 def test_temporary_visits_have_official_evidence_and_postal_addresses(self):
  relocations={r["slug"]:r for r in self.rows if r.get("visitor_locations")}
  self.assertEqual(set(relocations),{
   "presnenskiy","zamoskvoretskiy","zyuzinskiy","cheryomushkinskiy"
  })
  for name,row in relocations.items():
   with self.subTest(court=name):
    self.assertTrue(row["location_notice_url"].startswith("https://mos-gorsud.ru/")
                    or row["location_notice_url"].startswith("https://www.mos-gorsud.ru/"))
    self.assertIn("почт",row["location_notice"].lower())
    self.assertTrue(row["visitor_locations"])
    self.assertNotEqual(row["address"],row["visitor_locations"][0]["address"])
  self.assertEqual(len(relocations["zamoskvoretskiy"]["visitor_locations"]),3)
  self.assertEqual(len(relocations["zyuzinskiy"]["visitor_locations"]),2)
  self.assertIn("Севастопольский",relocations["cheryomushkinskiy"]["visitor_locations"][0]["address"])
  rich_page=(APP/"courts/moscow/[slug]/page.tsx").read_text(encoding="utf-8")
  self.assertIn("officialMinimum?.visitor_locations",rich_page)
  self.assertIn("Почтовый адрес суда",rich_page)

 def test_no_duplicate_judges_or_case_data_in_basic_rows(self):
  for row in self.rows:
   self.assertNotIn("judges",row)
   self.assertNotIn("cases",row)
   self.assertNotIn("territorial_boundaries",row)
   self.assertNotIn("court_chairperson",row)

if __name__=="__main__":unittest.main()
