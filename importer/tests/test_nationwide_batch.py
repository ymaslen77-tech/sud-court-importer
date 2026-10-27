"""Regression tests for offline nationwide region staging safeguards."""
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from nationwide_batch import SOURCE, init_manifest, known_regions, manifest_rows, preflight

FIXTURE = Path(__file__).parent / "fixtures/official_sudrf_novosibirsk_excerpt.txt"


class NationwideBatchTests(unittest.TestCase):
    def test_region_classifier_has_89_entries(self):
        regions = known_regions()
        self.assertEqual(len(regions), 89)
        self.assertEqual(regions["54"], "Новосибирская область")

    def test_generate_manifest_without_snapshots(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "regions.json"
            info = init_manifest(path, known_regions(), [])
            self.assertEqual(info["regions"], 89)
            self.assertEqual(info["snapshots_written"], 0)
            self.assertEqual(len(manifest_rows(path, known_regions())), 89)
            with self.assertRaises(ImportValidationError):
                init_manifest(path, known_regions(), [])

    def test_preflight_offline_novosibirsk_excerpt(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            init_manifest(root / "regions.json", known_regions(), ["54"])
            (root / "54.txt").write_bytes(FIXTURE.read_bytes())
            prepared, report = preflight(root / "regions.json")
            self.assertEqual(len(prepared), 1)
            self.assertEqual(report["candidates_preflighted"], 4)
            self.assertEqual(report["regions_preflighted"], 1)
            self.assertFalse(report["publication_allowed"])

    def test_missing_second_snapshot_blocks_whole_preflight(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            init_manifest(root / "regions.json", known_regions(), ["54", "55"])
            (root / "54.txt").write_bytes(FIXTURE.read_bytes())
            with self.assertRaises(ImportValidationError):
                preflight(root / "regions.json")

    def test_wrong_official_source_and_traversal_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / "regions.json"
            init_manifest(path, known_regions(), ["54"])
            entries = json.loads(path.read_text())
            for key, replacement in (
                ("source_url", "https://sudrf.ru.evil.test/index.php"),
                ("snapshot", "../54.txt"),
                ("region_name", "Другой регион"),
            ):
                altered = [dict(entries[0], **{key: replacement})]
                path.write_text(json.dumps(altered), encoding="utf-8")
                with self.subTest(key=key), self.assertRaises(ImportValidationError):
                    manifest_rows(path, known_regions())

    def test_duplicate_region_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "regions.json"
            init_manifest(path, known_regions(), ["54"])
            rows = json.loads(path.read_text())
            path.write_text(json.dumps(rows + rows), encoding="utf-8")
            with self.assertRaises(ImportValidationError):
                manifest_rows(path, known_regions())

    def test_unexpected_listing_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            init_manifest(root / "regions.json", known_regions(), ["55"])
            (root / "55.txt").write_bytes(FIXTURE.read_bytes())
            with self.assertRaises(ImportValidationError):
                preflight(root / "regions.json")


if __name__ == "__main__":
    unittest.main()
