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

    def test_validity_aggregate_does_not_emit_values(self):
        from moscow_bulk_judge_pipeline import FIELDS
        cases=[
            {"uid":"77RS0018-02-2025-003155-71","number":"02-0514/2026",
             "url":"https://m.mos-gorsud.ru/rs/nikulinskij/services/cases/civil/details/test",
             "dateReg":"30.09.2026","judgeTeam":["VERY-SECRET-NAME"],
             "participants":[{"name":"TOP-SECRET"}]},
            {"uid":"NOT_A_VALID_UID","number":"unknown","url":"https://evil.example/",
             "dateFinal":"2026-05-28","lower":[{"judge":"TOP-SECRET"}],
             "participants":[{"name":"TOP-SECRET"}]}]
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "cases.json"
            path.write_text(json.dumps(cases),encoding="utf-8")
            result = audit.audit(path, "first", 2)
        self.assertEqual(result["existingAliasMatches"]["uin"], 2)
        self.assertEqual(result["fieldFormatCounts"]["uin"]["matches_current_pattern"], 1)
        self.assertEqual(result["fieldFormatCounts"]["uin"]["other_format"], 1)
        self.assertEqual(result["fieldFormatCounts"]["number"]["matches_current_pattern"], 1)
        self.assertEqual(result["fieldFormatCounts"]["judgeTeam"]["array"], 1)
        self.assertNotIn("TOP-SECRET", json.dumps(result))
        self.assertNotIn("VERY-SECRET-NAME", json.dumps(result))
        self.assertFalse(result["published"])

    def test_official_roster_and_lower_reference_aggregates_without_names(self):
        from moscow_bulk_judge_pipeline import court_directory
        rows = [
            {"courtName": "Никулинский районный суд города Москвы",
             "judgeTeam": "Кузнецова Е.А.",
             "lower": [{"number": "02-0514/2026", "judge": "SECRET-LOWER-JUDGE"},
                       {"number": "invalid!", "judge": "SECRET-LOWER-JUDGE"}],
             "participants": [{"fullName": "SECRET-PARTICIPANT"}]},
            {"courtName": "Никулинский районный суд города Москвы",
             "judgeTeam": "SECRET-UNKNOWN-JUDGE", "lower": []}
        ]
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "cases.json"
            path.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
            result = audit.audit(path, "first", 2, court_directory())
        self.assertEqual(result["judgeTeamRosterMatch"]["unique_official_initials"], 1)
        self.assertEqual(result["judgeTeamRosterMatch"]["unknown_or_ambiguous"], 1)
        self.assertEqual(result["lowerReferenceFormat"]["number_matches_current_pattern"], 1)
        self.assertEqual(result["lowerReferenceFormat"]["number_other_format"], 1)
        self.assertEqual(result["lowerReferenceFormat"]["empty_array"], 1)
        string_result = json.dumps(result, ensure_ascii=False)
        for secret in ("SECRET-LOWER-JUDGE", "SECRET-UNKNOWN-JUDGE", "SECRET-PARTICIPANT"):
            self.assertNotIn(secret, string_result)

if __name__ == "__main__":
    unittest.main()
