import json
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from inbox import execute, manifests

FIXTURE = Path(__file__).parent / "fixtures" / "synthetic_contacts.json"
DATASET = "https://data.mos-gorsud.ru/opendata/TEST-ONLY-DATASET-00001"


def manifest(file="inbox/test.json", **changes):
    value = {
        "format": "moscow-contacts-v1",
        "file": file,
        "dataset_url": DATASET,
        "captured_on": str(date.today()),
        "reviewer": "CI Test Operator",
        "reuse_rights_confirmed": True,
    }
    return {**value, **changes}


class InboxTests(unittest.TestCase):
    def test_scan_only_never_publishes(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            folder = root / "inbox"
            folder.mkdir()
            (folder / "test.json").write_bytes(FIXTURE.read_bytes())
            (folder / "test.manifest.json").write_text(
                json.dumps(manifest(), ensure_ascii=False), encoding="utf-8"
            )
            result = execute(folder, apply=False, root=root)
            self.assertTrue(result["dry_run"])
            self.assertEqual(result["handled"], 1)
            self.assertEqual(result["failed"], 0)
            self.assertEqual(result["auto_published"], 0)
            self.assertEqual(result["entries"][0]["records"], 1)

    def test_schema_and_permissions(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            folder = root / "inbox"
            folder.mkdir()
            (folder / "test.json").write_bytes(FIXTURE.read_bytes())
            for changes in (
                {"reuse_rights_confirmed": False},
                {"dataset_url": "https://evil.invalid/opendata/example"},
                {"file": "../test.json"},
                {"file": "inbox/test.json/../notfound.json"},
                {"format": "unexpected"},
                {"reviewer": ""},
            ):
                with self.subTest(changes=changes):
                    (folder / "test.manifest.json").write_text(
                        json.dumps(manifest(**changes)), encoding="utf-8"
                    )
                    with self.assertRaises(ImportValidationError):
                        manifests(folder, root)

    def test_wrong_directory_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            folder = root / "different"
            folder.mkdir()
            with self.assertRaises(ImportValidationError):
                manifests(folder, root)

    def test_fails_closed_for_missing_or_invalid_payload(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            folder = root / "inbox"
            folder.mkdir()
            (folder / "test.manifest.json").write_text(
                json.dumps(manifest()), encoding="utf-8"
            )
            with self.assertRaises(ImportValidationError):
                manifests(folder, root)
            (folder / "test.json").write_text("not-json", encoding="utf-8")
            result = execute(folder, apply=False, root=root)
            self.assertEqual(result["handled"], 0)
            self.assertEqual(result["failed"], 1)


if __name__ == "__main__":
    unittest.main()
