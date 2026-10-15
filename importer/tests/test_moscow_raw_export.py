import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from moscow_raw_export import inspect, read_raw, load_mapping, normalize

EXAMPLE = [{
 "code": "77RS9999", "title": "ТЕСТОВЫЙ СУД — НЕ СУЩЕСТВУЕТ",
 "place": "ВЫМЫШЛЕННЫЙ АДРЕС, Москва, 999",
 "site": "https://www.mos-gorsud.ru/rs/demo-nonexistent",
 "telephone": "+7 000 000 00 00", "office": "Пн 09:00–18:00"
}]
MAPPING = {"fields": {
 "courtCode":"code","courtName":"title","courtAddress":"place",
 "courtSiteUrl":"site","courtTelephone":"telephone","courtWorkHours":"office"
}}

class MoscowRawExportTests(unittest.TestCase):
 def write(self,folder,name,value):
  path=Path(folder)/name
  path.write_text(json.dumps(value,ensure_ascii=False),encoding="utf-8")
  return path
 def test_inspection_never_exposes_values(self):
  with tempfile.TemporaryDirectory() as directory:
   path=self.write(directory,"raw.json",{"data":EXAMPLE})
   raw,records=read_raw(path)
   report=inspect(raw,records)
   self.assertEqual(report["record_count"],1)
   self.assertEqual(report["raw_sha256"],hashlib.sha256(raw).hexdigest())
   self.assertNotIn("ТЕСТОВЫЙ",json.dumps(report,ensure_ascii=False))
   self.assertFalse(report["source_rights_verified"])
 def test_explicit_mapping_generates_canonical_offline_file(self):
  with tempfile.TemporaryDirectory() as directory:
   rawpath=self.write(directory,"raw.json",EXAMPLE)
   mappingpath=self.write(directory,"map.json",MAPPING)
   raw,records=read_raw(rawpath)
   mapped=load_mapping(mappingpath)
   output,report=normalize(raw,records,mapped,hashlib.sha256(raw).hexdigest(),True)
   result=json.loads(output)
   self.assertEqual(result[0]["courtCode"],"77RS9999")
   self.assertEqual(result[0]["courtWorkHours"],"Пн 09:00–18:00")
   self.assertEqual(report["auto_published"],0)
 def test_mismatched_digest_and_unreviewed_mapping_rejected(self):
  with tempfile.TemporaryDirectory() as directory:
   raw,records=read_raw(self.write(directory,"raw.json",EXAMPLE))
   mapping=load_mapping(self.write(directory,"map.json",MAPPING))
   for digest,attested in [("0"*64,True),(hashlib.sha256(raw).hexdigest(),False)]:
    with self.assertRaises(ImportValidationError):
     normalize(raw,records,mapping,digest,attested)
 def test_unknown_fields_and_missing_required_mapping_rejected(self):
  with tempfile.TemporaryDirectory() as directory:
   for fields in [{"courtCode":"code"},{"courtCode":"code",
      "courtName":"title","courtAddress":"place","courtSiteUrl":"site","unknown":"anything"}]:
    with self.assertRaises(ImportValidationError):
     load_mapping(self.write(directory,"map.json",{"fields":fields}))
 def test_missing_source_key_is_not_guessed(self):
  with tempfile.TemporaryDirectory() as directory:
   mapping=load_mapping(self.write(directory,"map.json",MAPPING))
   altered=[dict(EXAMPLE[0])]
   altered[0].pop("code")
   raw=json.dumps(altered,ensure_ascii=False).encode()
   with self.assertRaises(ImportValidationError):
    normalize(raw,altered,mapping,hashlib.sha256(raw).hexdigest(),True)
 def test_non_official_court_url_denied(self):
  with tempfile.TemporaryDirectory() as directory:
   mapping=load_mapping(self.write(directory,"map.json",MAPPING))
   bad=[dict(EXAMPLE[0])]
   bad[0]["site"]="https://mos-gorsud.ru.evil.example/rs/demo"
   raw=json.dumps(bad,ensure_ascii=False).encode()
   with self.assertRaises(ImportValidationError):
    normalize(raw,bad,mapping,hashlib.sha256(raw).hexdigest(),True)

if __name__=="__main__":
 unittest.main()
