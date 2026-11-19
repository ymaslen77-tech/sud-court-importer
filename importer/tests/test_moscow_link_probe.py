"""Synthetic, offline verification of bounded matching and privacy."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "importer"))
import moscow_link_probe as probe
from moscow_bulk_judge_pipeline import court_directory


UID = "77RS0018-02-2025-003155-71"
FIRST = {
    "courtName": "Никулинский районный суд города Москвы",
    "number": "02-0514/2026",
    "uid": UID,
    "judge": "Кузнецова Е.А.",
    "category": "Возмещение имущественного вреда",
    "url": "https://m.mos-gorsud.ru/rs/nikulinskij/services/cases/civil/details/test",
    "participants": [{"name": "SECRET-PRIVATE-PARTICIPANT"}],
}
APPEAL = {
    "uid": UID,
    "number": "Ж-65034/2026",
    "url": "https://m.mos-gorsud.ru/mgs/services/cases/appeal-civil/details/test",
    "dateReg": "30.09.2026",
    "lower": [{"number": "02-0514/2026", "judge": "Кузнецова Е.А."}],
    "participants": [{"name": "SECRET-PRIVATE-PARTICIPANT"}],
}


class LinkProbeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mapping = court_directory()

    def temporary(self, name, rows):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        path = Path(temp.name) / (name + ".json")
        path.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
        return path

    def test_one_valid_join_and_one_judge_conflict(self):
        first = self.temporary("first", [FIRST])
        altered = dict(APPEAL, lower=[{"number": "02-0514/2026",
                                      "judge": "WRONG-PERSON"}])
        appeals = self.temporary("appeal", [APPEAL, altered])
        index, uids, first_counts = probe.first_sample(first, 100, self.mapping)
        actual = probe.appeal_sample(appeals, 100, index, uids)
        self.assertEqual(first_counts["accepted_row"], 1)
        self.assertEqual(actual["technical_correspondence"], 1)
        self.assertEqual(actual["lower_judge_not_concordant"], 1)
        self.assertEqual(actual["distinct_first_cases_with_candidate_appeal"], 1)
        for secret in ("SECRET-PRIVATE-PARTICIPANT", "Кузнецова", UID):
            self.assertNotIn(secret, json.dumps([first_counts, actual], ensure_ascii=False))

    def test_unmatched_appeal_does_not_create_fake_join(self):
        first = self.temporary("first", [FIRST])
        altered = dict(APPEAL, lower=[{"number": "02-0515/2026",
                                      "judge": "Кузнецова Е.А."}])
        appeals = self.temporary("appeal", [altered])
        index, uids, _ = probe.first_sample(first, 100, self.mapping)
        actual = probe.appeal_sample(appeals, 100, index, uids)
        self.assertEqual(actual["technical_correspondence"], 0)
        self.assertEqual(actual["uid_present_but_lower_number_not_matched"], 1)

    def test_bounds_and_missing_files(self):
        first = self.temporary("first", [FIRST])
        with self.assertRaises(ValueError):
            probe.first_sample(first, 100001, self.mapping)
        with self.assertRaises(ValueError):
            probe.appeal_sample(Path("/missing-appeal.json"), 1, {}, set())
        with self.assertRaises(ValueError):
            probe.first_sample(Path("/missing-first.json"), 1, self.mapping)


if __name__ == "__main__":
    unittest.main()
