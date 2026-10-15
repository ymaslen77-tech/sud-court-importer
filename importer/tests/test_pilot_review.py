"""Validate human-review pilot without turning any candidate into a published court."""
import json
from pathlib import Path
from urllib.parse import urlsplit
import unittest

ROOT = Path(__file__).resolve().parents[2]
PILOT = ROOT / "importer" / "review" / "pilot-first-ten-2026-10-15.json"
SEEDS = ROOT / "importer" / "seeds"
FILES = (
    "novosibirsk-federal-official-unreviewed.json",
    "novosibirsk-federal-additional-official-unreviewed.json",
    "omsk-federal-official-unreviewed.json",
)

class PilotTenReviewTests(unittest.TestCase):
    def test_pilot_links_back_to_exact_unreviewed_source_records(self):
        pilot = json.loads(PILOT.read_text(encoding="utf-8"))
        self.assertEqual(pilot["schema_version"], 1)
        self.assertEqual(pilot["status"], "research_only")
        self.assertTrue(pilot["editorial_approval_not_granted"])
        self.assertFalse(pilot["automatic_approval_permitted"])
        courts = [r for file in FILES for r in json.loads((SEEDS / file).read_text(encoding="utf-8"))]
        by_code = {r["courtCode"]:r for r in courts}
        self.assertEqual(len(by_code), 76)
        self.assertEqual(len(pilot["candidates"]), 10)
        codes = [r["external_code"] for r in pilot["candidates"]]
        self.assertEqual(len(set(codes)), 10)
        self.assertEqual([r["priority"] for r in pilot["candidates"]], list(range(1, 11)))
        observed = 0
        for record in pilot["candidates"]:
            code = record["external_code"]
            with self.subTest(code=code):
                seed = by_code[code]
                snapshot = record["snapshot"]
                for seed_field, field in [
                    ("courtName","court_name"),
                    ("courtType","court_type"),
                ]:
                    self.assertEqual(seed[seed_field],record[field])
                for seed_field,field in [
                    ("courtAddress","address"),("courtTelephone","phone"),
                    ("courtEmail","email"),("courtSiteUrl","court_site_url"),
                    ("sourceRecordUrl","source_listing_url"),
                ]:
                    self.assertEqual(seed.get(seed_field),snapshot[field])
                self.assertRegex(snapshot["record_sha256"],r"^[0-9a-f]{64}$")
                self.assertEqual(record["publication_state"], "pending")
                self.assertFalse(record["editorial_approved"])
                self.assertGreaterEqual(len(record["required_editorial_checks"]),6)
                observation=record["official_page_observation"]
                if observation is not None:
                    observed+=1
                    self.assertEqual(observation["observation_type"],
                                     "public_search_result_not_current_human_attestation")
                    url=urlsplit(observation["url"])
                    self.assertEqual(url.scheme,"https")
                    self.assertTrue(url.hostname=="sudrf.ru" or url.hostname.endswith(".sudrf.ru"))
                    self.assertIn("court_name", observation["observed_fields"])
                    self.assertTrue(set(observation["observed_fields"]).issubset(
                        {"court_name","address","phone","email","hours"}))
        self.assertEqual(observed, 7)

    def test_unobserved_courts_have_no_fabricated_source_evidence(self):
        pilot=json.loads(PILOT.read_text(encoding="utf-8"))
        not_observed={r["external_code"] for r in pilot["candidates"]
                      if r["official_page_observation"] is None}
        self.assertEqual(not_observed,{"54RS0002","54RS0003","54RS0004"})

if __name__ == "__main__":
    unittest.main()
