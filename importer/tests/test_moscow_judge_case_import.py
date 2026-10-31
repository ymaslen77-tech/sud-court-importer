"""Editor-reviewed import gate: reject invented judicial decisions or wrong-court attribution."""
import importlib.util
import unittest
from pathlib import Path

SCRIPT=Path(__file__).resolve().parents[1]/"ingest_moscow_judge_case_evidence.py"
spec=importlib.util.spec_from_file_location("moscow_judge_ingest",SCRIPT)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class MoscowJudgeCaseImportTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.judges=module.judge_sources()
  cls.records=module.read_records(module.EVIDENCE)
 def test_current_verified_records_pass(self):
  keys=module.validate_all(self.records,self.judges)
  self.assertEqual(len(keys),21)
  self.assertGreaterEqual(len(self.judges),335)
 def test_unknown_judge_or_wrong_court_rejected(self):
  row=self.records[0].copy()
  row["judgeName"]="Несуществующий Фиктивный Судья"
  with self.assertRaises(ValueError):
   module.validate_record(row,self.judges)
  row=self.records[0].copy()
  row["courtSlug"]="golovinskiy"
  with self.assertRaises(ValueError):
   module.validate_record(row,self.judges)
 def test_pending_case_never_automatically_receives_outcome(self):
  row=next(x for x in self.records if x["status"]=="pending").copy()
  row["outcome"]="Удовлетворено"
  with self.assertRaises(ValueError):
   module.validate_record(row,self.judges)
 def test_text_without_individual_legal_review_rejected(self):
  row=self.records[0].copy()
  row["judicialActTextVerified"]=True
  with self.assertRaises(ValueError):
   module.validate_record(row,self.judges)
 def test_unverified_staged_data_cannot_be_accepted(self):
  row=self.records[0].copy()
  with self.assertRaises(ValueError):
   module.validate_record(row,self.judges,require_review=True)
  row["editorialVerified"]=True
  module.validate_record(row,self.judges,require_review=True)
 def test_nonofficial_and_mismatched_url_rejected(self):
  row=self.records[0].copy()
  row["sourceUrl"]="https://sudact.ru/regular/case-0000/"
  with self.assertRaises(ValueError):
   module.validate_record(row,self.judges)
  row["sourceUrl"]=row["sourceUrl"].replace("/rs/butyrskij/","/rs/golovinskij/")
  with self.assertRaises(ValueError):
   module.validate_record(row,self.judges)
 def test_no_litigant_details_are_accepted(self):
  row=self.records[0].copy()
  row["note"]="Истец: Иванов И.И."
  with self.assertRaises(ValueError):
   module.validate_record(row,self.judges)
if __name__=="__main__":unittest.main()
