"""Provenance and stage gates for Moscow court judges and judicial decisions.

No network and no personal litigant data. Counts refer to source-bound names,
never to currently serving judges or a statistically complete case corpus.
"""
import json
import unittest
from pathlib import Path
from urllib.parse import urlsplit

APP=Path(__file__).resolve().parents[2]/"apps/web/app"
DATA=APP/"data"


def rows(name):
 return json.loads((DATA/name).read_text(encoding="utf-8"))["records"]


class MoscowUnverifiedSourceGates(unittest.TestCase):
 def test_each_district_has_accessible_judge_and_case_topics(self):
  district=[c for c in rows("moscow-official-minimum-registry.json") if c["kind"]=="general-district"]
  judge_directory=(APP/"courts/moscow/judges/page.tsx").read_text(encoding="utf-8")
  topics=(APP/"courts/moscow/registry/[slug]/info/[topic]/page.tsx").read_text(encoding="utf-8")
  panel=(APP/"_components/moscow-court-published-evidence.tsx").read_text(encoding="utf-8")
  self.assertEqual(len(district),35)
  self.assertIn("rosterRows.map",judge_directory)
  self.assertIn("publishedRosters=rosterRows.filter",judge_directory)
  self.assertIn("MoscowCourtPublishedJudges courtSlug={slug}",topics)
  self.assertIn("MoscowCourtPublishedCases courtSlug={slug}",topics)
  self.assertIn("moscowJudgeSourceLabel(person.sourceKind)",panel)
  self.assertIn("moscowJudgeAppointmentEvents(courtSlug,person.name)",panel)
  self.assertIn("Позднейшее кадровое событие",panel)
  self.assertIn("Историческая публикация не удостоверяет",panel)
  self.assertIn("не все дела суда",panel)
  self.assertIn("Мотивировочный текст судебного акта",panel)
  self.assertIn("moscowJudgeCaseCrosscheck(courtSlug,row.number)",panel)
  self.assertIn("Результат пересмотра не подтверждён.",panel)
  self.assertIn("appeal.witnesses.map",panel)

 def test_six_dated_official_appointment_notices_are_not_current_roster_claims(self):
  added=[r for r in rows("moscow-confirmed-appointment-additions.json") if r["observedOn"]=="2026-11-10"]
  self.assertEqual(len(added),6)
  expected={
   ("shcherbinskiy","Вороненко Яна Андреевна"),
   ("shcherbinskiy","Патапенкова Юлия Александровна"),
   ("shcherbinskiy","Слизовский Алексей Александрович"),
   ("shcherbinskiy","Шаболтас Анна Владимировна"),
   ("tushinskiy","Курахтанов Андрей Владимирович"),
   ("tverskoy","Комлев Сергей Владимирович")
  }
  self.assertEqual({(r["courtSlug"],r["name"]) for r in added},expected)
  for row in added:
   self.assertEqual(row["kind"],"official_appointment_not_current_roster")
   self.assertEqual(urlsplit(row["sourceUrl"]).hostname,"mos-gorsud.ru")
   self.assertIn("/rs/",row["sourceUrl"])
   self.assertTrue(row["decreeNumber"].isdigit())
  transfer=[e for e in rows("moscow-judicial-appointment-events.json") if e["name"]=="Слизовский Алексей Александрович"]
  self.assertEqual(len(transfer),1)
  self.assertEqual(transfer[0]["courtSlug"],"shcherbinskiy")
  self.assertEqual(transfer[0]["eventType"],"appointed_to_moscow_city_court")
  self.assertEqual(transfer[0]["appointmentDate"],"2026-10-12")

 def test_conflicted_identity_and_unverified_case_text_remain_blocked(self):
  conflicts=rows("moscow-judicial-source-discrepancies.json")
  self.assertTrue(any(x["courtSlug"]=="tverskoy" and x["status"]=="official_sources_conflict" for x in conflicts))
  reviewed=rows("moscow-judge-reviewed-decisions.json")
  self.assertEqual(len(reviewed),0)
  queue=rows("moscow-court-judgment-review-queue.json")
  self.assertTrue(queue)
  self.assertTrue(all(not x["reasoningReviewed"] for x in queue))
  self.assertTrue(all(not x["publicationRestrictionsChecked"] for x in queue))
  self.assertTrue(all(x["decisionTextHash"] is None for x in queue))
  cases=rows("moscow-judge-case-evidence.json")
  self.assertTrue(all(x["judicialActTextVerified"] is False for x in cases))
  self.assertTrue(all("participants" not in x and "parties" not in x for x in cases))


if __name__=="__main__":
 unittest.main()
