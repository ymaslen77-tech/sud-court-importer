"""Offline review preflight never publishes a court decision or treats legal exclusions as optional."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
from stage_decision_file import stage,validate_document_source

class StageDecisionFileTests(unittest.TestCase):
    def test_official_url_restrictions(self):
        self.assertTrue(validate_document_source("https://m.mos-gorsud.ru/rs/lefortovskij/services/cases/civil/details/123"))
        for bad in ("http://mos-gorsud.ru/rs/a/d","https://evil.ru/rs/a/d",
                    "https://mos-gorsud.ru.evil.ru/rs/a/d",
                    "https://mos-gorsud.ru@evil.ru/rs/a/d",
                    "https://mos-gorsud.ru:999/rs/a/d"):
            with self.subTest(url=bad),self.assertRaises(ValueError):
                validate_document_source(bad)

    def test_preflight_outputs_manifest_only_and_requires_later_approval(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            pdf=root/"source.pdf"
            pdf.write_bytes(b"%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n")
            out=root/"review"/"manifest.json"
            item=stage("lefortovskij","02-5648/2026",str(pdf),
              "https://mos-gorsud.ru/rs/lefortovskij/services/cases/civil/details/test",str(out))
            self.assertTrue(out.is_file())
            self.assertEqual(json.loads(out.read_text())["original_source_sha256"],item["original_source_sha256"])
            self.assertEqual(item["publication_state"],"document_review")
            self.assertFalse(item["statutory_publication_checked"])
            self.assertFalse(item["verified_redaction"])
            self.assertFalse(item["source_reuse_confirmed"])
            self.assertFalse(item["editor_approved"])
            self.assertFalse(item["public_file_created"])
            self.assertFalse((root/"court-decisions").exists())
            with self.assertRaises(ValueError):stage("lefortovskij","02-5648/2026",str(pdf),
              "https://mos-gorsud.ru/rs/lefortovskij/services/cases/civil/details/test",str(out))

    def test_cross_court_or_unknown_case_fails(self):
        with tempfile.TemporaryDirectory() as temp:
            source=Path(temp)/"in.pdf";source.write_bytes(b"%PDF-1.4\n1 0 obj <<>> endobj\n%%EOF\n")
            out=Path(temp)/"review.json"
            with self.assertRaises(ValueError):
                stage("nikulinskij","02-5648/2026",str(source),
                      "https://mos-gorsud.ru/rs/nikulinskij/services/cases/civil/details/id",str(out))
            with self.assertRaises(ValueError):
                stage("lefortovskij","02-5648/2026",str(source),
                      "https://mos-gorsud.ru/rs/nikulinskij/services/cases/civil/details/id",str(out))

    def test_active_content_pdf_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            source=Path(temp)/"active.pdf"
            source.write_bytes(b"%PDF-1.7\n/JavaScript action\n%%EOF")
            with self.assertRaisesRegex(ValueError,"active-content"):
                stage("lefortovskij","02-5648/2026",str(source),
                  "https://mos-gorsud.ru/rs/lefortovskij/services/cases/civil/details/id",
                  str(Path(temp)/"review.json"))

    def test_staging_keeps_family_acts_out(self):
        registry=json.loads((ROOT/"apps/web/app/lib/moscow-adjudicated-cases.json").read_text(encoding="utf-8"))
        family=next((c for c in registry if c["topic_id"]=="family"),None)
        self.assertIsNotNone(family)
        with tempfile.TemporaryDirectory() as temp:
            pdf=Path(temp)/"court.pdf";pdf.write_bytes(b"%PDF-1.4\n1 0 obj <<>> endobj\n%%EOF")
            with self.assertRaisesRegex(ValueError,"262-FZ"):
                stage(family["court_slug"],family["number"],str(pdf),
                      "https://mos-gorsud.ru/rs/"+family["court_slug"]+"/services/cases/civil/details/id",
                      str(Path(temp)/"review.json"))
if __name__=="__main__":unittest.main()
