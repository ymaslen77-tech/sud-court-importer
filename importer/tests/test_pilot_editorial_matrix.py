"""Validate crosschecked pilot display without claiming a human approval or live source check."""
from pathlib import Path
from urllib.parse import urlsplit
import json
import unittest

ROOT=Path(__file__).resolve().parents[2]
PILOT=ROOT/"importer/review/pilot-first-ten-2026-10-15.json"
MATRIX=ROOT/"apps/web/app/lib/pilot-review-matrix.json"
PAGE=ROOT/"apps/web/app/editor/pilot/page.tsx"
DASH=ROOT/"apps/web/app/editor/dashboard/page.tsx"

class PilotEditorialResearchTests(unittest.TestCase):
    def test_research_matrix_matches_original_staging(self):
        research=json.loads(MATRIX.read_text(encoding="utf8"))
        pilot=json.loads(PILOT.read_text(encoding="utf8"))
        self.assertEqual(research["schema_version"],1)
        self.assertEqual(research["purpose"],"editorial_research_only")
        self.assertTrue(research["not_human_attestation"])
        self.assertFalse(research["automatic_publication_permitted"])
        original={item["external_code"]:item for item in pilot["candidates"]}
        self.assertEqual(len(original),10)
        self.assertEqual({row["external_code"] for row in research["records"]},set(original))
        self.assertEqual(len(research["records"]),10)
        for item in research["records"]:
            with self.subTest(code=item["external_code"]):
                source=original[item["external_code"]]
                self.assertEqual(item["court_name"],source["court_name"])
                self.assertEqual(item["batch_id"],source["batch_id"])
                self.assertEqual(item["record_sha256"],source["snapshot"]["record_sha256"])
                self.assertEqual(item["original_site_url"],source["snapshot"]["court_site_url"])
                self.assertEqual(item["source_listing_url"],source["snapshot"]["source_listing_url"])
                self.assertEqual(item["individual_source_url"],source["official_page_observation"]["url"])
                self.assertEqual(item["region_code"],item["external_code"][:2])
                for field in ("address","phone","email"):
                    self.assertEqual(item["archived_values"][field],source["snapshot"][field])
                website=urlsplit(item["https_site_url"])
                evidence=urlsplit(item["individual_source_url"])
                self.assertEqual(website.scheme,"https")
                self.assertEqual(website.hostname,evidence.hostname)
                self.assertTrue(website.hostname.endswith(".sudrf.ru"))
                self.assertEqual(website.path,"/")
                self.assertEqual(item["web_cache_freshness"],"not_currently_attested")
                for field in ("official_identifier_crosscheck","territorial_legal_crosscheck",
                              "contact_department_roles","reuse_basis_review"):
                    self.assertEqual(item[field],"pending")
                self.assertIsNone(item["source_date_confirmed"])
                self.assertIsNone(item["reviewer"])
                self.assertFalse(item["editorial_approved"])
                self.assertEqual(item["publication_state"],"pending")
                self.assertTrue(item["specific_blockers"])
                self.assertEqual(item["source_header_observations"],
                                 ["court_name","address","phone","email"])

    def test_editor_page_is_authenticated_noindex_read_only(self):
        page=PAGE.read_text(encoding="utf8")
        dashboard=DASH.read_text(encoding="utf8")
        self.assertIn("hasEditorCredentials()",page)
        self.assertIn("editorConfigured()",page)
        self.assertIn("notFound()",page)
        self.assertIn("index:false,follow:false",page)
        self.assertNotIn("editorReviewToken",page)
        self.assertNotIn("method=\"post\"",page)
        self.assertNotIn("approve(",page)
        self.assertIn("href=\"/editor/pilot\"",dashboard)

if __name__=="__main__":
    unittest.main()
