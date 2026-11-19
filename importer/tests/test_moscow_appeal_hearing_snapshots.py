"""An appointment to hear an appeal is NOT a completed hearing or a judgment.

Validate identity, official source, dates, and privacy for each public snapshot.
"""
import copy
import sys
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
import verify_moscow_appeal_hearing_snapshots as check

APP=ROOT/"apps/web/app"

class DatedAppellateHearingTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows=check.records(check.SNAPSHOTS)
  cls.links=check.records(check.CROSS)

 def test_official_nikulinsky_2026_11_19_appointment_only(self):
  self.assertEqual(check.validate(),1)
  r=self.rows[0]
  self.assertEqual(r["courtSlug"],"nikulinskiy")
  self.assertEqual(r["caseNumber"],"02-0514/2026")
  self.assertEqual(r["uin"],"77RS0018-02-2025-003155-71")
  self.assertEqual(r["appealCaseNumber"],"33-53951/2026")
  self.assertEqual(r["appealDocket"],"Ж-65034/2026")
  self.assertEqual(r["observedOn"],"2026-11-13")
  self.assertEqual(r["hearingDate"],"2026-11-19")
  self.assertEqual(r["hearingTime"],"10:30")
  self.assertIn("570",r["venueAsPublished"])
  self.assertIsNone(r["appealResult"])
  self.assertIs(r["judicialActTextVerified"],False)

 def test_reject_invented_result_mismatched_identity_or_stale_claim(self):
  for field,value in [
   ("appealResult","Оставлено без изменения"),
   ("judicialActTextVerified",True),
   ("uin","77RS0018-02-2025-003155-72"),
   ("appealDocket","Ж-1/2026"),
   ("sourceUrl","https://example.com/other"),
   ("hearingTime","09:00"),
   ("hearingDate","2026-11-20"),
   ("observedOn","2026-12-01"),
   ("statusAsPublished","Заседание состоялось"),
  ]:
   row=copy.deepcopy(self.rows[0])
   row[field]=value
   with self.subTest(field=field),self.assertRaises(ValueError):
    check.validate([row],self.links)

 def test_reject_duplicate_observation_and_private_party_details(self):
  with self.assertRaises(ValueError):
   check.validate([self.rows[0],self.rows[0]],self.links)
  row=copy.deepcopy(self.rows[0])
  row["litigantNames"]="Иванов"
  with self.assertRaises(ValueError):
   check.validate([row],self.links)

 def test_public_ui_labels_snapshot_and_links_to_source(self):
  component=(APP/"_components/moscow-case-index-explorer.tsx").read_text(encoding="utf-8")
  district=(APP/"_components/moscow-court-published-evidence.tsx").read_text(encoding="utf-8")
  page=(APP/"courts/moscow/cases/page.tsx").read_text(encoding="utf-8")
  helper=(APP/"lib/moscow-appeal-hearing-snapshots.ts").read_text(encoding="utf-8")
  self.assertIn("moscowAppealHearingSnapshot(item.courtSlug,item.number)",page)
  self.assertIn("moscowJudgeCaseCrosscheck(courtSlug,caseNumber)",helper)
  self.assertIn("cross.appealDocket!==match.appealDocket",helper)
  self.assertIn("appealSchedule.statusAsPublished",component)
  self.assertIn("не текущий статус в реальном времени",component.lower())
  self.assertIn("не подтверждает проведение заседания",district)
  self.assertIn("hearing.sourceUrl",district)

if __name__=="__main__":
 unittest.main()
