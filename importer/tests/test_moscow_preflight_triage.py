"""Offline checks: bounded triage must not leak any real value."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "importer"))
import moscow_preflight_triage as triage
from moscow_bulk_judge_pipeline import court_directory


class MoscowPreflightTriageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mapping = court_directory()

    def source(self, rows):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        target = Path(temporary.name) / "cases.json"
        target.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
        return target

    def test_first_court_judge_roster_and_unrelated_lower_field(self):
        rows = [
            {"courtName": "Никулинский районный суд города Москвы",
             "number": "02-0514/2026",
             "uid": "77RS0018-02-2025-003155-71",
             "url": "https://m.mos-gorsud.ru/rs/nikulinskij/services/cases/civil/details/fixture",
             "category": "Возмещение имущественного вреда",
             "judge": "Кузнецова Е.А.", "judgeTeam": None,
             "lower": [{"number": "UNRELATED-SECRET-NUMBER"}],
             "participants": [{"name": "SECRET-PARTICIPANT"}]},
            {"courtName": "Никулинский районный суд города Москвы",
             "number": "02-0514/2026",
             "uid": "77RS0018-02-2025-003155-71",
             "url": "https://m.mos-gorsud.ru/rs/nikulinskij/services/cases/civil/details/fixture",
             "category": "Возмещение имущественного вреда",
             "judge": "SECRET-UNKNOWN-JUDGE", "judgeTeam": ["SECRET-JUDGE"],
             "participants": [{"name": "SECRET-PARTICIPANT"}]},
        ]
        result = triage.audit_one(self.source(rows), "first", 2, self.mapping)
        self.assertEqual(result["sampledRows"], 2)
        self.assertEqual(result["existingImporterResults"]["candidate_accepted"], 1)
        self.assertEqual(result["existingImporterResults"]["unknown_or_ambiguous_judge"], 1)
        self.assertEqual(result["judgeFieldRosterEvidence"]["roster_unique_official_initials"], 1)
        self.assertEqual(result["judgeFieldRosterEvidence"]["not_unique_in_official_roster"], 1)
        self.assertEqual(result["judgeTeamTypes"], {"null": 1, "array": 1})
        self.assertEqual(result["lowerReferenceInterpretation"], "not_applied_to_first_instance")
        for secret in ("SECRET", "UNRELATED", "Кузнецова"):
            self.assertNotIn(secret, json.dumps(result, ensure_ascii=False))

    def test_appeal_lower_validity_and_mgs_exclusion_not_an_error(self):
        rows = [
            {"uid": "77RS0018-02-2025-003155-71",
             "url": "https://m.mos-gorsud.ru/mgs/services/cases/appeal-civil/details/fixture",
             "dateReg": "30.09.2026",
             "lower": [{"number": "02-0514/2026", "judge": "SECRET-JUDGE"},
                       {"number": "SECRET-BAD-NUMBER", "judge": "SECRET-JUDGE"}],
             "participants": [{"name": "SECRET-PARTICIPANT"}]},
            {"uid": "INVALID-UID",
             "url": "https://m.mos-gorsud.ru/mgs/services/cases/appeal-civil/details/fixture",
             "dateReg": "30.09.2026", "lower": []}
        ]
        result = triage.audit_one(self.source(rows), "appeal", 2, self.mapping)
        self.assertEqual(result["sampledRows"], 2)
        self.assertEqual(result["existingImporterResults"]["candidate_accepted"], 1)
        self.assertEqual(result["existingImporterResults"]["missing_or_invalid_uin"], 1)
        self.assertEqual(result["lowerReferenceByRow"]["has_valid_number"], 1)
        self.assertEqual(result["lowerReferenceByRow"]["empty"], 1)
        self.assertEqual(result["lowerReferenceEntries"]["valid_number"], 1)
        self.assertEqual(result["lowerReferenceEntries"]["other_or_invalid_number"], 1)
        self.assertEqual(result["judgeRosterInterpretation"], "not_applicable_mgs_appeal")
        for secret in ("SECRET", "Кузнецова"):
            self.assertNotIn(secret, json.dumps(result, ensure_ascii=False))

    def test_reject_empty_invalid_or_oversized_sample(self):
        with self.assertRaises(ValueError):
            triage.audit_one(Path("/no/such/file.json"), "first", 1, self.mapping)
        with self.assertRaises(ValueError):
            triage.audit_one(self.source([]), "first", 1, self.mapping)
        with self.assertRaises(ValueError):
            triage.audit_one(self.source([{}]), "first", 5001, self.mapping)


if __name__ == "__main__":
    unittest.main()
