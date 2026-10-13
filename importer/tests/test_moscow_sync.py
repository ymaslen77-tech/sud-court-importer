import json
import sys
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from moscow_sync import capture_date, canonical_records, dataset_url, read_file
from registry_diff import compare

FIXTURE = Path(__file__).parent / "fixtures" / "synthetic_contacts.json"
EXAMPLE_URL = "https://data.mos-gorsud.ru/opendata/TEST-ONLY-DATASET-00001"


class MoscowSyncTests(unittest.TestCase):
    def test_strict_dataset_source(self):
        self.assertEqual(dataset_url(EXAMPLE_URL), EXAMPLE_URL)
        for value in (
            "https://data.mos-gorsud.ru/opendata",
            "https://data.mos-gorsud.ru/",
            "https://data.mos-gorsud.ru.evil.invalid/opendata/testdataset",
            "https://data.mos-gorsud.ru@evil.invalid/opendata/testdataset",
            "http://data.mos-gorsud.ru/opendata/testdataset",
            "https://data.mos-gorsud.ru/opendata/a",
            "https://data.mos-gorsud.ru/opendata/a/b",
            "https://data.mos-gorsud.ru/opendata/testdataset#fragment",
        ):
            with self.subTest(url=value), self.assertRaises(ImportValidationError):
                dataset_url(value)

    def test_recent_capture_date(self):
        self.assertEqual(capture_date(str(date.today())), date.today())
        for value in (
            str(date.today() + timedelta(days=1)),
            str(date.today() - timedelta(days=31)),
            "no-date"
        ):
            with self.subTest(value=value), self.assertRaises(ImportValidationError):
                capture_date(value)

    def test_official_schema_and_idempotent_diff_fields(self):
        with tempfile.TemporaryDirectory() as tmp:
            a = Path(tmp) / "old.json"
            b = Path(tmp) / "new.json"
            original = json.loads(FIXTURE.read_text(encoding="utf-8"))
            a.write_text(json.dumps(original, ensure_ascii=False), encoding="utf-8")
            changed = json.loads(json.dumps(original))
            changed[0]["courtTelephone"] = "+7 000 000 11 11"  # test-only, fictional
            b.write_text(json.dumps(changed, ensure_ascii=False), encoding="utf-8")
            _, older = read_file(a)
            _, newer = read_file(b)
            before = {row.external_code: {
                "court_name": row.name, "court_type": row.court_type,
                "address": row.address, "phone": row.phone,
                "email": row.email, "official_url": row.official_url
            } for row in older}
            after = {row.external_code: {
                "court_name": row.name, "court_type": row.court_type,
                "address": row.address, "phone": row.phone,
                "email": row.email, "official_url": row.official_url
            } for row in newer}
            diffs = compare(before, after)
            self.assertEqual(len(diffs), 1)
            self.assertEqual(diffs[0].field, "phone")
            self.assertEqual(diffs[0].kind, "changed")

    def test_reformatted_export_has_stable_content(self):
        with tempfile.TemporaryDirectory() as tmp:
            first = Path(tmp) / "compact.json"
            second = Path(tmp) / "pretty.json"
            original = json.loads(FIXTURE.read_text(encoding="utf-8"))
            first.write_text(json.dumps(original, ensure_ascii=False, sort_keys=False), encoding="utf-8")
            second.write_text(json.dumps(original, ensure_ascii=False, sort_keys=True, indent=4), encoding="utf-8")
            _, a = read_file(first)
            _, b = read_file(second)
            self.assertEqual(canonical_records(a), canonical_records(b))

    def test_reject_fake_official_court(self):
        with tempfile.TemporaryDirectory() as tmp:
            file = Path(tmp) / "not-official.json"
            sample = json.loads(FIXTURE.read_text(encoding="utf-8"))
            sample[0]["courtSiteUrl"] = "https://evil.example/rs/demo"
            file.write_text(json.dumps(sample, ensure_ascii=False), encoding="utf-8")
            with self.assertRaises(ImportValidationError):
                read_file(file)


if __name__ == "__main__":
    unittest.main()
