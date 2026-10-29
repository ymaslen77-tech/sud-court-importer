"""Guardrails for the client-only Constitutional Court complaint precheck."""
from pathlib import Path
import unittest

APP=Path(__file__).resolve().parents[2]/"apps"/"web"/"app"

class ConstitutionalComplaintSelfcheckTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.check=(APP/"_components/constitutional-complaint-selfcheck.tsx").read_text(encoding="utf-8")
        cls.dossier=(APP/"_components/constitutional-court-dossier.tsx").read_text(encoding="utf-8")
        cls.page=(APP/"courts/reference/constitutional-court-rf/info/[topic]/page.tsx").read_text(encoding="utf-8")
        cls.library=(APP/"lib/constitutional-reference-library.ts").read_text(encoding="utf-8")

    def test_check_is_client_side_without_personal_data_upload(self):
        self.assertTrue(self.check.lstrip().startswith("'use client'"))
        self.assertIn("useState<Record<string,Answer>>",self.check)
        self.assertIn("role=\"status\"",self.check)
        self.assertIn("aria-pressed",self.check)
        self.assertNotIn("fetch(",self.check)
        self.assertNotIn("localStorage",self.check)
        self.assertNotIn("XMLHttpRequest",self.check)
        self.assertNotIn("sendBeacon",self.check)
        for tag in ("norm","applied","rights","exhaustion","deadline","attachments"):
            with self.subTest(tag=tag):
                self.assertIn("id:'"+tag+"'",self.check)

    def test_embedded_on_main_and_topic_page(self):
        for page in (self.dossier,self.page):
            self.assertIn("import {ConstitutionalComplaintSelfCheck}",page)
            self.assertIn("<ConstitutionalComplaintSelfCheck/>",page)

    def test_guidance_includes_exceptions_and_official_verification(self):
        for needle in ("годичный срок","кассацион","специальн",
                       "представител","После отправки жалобы"):
            self.assertIn(needle,self.library)
        for url in ("https://www.ksrf.ru/Petition/algo/",
                    "https://www.ksrf.ru/about/legalbases/FCLM/Article97.php",
                    "https://www.ksrf.ru/Petition/PrimerOfStructure.php"):
            self.assertIn(url,self.check)
        self.assertIn("https://www.ksrf.ru/Petition/CurrentStatus.php",self.page)

if __name__=="__main__":
    unittest.main()
