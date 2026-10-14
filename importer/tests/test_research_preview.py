"""Website research previews must faithfully mirror the closed, unreviewed seeds."""
import json
import unittest
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
WEB_DATA = ROOT / "apps" / "web" / "app" / "lib" / "research-courts.json"
SEEDS = ROOT / "importer" / "seeds"
SOURCES = (
    "novosibirsk-federal-official-unreviewed.json",
    "novosibirsk-federal-additional-official-unreviewed.json",
    "omsk-federal-official-unreviewed.json",
)


class ResearchPreviewTests(unittest.TestCase):
    def test_all_76_candidates_keep_source_provenance(self):
        previews = json.loads(WEB_DATA.read_text(encoding="utf-8"))
        seeds = [row for file in SOURCES
                 for row in json.loads((SEEDS / file).read_text(encoding="utf-8"))]
        self.assertEqual(len(seeds), 76)
        self.assertEqual(len(previews), 76)
        original = {row["courtCode"]: row for row in seeds}
        self.assertEqual(len(original), 76)
        codes = [x["code"] for x in previews]
        self.assertEqual(len(codes), len(set(codes)))
        for preview in previews:
            with self.subTest(code=preview["code"]):
                row = original[preview["code"]]
                self.assertEqual(preview["status"], "unreviewed")
                self.assertEqual(preview["region"], "region-" + row["regionCode"])
                for original_field, preview_field in (
                    ("courtName", "name"), ("regionName", "regionName"),
                    ("courtType", "kind"), ("courtAddress", "address"),
                    ("courtTelephone", "phone"), ("courtEmail", "email"),
                    ("courtSiteUrl", "website"), ("sourceRecordUrl", "source")
                ):
                    self.assertEqual(preview[preview_field], row.get(original_field))
                official_source = urlsplit(preview["source"])
                self.assertEqual(official_source.scheme, "https")
                self.assertEqual(official_source.hostname, "sudrf.ru")
                website_host = urlsplit(preview["website"]).hostname
                self.assertTrue(website_host and website_host.endswith(".sudrf.ru"))

    def test_magistrate_previews_keep_missing_fields_empty(self):
        previews = json.loads((WEB_DATA.with_name("research-magistrates.json"))
                              .read_text(encoding="utf-8"))
        originals = json.loads((SEEDS / "khabarovsk-magistrates-official-unreviewed.json")
                              .read_text(encoding="utf-8"))
        self.assertEqual(len(previews), 75)
        by_code = {row["courtCode"]: row for row in originals}
        self.assertEqual(len(by_code), 75)
        for preview in previews:
            with self.subTest(code=preview["code"]):
                source = by_code[preview["code"]]
                self.assertEqual(preview["name"], source["courtName"])
                self.assertEqual(preview["source"], source["sourceRecordUrl"])
                self.assertEqual(preview["region"], "region-27")
                self.assertEqual(preview["status"], "unreviewed")
                self.assertTrue(preview["code"].startswith("27MS"))
                for field in ("address", "phone", "email"):
                    self.assertIsNone(preview[field])
                number = int(preview["code"][-4:])
                self.assertEqual(preview["website"], f"http://{number}.hbr.msudrf.ru")

    def test_no_research_card_can_be_marked_verified_in_static_data(self):
        previews = json.loads(WEB_DATA.read_text(encoding="utf-8"))
        self.assertTrue(all(c["status"] == "unreviewed" for c in previews))
        # Public verified state is only assigned through DB-backed human review.
        self.assertFalse(any("verified_at" in c or "reviewed_by" in c for c in previews))


if __name__ == "__main__":
    unittest.main()
