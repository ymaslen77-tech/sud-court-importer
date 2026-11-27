"""Verify the dated Tushinsky judge roster imported from the official city portal.
The file is a historical published snapshot, not a certificate of current office.
"""
import json
import unittest
from pathlib import Path
from urllib.parse import urlsplit

APP=Path(__file__).resolve().parents[2]/"apps"/"web"/"app"
DATA=APP/"data"
ROSTER=json.loads((DATA/"moscow-2026-roster-refresh.json").read_text(encoding="utf-8"))["records"]
JUDGES=(APP/"lib/moscow-judge-directory.ts").read_text(encoding="utf-8")
SOURCE=(APP/"lib/moscow-district-source-evidence.ts").read_text(encoding="utf-8")
DETAIL=(APP/"_components/moscow-district-individual-dossier.tsx").read_text(encoding="utf-8")

class DatedRosterTests(unittest.TestCase):
 def test_official_snapshot_and_historical_claim_only(self):
  self.assertEqual(len(ROSTER),7)
  row=ROSTER[0]
  self.assertEqual(row["slug"],"tushinskiy")
  self.assertEqual(row["officialSlug"],"tushinskij")
  self.assertEqual(row["sourceLastUpdated"],"2026-09-18")
  self.assertEqual(row["observedOn"],"2026-11-12")
  self.assertEqual(row["status"],"published_roster_not_live_certification")
  self.assertEqual(len(row["judges"]),18)
  self.assertEqual(len(set(row["judges"])),18)
  self.assertTrue(all("0" not in name and len(name.split())==3 for name in row["judges"]))
  link=urlsplit(row["sourceUrl"])
  self.assertEqual(link.scheme,"https")
  self.assertEqual(link.hostname,"mos-gorsud.ru")
  self.assertEqual(link.path,"/rs/tushinskij/structure/judges")
  self.assertIn("не доказывает",row["notice"])
  self.assertIn("Юрьев0на",row["notice"])
  self.assertIn("Багринцева Наталья Юрьевна",row["judges"])
  self.assertIn("Гудошникова Елена Александровна",row["judges"])
  self.assertIn("Курахтанов Андрей Владимирович",row["judges"])

 def test_shcherbinsky_18_quoted_official_names_and_transfer_not_current(self):
  row=next(r for r in ROSTER if r["slug"]=="shcherbinskiy")
  self.assertEqual(row["officialSlug"],"shcherbinskij")
  self.assertEqual(row["sourceLastUpdated"],"2026-10-21")
  self.assertEqual(row["observedOn"],"2026-11-13")
  self.assertEqual(len(row["judges"]),18)
  self.assertEqual(len(set(row["judges"])),18)
  self.assertEqual(row["status"],"published_roster_not_live_certification")
  self.assertTrue(row["sourceUrl"].endswith("/rs/shcherbinskij/structure/judges"))
  for name in ("Патапенкова Юлия Александровна","Вороненко Яна Андреевна",
               "Будигина Наталья Геннадьевна","Федотов Дмитрий Игоревич",
               "Абрамкина Алла Олеговна"):
   self.assertIn(name,row["judges"])
  self.assertNotIn("Слизовский Алексей Александрович",row["judges"])
  events=json.loads((DATA/"moscow-judicial-appointment-events.json").read_text(encoding="utf-8"))["records"]
  transfers=[e for e in events if e["courtSlug"]=="shcherbinskiy" 
             and e["name"]=="Слизовский Алексей Александрович"]
  self.assertEqual(len(transfers),1)
  self.assertEqual(transfers[0]["eventType"],"appointed_to_moscow_city_court")
  self.assertEqual(transfers[0]["appointmentDate"],"2026-10-12")
  self.assertEqual(transfers[0]["decreeNumber"],"723")
  self.assertIn("12.10.2026",row["notice"])
  self.assertIn("21.10.2026",row["notice"])
  self.assertIn("не",row["notice"])
  notes={x["name"]:x["decree"] for x in row["appointmentNotes"]}
  self.assertEqual(len(notes),3)
  self.assertIn("№ 723",notes["Будигина Наталья Геннадьевна"])
  self.assertIn("№ 829",notes["Вороненко Яна Андреевна"])
  self.assertIn("№ 829",notes["Патапенкова Юлия Александровна"])

 def test_34_dated_published_roster_sets_not_35_current_staffs(self):
  filenames=[
   "moscow-district-judges-samples.json",
   "moscow-legacy-judge-rosters.json",
   "moscow-additional-judge-rosters.json",
   "moscow-2026-roster-refresh.json",
  ]
  rows=[row for name in filenames for row in json.loads((DATA/name).read_text(encoding="utf-8"))["records"]]
  all_slugs=[r["slug"] for r in rows]
  self.assertEqual(len(all_slugs),len(set(all_slugs)))
  self.assertEqual(len(all_slugs),34)
  for row in rows:
   self.assertEqual(row["status"],"published_roster_not_live_certification")
  districts=[r["slug"] for r in json.loads((DATA/"moscow-official-minimum-registry.json").read_text(encoding="utf-8"))["records"]
             if r["kind"]=="general-district"]
  missing=set(districts)-set(all_slugs)
  self.assertEqual(missing,{"meshchanskiy"})

 def test_kuzminsky_dated_published_list(self):
  row=next(r for r in ROSTER if r["slug"]=="kuzminskiy")
  self.assertEqual(row["officialSlug"],"kuzminskij")
  self.assertEqual(row["sourceLastUpdated"],"2026-08-24")
  self.assertEqual(row["observedOn"],"2026-11-27")
  self.assertEqual(len(row["judges"]),19)
  self.assertEqual(len(set(row["judges"])),19)
  self.assertEqual(row["status"],"published_roster_not_live_certification")
  self.assertEqual(row["sourceUrl"],"https://mos-gorsud.ru/rs/kuzminskij/structure/judges")
  self.assertIn("Русецкая Яна Викторовна",row["judges"])
  self.assertIn("Белова Екатерина Валерьевна",row["judges"])
  self.assertEqual(len(row["appointmentNotes"]),1)
  self.assertIn("№ 514",row["appointmentNotes"][0]["decree"])
  self.assertIn("не подтверждает текущий штат",row["notice"])

 def test_three_additional_historical_rosters(self):
  expected={"zamoskvoretskiy":(16,"2026-08-25"),"tverskoy":(17,"2026-10-26"),"khamovnicheskiy":(8,"2026-06-30")}
  for slug,(count,updated) in expected.items():
   row=next(r for r in ROSTER if r["slug"]==slug)
   self.assertEqual(len(row["judges"]),count)
   self.assertEqual(len(set(row["judges"])),count)
   self.assertEqual(row["sourceLastUpdated"],updated)
   self.assertEqual(row["status"],"published_roster_not_live_certification")
   self.assertIn("не",row["notice"].lower())
  ham=next(r for r in ROSTER if r["slug"]=="khamovnicheskiy")
  self.assertIn("Бычков Андрей Владимирович",ham["judges"])
  self.assertNotIn("Ермольева Татьяна Александровна",ham["judges"])
  self.assertIn("12.10.2026",ham["notice"])
  tver=next(r for r in ROSTER if r["slug"]=="tverskoy")
  self.assertIn("Семина Ольга Николаевна",tver["judges"])
  self.assertIn("Ильина (Бурая) Мария Сергеевна",tver["judges"])

 def test_chertanovsky_published_list(self):
  row=next(r for r in ROSTER if r["slug"]=="chertanovskiy")
  self.assertEqual(len(row["judges"]),14)
  self.assertEqual(len(set(row["judges"])),14)
  self.assertEqual(row["sourceLastUpdated"],"2026-06-02")
  self.assertEqual(row["status"],"published_roster_not_live_certification")
  self.assertEqual(row["appointmentNotes"],[])
  self.assertIn("Рудь Александра Игоревна",row["judges"])
  self.assertIn("Глух Василий Николаевич",row["judges"])

 def test_same_source_reused_without_relabeling_live_judges(self):
  self.assertIn("moscow-2026-roster-refresh.json",JUDGES)
  self.assertIn("...refreshedRosters.records",JUDGES)
  self.assertIn("moscow-2026-roster-refresh.json",SOURCE)
  self.assertIn("...refreshedRosters.records",SOURCE)
  self.assertIn("publishedRoster.notice",DETAIL)
  self.assertIn("Не следует считать подборку обязательно полной",DETAIL)

 def test_legacy_unverified_cases_and_decisions_untouched(self):
  reviewed=json.loads((DATA/"moscow-judge-reviewed-decisions.json").read_text(encoding="utf-8"))["records"]
  self.assertEqual(len(reviewed),0)
  for row in json.loads((DATA/"moscow-court-judgment-review-queue.json").read_text(encoding="utf-8"))["records"]:
   self.assertFalse(row["reasoningReviewed"])
   self.assertFalse(row["publicationRestrictionsChecked"])
   self.assertIsNone(row["decisionTextHash"])

if __name__=="__main__":
 unittest.main()
