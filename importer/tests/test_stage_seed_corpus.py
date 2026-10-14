import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from stage_seed_corpus import FILES, ROOT, preflight


class FullSeedStagingTests(unittest.TestCase):
    def test_corpus_preflight_never_changes_database(self):
        bundles, report = preflight()
        self.assertEqual(report["records_total"], 273)
        self.assertEqual(report["complete_contact_candidates"], 76)
        self.assertEqual(report["discovery_candidates"], 197)
        self.assertEqual(report["file_batches"], 7)
        self.assertEqual(report["published"], 0)
        self.assertEqual(report["verified"], 0)
        self.assertEqual(report["permissions_attested"], 0)
        self.assertEqual(sum(len(rows) for _, _, _, rows in bundles), 273)
        self.assertEqual(report["cross_region_flags"], [{
            "file": "omsk-federal-official-ambiguous-unreviewed.json",
            "code": "54GV0008",
            "region": "55",
            "reason": "Classification prefix mismatches listing region; editor must resolve",
        }])

    def test_missing_file_rejects_before_database_stage(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            for filename, _, _, _ in FILES[:-1]:
                (directory / filename).write_bytes((ROOT / filename).read_bytes())
            with self.assertRaisesRegex(Exception, "Missing or unsafe"):
                preflight(directory)

    def test_invalid_seed_rejects_before_any_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            for filename, _, _, _ in FILES:
                (directory / filename).write_bytes((ROOT / filename).read_bytes())
            victim = directory / FILES[0][0]
            victim.write_text("[]", encoding="utf-8")
            with self.assertRaisesRegex(Exception, "nonempty JSON array"):
                preflight(directory)


if __name__ == "__main__":
    unittest.main()
