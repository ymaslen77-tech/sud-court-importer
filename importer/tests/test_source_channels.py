import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from source_channels import CATALOG, audit


class OfficialChannelTests(unittest.TestCase):
    def test_all_sources_are_discovered_without_machine_permission(self):
        report = audit()
        self.assertEqual(report["sources_recorded"], 4)
        self.assertEqual(report["permissioned_machine_feeds"], 0)
        self.assertEqual(report["manual_review_only"], 4)
        self.assertFalse(report["automated_download_started"])
        self.assertEqual(report["auto_published"], 0)

    def test_unsubstantiated_approval_rejected(self):
        data = json.loads(CATALOG.read_text(encoding="utf-8"))
        data["channels"][0]["status"] = "approved_feed"
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "catalog.json"
            path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "lacks required explicit evidence"):
                audit(path)

    def test_duplicate_source_rejected(self):
        data = json.loads(CATALOG.read_text(encoding="utf-8"))
        data["channels"].append(copy.deepcopy(data["channels"][0]))
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "catalog.json"
            path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "duplicated"):
                audit(path)

    def test_official_host_spoofing_rejected(self):
        data = json.loads(CATALOG.read_text(encoding="utf-8"))
        data["channels"][0]["listing_url"] = "https://sudrf.ru.evil.example/index.php"
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "catalog.json"
            path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "official HTTPS listing"):
                audit(path)

    def test_http_and_fake_permission_flags_rejected(self):
        data = json.loads(CATALOG.read_text(encoding="utf-8"))
        data["channels"][0]["listing_url"] = "http://sudrf.ru/"
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "catalog.json"
            path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "official HTTPS"):
                audit(path)
            data["channels"][0]["listing_url"] = "https://sudrf.ru/"
            data["channels"][0]["reuse_rights_confirmed"] = "true"
            path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "permission boolean"):
                audit(path)


if __name__ == "__main__":
    unittest.main()
