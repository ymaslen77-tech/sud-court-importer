"""Two independently registered official court-record pages corroborate identity only."""
import copy,importlib.util,json,unittest
from pathlib import Path

SCRIPT=Path(__file__).resolve().parents[1]/"verify_moscow_judge_corroboration.py"
spec=importlib.util.spec_from_file_location("cross_reg",SCRIPT)
cross=importlib.util.module_from_spec(spec);spec.loader.exec_module(cross)

class CrossRegisterCorroborationTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows=cross.read(cross.CROSS)
  cls.cases={(r["courtSlug"],r["number"]):r for r in cross.read(cross.CASES)}
  cls.judges={(r["slug"],cross.normalized(n)) for p in cross.ROSTERS for r in cross.read(p) for n in r["judges"]}
 def test_two_verified_official_case_joins_on_uin_and_judge(self):
  self.assertEqual(cross.validate(),2)
  r=self.rows[0]
  self.assertEqual(r["uin"],"77RS0018-02-2025-003155-71")
  self.assertEqual(r["appealDocket"],"Ж-65034/2026")
  self.assertEqual(r["sourceGroup"],"mos_gorsud_first_instance_and_appeal")
  self.assertIsNone(r["appealResult"])
  self.assertFalse(r["fullTextVerified"])
  second=self.rows[1]
  self.assertEqual(second["uin"],"77RS0016-02-2025-024162-12")
  self.assertEqual(second["appealDocket"],"Ж-64264/2026")
  self.assertEqual(second["courtOutcome"],"Удовлетворено частично")
  self.assertIsNone(second["appealResult"])
 def check(self,row):return cross.verify(row,self.cases,self.judges)
 def test_conflicting_case_identifiers_are_blocked(self):
  for field,value in [("uin","WRONG"),("categoryCode","999"),("judgeLabel","Сидорова А.А.")]:
   row=copy.deepcopy(self.rows[0]);row["witnesses"][1][field]=value
   with self.subTest(field=field),self.assertRaises(ValueError):self.check(row)
 def test_result_and_appeal_cannot_be_invented(self):
  for field,value in [("courtOutcome","Удовлетворено"),("appealResult","Отменено"),
                      ("fullTextVerified",True),("appealRegisteredOn","2026-10-01")]:
   row=copy.deepcopy(self.rows[0]);row[field]=value
   with self.subTest(field=field),self.assertRaises(ValueError):self.check(row)
 def test_conflicting_case_list_uin_is_rejected(self):
  r=copy.deepcopy(self.rows[0])
  self.cases[(r["courtSlug"],r["caseNumber"])]["uin"]="77RS0000-02-2026-000001-10"
  try:
   with self.assertRaises(ValueError):self.check(r)
  finally:
   self.cases[(r["courtSlug"],r["caseNumber"])]["uin"]=r["uin"]
 def test_two_mirrors_do_not_count_as_distinct_registers(self):
  row=copy.deepcopy(self.rows[0])
  row["witnesses"][1]["kind"]="first_instance"
  with self.assertRaises(ValueError):self.check(row)
  row=copy.deepcopy(self.rows[0])
  row["sourceGroup"]="two_independent_publishers"
  with self.assertRaises(ValueError):self.check(row)
 def test_source_domain_and_lower_court_checked(self):
  for field,value in [("sourceUrl","https://sudact.ru/example"),("caseNumber","02-0001/2026")]:
   row=copy.deepcopy(self.rows[0]);row["witnesses"][1][field]=value
   with self.subTest(field=field),self.assertRaises(ValueError):self.check(row)
if __name__=="__main__":unittest.main()
