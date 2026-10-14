import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from seed_audit import FILES, ROOT, audit


class SeedAuditTests(unittest.TestCase):
    def test_inventory_is_read_only_and_never_claims_publication(self):
        result = audit()
        self.assertEqual(result["source_records"], 232)
        self.assertEqual(result["published_by_this_command"], 0)
        self.assertEqual(result["actual_verified_courts"], "NOT_ASSESSED")
        self.assertEqual(len(result["files"]), 5)
        self.assertEqual(sum(item["source_records"] for item in result["files"]), 232)

    def test_missing_seed_blocks_complete_inventory(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            for filename in FILES[1:]:
                (root / filename).write_bytes((ROOT / filename).read_bytes())
            with self.assertRaisesRegex(ValueError, "Missing or unsafe seed"):
                audit(root)


if __name__ == "__main__":
    unittest.main()
