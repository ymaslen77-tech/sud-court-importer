"""No unlicensed mass-copy, silent duplicates, fake verification or production writes."""
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from national_registry_preflight import audit, region_codes


def sample(name="Учебный районный суд", region="77", code="77RS0001", kind="general-district"):
    return {
        "name": name, "region_code": region, "kind": kind,
        "source_url": "https://sudrf.ru/reference",
        "observed_on": "2026-10-20",
        "official_code": code, "registry": "sudrf-federal",
        "official_url": "https://example.gov.ru/official-court",
    }


class NationalCorpusPreflightTests(unittest.TestCase):
    def audit_rows(self, rows, manifest=None):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            filename = root / "courts.json"
            filename.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
            if manifest is not None:
                location = root / "manifest.json"
                location.write_text(json.dumps(manifest), encoding="utf-8")
                return audit(filename, location)
            return audit(filename)

    def test_all_89_regions_in_taxonomy(self):
        self.assertEqual(len(region_codes()), 89)

    def test_unreviewed_candidates_never_become_published_courts(self):
        result = self.audit_rows([sample()])
        self.assertEqual(result["candidate_rows"], 1)
        self.assertEqual(result["regions_present"], 1)
        self.assertEqual(len(result["regions_missing_from_batch"]), 88)
        self.assertEqual(result["actual_courts_verified"], 0)
        self.assertEqual(result["database_writes"], 0)
        self.assertEqual(result["published"], 0)
        self.assertFalse(result["may_be_auto_published"])
        self.assertFalse(result["source"]["documentation_declared"])

    def test_duplicate_official_codes_and_names_flagged(self):
        result = self.audit_rows([sample(), sample()])
        self.assertEqual(result["duplicate_official_registry_code_rows"], [2])
        self.assertEqual(result["suspected_duplicate_names_rows"], [2])

    def test_missing_official_identity_reported_without_invention(self):
        original = sample()
        original.pop("official_code")
        original.pop("registry")
        original.pop("official_url")
        result = self.audit_rows([original])
        self.assertEqual(result["missing_official_registry_codes"], 1)
        self.assertEqual(result["missing_official_urls"], 1)
        self.assertEqual(result["name_only_candidates"], 1)

    def test_unrecognized_region_rejected(self):
        with self.assertRaisesRegex(ValueError, "unknown region"):
            self.audit_rows([sample(region="XX")])

    def test_unrecognized_type_rejected(self):
        with self.assertRaisesRegex(ValueError, "unknown region or court category"):
            self.audit_rows([sample(kind="regional-constitutional")])

    def test_source_urls_must_be_https(self):
        row = sample()
        row["source_url"] = "http://example.com"
        with self.assertRaisesRegex(ValueError, "invalid HTTPS"):
            self.audit_rows([row])

    def test_declared_license_is_not_auto_approval(self):
        declaration = {
            "provider": "Example licensed registry",
            "dataset_url": "https://dataset.example.org/export.json",
            "terms_url": "https://dataset.example.org/terms",
            "license_or_permission_url": "https://dataset.example.org/license",
            "bulk_access_declared": True,
            "reuse_declared": True,
            "reviewed_on": "2026-10-25",
        }
        result = self.audit_rows([sample()], declaration)
        self.assertTrue(result["source"]["documentation_declared"])
        self.assertFalse(result["source"]["source_authorisation_verified"])
        self.assertFalse(result["may_be_auto_published"])

    def test_no_network_and_no_db_use_in_source(self):
        source=(Path(__file__).resolve().parents[1]/"national_registry_preflight.py").read_text()
        for forbidden in ("requests.get(", "urlopen(", "psycopg.connect(", "INSERT INTO courts", "UPDATE courts SET"):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main()
