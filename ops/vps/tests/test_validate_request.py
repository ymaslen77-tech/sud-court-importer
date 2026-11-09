"""VPS request cannot select arbitrary shell commands or publication."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/"ops/vps"))
from validate_request import validate

class RequestGuardTests(unittest.TestCase):
 def run_request(self,data):
  with tempfile.TemporaryDirectory() as td:
   path=Path(td)/"request.json"
   path.write_text(json.dumps(data),encoding="utf-8")
   return validate(path)
 def test_exact_private_operation(self):
  value=self.run_request({"schemaVersion":1,"operation":"moscow-private-preflight",
                          "requestId":"stage-moscow-20261109"})
  self.assertFalse(value["deploy"])
  self.assertFalse(value["publish"])
 def test_rejects_any_command_or_unapproved_flags(self):
  base={"schemaVersion":1,"operation":"moscow-private-preflight",
        "requestId":"stage-moscow-20261109"}
  for extra in ({"command":"rm -rf /"},{"apply":True},{"push":True},
                {"path":"/etc/shadow"},{"deploy":True}):
   with self.subTest(extra=extra),self.assertRaises(ValueError):
    self.run_request(dict(base,**extra))
  for operation in ("moscow-private-preflight;id","publish","deploy","shell"):
   with self.subTest(operation=operation),self.assertRaises(ValueError):
    self.run_request(dict(base,operation=operation))
 def test_malformed_and_invalid_identifiers(self):
  base={"schemaVersion":1,"operation":"moscow-private-preflight","requestId":"x"}
  with self.assertRaises(ValueError):self.run_request(base)
  with self.assertRaises(ValueError):self.run_request(dict(base,requestId="a"*100))
  with self.assertRaises(ValueError):self.run_request(dict(base,schemaVersion=True))
if __name__=="__main__": unittest.main()
