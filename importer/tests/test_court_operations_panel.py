"""Court operational panel must distinguish documented information from unknown facts."""
import json
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[2]/"apps/web/app"
class OperationsTests(unittest.TestCase):
 def test_all_ten_get_status(self):
  pilot=json.loads((ROOT/"lib/pilot-review-matrix.json").read_text())["records"]
  contacts=json.loads((ROOT/"lib/pilot-department-contacts.json").read_text())
  facts=json.loads((ROOT/"lib/pilot-practical-source-facts.json").read_text())
  self.assertEqual({p["external_code"] for p in pilot},set(facts))
  hours=json.loads((ROOT/"lib/research-hours.json").read_text())
  dossiers=json.loads((ROOT/"lib/research-dossiers.json").read_text())
  for p in pilot:
   code=p["external_code"]
   self.assertTrue(code in facts or code in contacts or code in hours or code in dossiers)
 def test_no_published_current_payment_or_judge_claim(self):
  x=(ROOT/"_components/court-operational-details.tsx").read_text()
  for phrase in ["не подтверждены","Проверенная схема","не завершено","официальная публикация","Депозитный счёт","удостовер"]:
   self.assertIn(phrase,x)
  self.assertNotIn("verified:true",x)
 def test_parent_includes_panel_and_in_page_anchor(self):
  p=(ROOT/"_components/pilot-court-public.tsx").read_text()
  c=(ROOT/"_components/court-operational-details.tsx").read_text()
  self.assertIn("<CourtOperationalDetails code={court.code}/>",p)
  self.assertIn('href="#pilot-operations"',p)
  self.assertIn('id="pilot-operations"',c)
  self.assertIn("dossier?.payments",c)
  self.assertIn("dossier?.staff_observations",c)
  self.assertIn("accessible.length>0",c)
  self.assertNotIn("fetch(",c)
if __name__=="__main__":unittest.main()
