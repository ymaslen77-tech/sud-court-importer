"""Source-file gate for law and reasoning on personalized judicial history."""
import copy
import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
SCRIPT=Path(__file__).resolve().parents[1]/"promote_moscow_judge_reasoning.py"
spec=importlib.util.spec_from_file_location("moscow_judge_reasoning",SCRIPT)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class JudgeReasoningPromotionTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.cases={(r["courtSlug"],r["number"]):r for r in module.read(module.CASE_RECORDS)["records"]}
  cls.blocked={(r["courtSlug"],r["number"]) for r in module.read(module.REVIEW_QUEUE)["records"]
               if r["publicationStatus"] in ("publication_forbidden","preparing_publication")}
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory()
  self.addCleanup(self.temp.cleanup)
  path=Path(self.temp.name)/"source.pdf"
  path.write_bytes(b"%PDF-1.7\n"+b"Test-only synthetic decision byte content.\n"*40)
  sha=hashlib.sha256(path.read_bytes()).hexdigest()
  self.row={
   "courtSlug":"butyrskiy","judgeName":"Завьялова Светлана Ивановна","caseNumber":"02-4623/2026",
   "courtCaseUrl":"https://mos-gorsud.ru/rs/butyrskij/services/cases/civil/details/test-fixture",
   "decisionDate":"2026-07-09","officialFileSha256":sha,"reviewedOn":"2026-11-01",
   "attributionConfirmed":True,"fullTextVerified":True,"publicationPermissionChecked":True,
   "personalDataReviewed":True,"legalNorms":[{"law":"ГПК РФ","article":"ст. 56","reasoning":"Test only: rationale checked against source in a real editorial review."}],
   "judicialReasoningSummary":"Synthetic test fixture for source review; not for use as an actual court decision.",
   "appealStatus":"not_checked","localEvidenceFile":str(path),"editorialVerified":True
  }
 def verify(self,row):
  return module.validate(row,self.cases,self.blocked,set())
 def test_guard_checks_file_sha_and_valid_source(self):
  cleaned=self.verify(self.row)
  self.assertEqual(cleaned["courtSlug"],"butyrskiy")
  self.assertNotIn("localEvidenceFile",cleaned)
  self.assertNotIn("editorialVerified",cleaned)
 def test_reject_unverified_text_and_wrong_author(self):
  for key,value in [("fullTextVerified",False),("publicationPermissionChecked",False),
                    ("personalDataReviewed",False),("editorialVerified",False),
                    ("judgeName","Другая Судья"),("officialFileSha256","0"*64)]:
   row=copy.deepcopy(self.row);row[key]=value
   with self.subTest(key=key),self.assertRaises(ValueError):self.verify(row)
 def test_no_fake_legal_positions_and_empty_review(self):
  for key,value in [("legalNorms",[]),("judicialReasoningSummary",""),
                    ("appealStatus","appeal_source_verified")]:
   row=copy.deepcopy(self.row);row[key]=value
   with self.subTest(key=key),self.assertRaises(ValueError):self.verify(row)
 def test_pending_and_nonofficial_url_not_promoted(self):
  row=copy.deepcopy(self.row);row["caseNumber"]="02-7229/2026";row["courtSlug"]="golovinskiy"
  row["judgeName"]="Толоконенко Сергей Сергеевич";row["courtCaseUrl"]="https://mos-gorsud.ru/rs/golovinskij/services/cases/civil/details/example"
  with self.assertRaises(ValueError):self.verify(row)
  row=copy.deepcopy(self.row);row["courtCaseUrl"]="https://sudact.ru/regular/doc/fake"
  with self.assertRaises(ValueError):self.verify(row)
 def test_queued_forbidden_and_unpublished_not_promoted(self):
  self.assertIn(("nikulinskiy","02-8403/2026"),self.blocked)
  self.assertIn(("gagarinskiy","02-4840/2026"),self.blocked)
  review=module.read(module.OUTPUT)
  self.assertEqual(review["records"],[])
if __name__=="__main__":unittest.main()
