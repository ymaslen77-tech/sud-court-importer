"""Integrity and batch-level preflight regression tests for permissioned inbox."""
import json
import sys
import tempfile
import unittest
from datetime import date
from hashlib import sha256
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from inbox import execute, manifests

FIXTURE = Path(__file__).parent / "fixtures" / "synthetic_contacts.json"
DATASET = "https://data.mos-gorsud.ru/opendata/TEST-ONLY-DATASET-00001"


def manifest(name="test", version=2, checksum=None, source=DATASET):
    data = {
        "format": f"moscow-contacts-v{version}",
        "file": f"inbox/{name}.json",
        "dataset_url": source,
        "captured_on": str(date.today()),
        "reviewer": "CI Test Operator",
        "reuse_rights_confirmed": True,
    }
    if version == 2:
        data["snapshot_sha256"] = checksum
    return data


class IntegrityTests(unittest.TestCase):
    def test_pinned_bytes_and_tamper_rejection(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            folder = root / "inbox"
            folder.mkdir()
            raw = FIXTURE.read_bytes()
            (folder / "test.json").write_bytes(raw)
            metadata = manifest(checksum=sha256(raw).hexdigest())
            (folder / "test.manifest.json").write_text(json.dumps(metadata), encoding="utf-8")
            valid = execute(folder, apply=False, root=root)
            self.assertEqual(valid["handled"], 1)
            self.assertEqual(valid["entries"][0]["source_sha256"], metadata["snapshot_sha256"])
            (folder / "test.json").write_bytes(raw + b" ")
            tampered = execute(folder, apply=False, root=root)
            self.assertEqual(tampered["handled"], 0)
            self.assertEqual(tampered["failed"], 1)
            self.assertIn("SHA-256", tampered["errors"][0]["error"])

    def test_invalid_second_file_blocks_stage_before_database(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            folder = root / "inbox"
            folder.mkdir()
            raw = FIXTURE.read_bytes()
            (folder / "a.json").write_bytes(raw)
            (folder / "a.manifest.json").write_text(
                json.dumps(manifest("a", checksum=sha256(raw).hexdigest())), encoding="utf-8")
            (folder / "b.json").write_text("not-json", encoding="utf-8")
            (folder / "b.manifest.json").write_text(
                json.dumps(manifest("b", checksum=sha256(b"not-json").hexdigest(),
                                    source="https://data.mos-gorsud.ru/opendata/ANOTHER-DATASET-00001")),
                encoding="utf-8")
            with patch("inbox.synchronize") as sync, patch("cli.database_connect") as connect:
                connect.return_value.__enter__.return_value.execute.return_value.fetchone.return_value = (123,)
                result = execute(folder, apply=True, root=root)
                sync.assert_not_called()
            self.assertTrue(result["blocked_preflight"])
            self.assertEqual(result["handled"], 0)
            self.assertEqual(result["failed"], 2)
            self.assertEqual(result["auto_published"], 0)

    def test_duplicate_manifest_path_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            folder = root / "inbox"
            folder.mkdir()
            (folder / "test.json").write_bytes(FIXTURE.read_bytes())
            for name in ("a", "b"):
                (folder / f"{name}.manifest.json").write_text(
                    json.dumps(manifest(version=1)), encoding="utf-8")
            with self.assertRaisesRegex(ImportValidationError, "Multiple manifests"):
                manifests(folder, root)

    def test_version_2_requires_valid_lowercase_checksum(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            folder = root / "inbox"
            folder.mkdir()
            (folder / "test.json").write_bytes(FIXTURE.read_bytes())
            for checksum in (None, "a" * 63, "Z" * 64):
                (folder / "test.manifest.json").write_text(
                    json.dumps(manifest(checksum=checksum)), encoding="utf-8")
                with self.subTest(checksum=checksum):
                    with self.assertRaises(ImportValidationError):
                        manifests(folder, root)


if __name__ == "__main__":
    unittest.main()
