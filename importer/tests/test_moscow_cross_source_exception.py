"""Never join official decisions to a secondary catalog on case number alone."""
import json,unittest
from pathlib import Path
from urllib.parse import urlsplit
APP=Path(__file__).resolve().parents[2]/"apps/web/app/data"
def load(p):return json.loads((APP/p).read_text(encoding="utf-8"))["records"]
CASES=load("moscow-judge-case-evidence.json")
EXCEPTIONS=load("moscow-judge-cross-source-exceptions.json")
class CrossSourceExceptionTests(unittest.TestCase):
 def test_same_number_different_court_and_uid_is_not_the_same_case(self):
  self.assertEqual(len(EXCEPTIONS),1)
  r=EXCEPTIONS[0]
  official=next(x for x in CASES if x["courtSlug"]==r["primary"]["courtSlug"] and x["number"]==r["caseNumber"])
  self.assertEqual(official["uin"],r["primary"]["uin"])
  self.assertEqual(official["judgeName"],r["primary"]["judgeName"])
  self.assertNotEqual(r["primary"]["courtSlug"],r["secondary"]["courtSlug"])
  self.assertNotEqual(r["primary"]["uin"],r["secondary"]["uin"])
  self.assertNotEqual(r["primary"]["judgeName"],r["secondary"]["judgeName"])
  self.assertEqual(r["status"],"rejected_unrelated_case")
  self.assertEqual(urlsplit(r["secondary"]["sourceUrl"]).hostname,"sudact.ru")
  self.assertIn("/rs/meshchanskij/",r["primary"]["sourceUrl"])
  self.assertIn("нельзя",r["reason"].lower())
if __name__=="__main__":unittest.main()
