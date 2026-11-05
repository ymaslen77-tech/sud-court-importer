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

 def test_zip_single_json_file_streamed_to_fixed_name(self):
  import io
  import zipfile
  from unittest.mock import patch
  class Response(io.BytesIO):
   def __init__(self,raw):
    super().__init__(raw)
    self.headers={"Content-Length":str(len(raw))}
   def geturl(self):return "https://data.mos-gorsud.ru/verified"
   def __enter__(self):return self
   def __exit__(self,*exc):self.close()
  def invoke(entries,uncompressed_max=1024*1024):
   data=io.BytesIO()
   with zipfile.ZipFile(data,"w",compression=zipfile.ZIP_DEFLATED) as z:
    for name,content in entries:z.writestr(name,content)
   raw=data.getvalue()
   opener=type("FakeOpener",(),{"open":lambda self,request,timeout:Response(raw)})()
   with tempfile.TemporaryDirectory() as root:
    folder=Path(root)
    with patch.object(a.shutil,"disk_usage",return_value=type("D",(),{"free":8*1024**3})()):
     out=a.fetch_one(c.BY_ID[a.CIVIL_FIRST],folder,uncompressed_max,opener)
    self.assertNotIn("SECRET-PERSON",json.dumps(out))
    self.assertEqual(list(folder.glob(".*partial")),[])
    return out,(folder/(a.CIVIL_FIRST+".json")).read_bytes()
  out,payload=invoke([("data.json",b'[{"case":"fake"}]')])
  self.assertEqual(out["status"],"downloaded_private")
  self.assertEqual(payload,b'[{"case":"fake"}]')
  self.assertFalse(out["published"])
  for entries in [
   [("../evil.json",b'[]')],
   [("a.json",b'[]'),("b.json",b'[]')],
   [("notes.txt",b'nope')],
  ]:
   with self.subTest(entries=entries), self.assertRaises(ValueError):
    invoke(entries)
  with self.assertRaises(ValueError):
   invoke([("data.json",b"[" + b"0"*100 + b"]")],uncompressed_max=90)
if __name__=="__main__":unittest.main()
