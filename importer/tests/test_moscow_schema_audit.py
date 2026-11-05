"""Offline tests: never output original case values or participant details."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "importer"))
import moscow_schema_audit as audit

class MoscowSchemaAuditTests(unittest.TestCase):
    def test_names_and_types_only(self):
        row = {"courtName": "SECRET-COURT", "number": "SECRET-CASE",
               "uid": "SECRET-UID", "judgeTeam": [
                   {"name": "SECRET-JUDGE", "role": "Judge"}],
               "lower": [{"number": "SECRET-LOWER"}],
               "participants": [{"fullName": "SECRET-PARTICIPANT"}]}
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "first.json"
            path.write_text(json.dumps([row]), encoding="utf-8")
            result = audit.audit(path, "first", 1)
        data = json.dumps(result)
        self.assertEqual(result["sampledRecords"], 1)
        self.assertEqual(result["topLevel"]["judgeTeam"], {"array": 1})
        self.assertIn("name", result["nestedFieldNamesOnly"]["judgeTeam"])
        self.assertNotIn("participants", result["nestedFieldNamesOnly"])
        for private in ("SECRET-JUDGE", "SECRET-COURT", "SECRET-CASE",
                        "SECRET-UID", "SECRET-LOWER", "SECRET-PARTICIPANT"):
            self.assertNotIn(private, data)
        self.assertFalse(result["published"])
    def test_fail_closed_on_missing_source_and_bad_limit(self):
        with self.assertRaises(ValueError):
            audit.audit(Path("/nonexistent.json"), "first", 1)
        with self.assertRaises(ValueError):
            audit.audit(Path("/nonexistent.json"), "first", 3001)

if __name__ == "__main__":
    unittest.main()
