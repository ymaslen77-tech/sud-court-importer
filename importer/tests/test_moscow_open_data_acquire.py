"""Offline safeguards for catalog acquisition: no requests to the official portal."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
import moscow_open_data_registry as c
import moscow_open_data_acquire as a

class RegistryTests(unittest.TestCase):
 def test_exact_40_and_explicit_roles(self):
  self.assertEqual(len(c.CATALOG),40)
  self.assertEqual(dict(__import__("collections").Counter(d.role for d in c.CATALOG)),
   {"excluded":7,"first":8,"context":9,"appeal":11,"index":5})
 def test_full_plan_no_network(self):
  with io.StringIO() as output, contextlib.redirect_stdout(output):
   a.main(["plan","--scope","eligible"])
   plan=json.loads(output.getvalue())
  self.assertEqual(plan["total"],40)
  self.assertEqual(plan["selected"],33)
  self.assertFalse(plan["published"])
  self.assertFalse(plan["network"])
 def test_disallowed_role_and_url_guard(self):
  private=next(d for d in c.CATALOG if d.role=="excluded")
  with self.assertRaises(ValueError):a.selected("eligible",[private.identifier])
  for d in c.CATALOG:
   self.assertTrue(a.safe_endpoint(d).startswith("https://data.mos-gorsud.ru/"))
 def test_fetch_requires_explicit_ack(self):
  with contextlib.redirect_stderr(io.StringIO()):
   with self.assertRaises(SystemExit):a.main(["fetch"])
 def test_only_field_names_not_participant_values(self):
  with tempfile.TemporaryDirectory() as root:
   p=Path(root)/"fixture.json"
   p.write_text(json.dumps([{"Стороны":[{"ФИО":"SECRET-PERSON"}],
                 "УИД":"77RS0001-01-2026-000001-00"}],ensure_ascii=False),encoding="utf-8")
   report=json.dumps(a.inspection(p),ensure_ascii=False)
   self.assertIn("Стороны",report)
   self.assertNotIn("SECRET-PERSON",report)
 def test_non_json_rejected(self):
  with tempfile.TemporaryDirectory() as root:
   p=Path(root)/"bad.json"
   p.write_text("<html>error</html>",encoding="utf-8")
   with self.assertRaises(ValueError):a.check_json_header(p)
if __name__=="__main__":unittest.main()
