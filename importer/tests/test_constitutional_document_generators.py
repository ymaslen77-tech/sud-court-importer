"""Regression checks for the two court document generators and safe client-only drafting."""
import unittest
from pathlib import Path

APP=Path(__file__).resolve().parents[2]/"apps"/"web"/"app"
GENERATOR=APP/"_components"/"constitutional-document-generator.tsx"
ROUTE=APP/"courts"/"reference"/"constitutional-court-rf"/"documents"/"[kind]"/"page.tsx"
DOSSIER=APP/"_components"/"constitutional-court-dossier.tsx"
TOPIC=APP/"courts"/"reference"/"constitutional-court-rf"/"info"/"[topic]"/"page.tsx"

class ConstitutionalDocumentGeneratorsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.generator=GENERATOR.read_text(encoding="utf-8")
        cls.route=ROUTE.read_text(encoding="utf-8")
        cls.dossier=DOSSIER.read_text(encoding="utf-8")
        cls.topic=TOPIC.read_text(encoding="utf-8")

    def test_two_real_routes_not_broken_stubs(self):
        self.assertIn("'complaint'",self.route)
        self.assertIn("'fee-relief'",self.route)
        self.assertIn("generateStaticParams()",self.route)
        self.assertIn("notFound()",self.route)
        self.assertIn("ConstitutionalDocumentGenerator kind={item.kind}",self.route)
        self.assertIn("robots:{index:false,follow:true}",self.route)

    def test_both_generators_linked_from_dossier_and_guidance(self):
        for target in ("documents/complaint","documents/fee-relief"):
            with self.subTest(target=target):
                self.assertIn(target,self.dossier)
                self.assertIn(target,self.topic)
                self.assertIn(target,self.route)

    def test_private_browser_only_generation_and_visible_validation(self):
        self.assertTrue(self.generator.lstrip().startswith("'use client'"))
        for key in ("missing.length===0","disabled={!canExport}","Скачать TXT",
                    "navigator.clipboard.writeText", "URL.createObjectURL", 
                    "document.createElement('a')","role=\"status\""):
            with self.subTest(key=key):
                self.assertIn(key,self.generator)
        for forbidden in ("fetch(", "localStorage", "sessionStorage",
                          "sendBeacon", "XMLHttpRequest", "dangerouslySetInnerHTML"):
            self.assertNotIn(forbidden,self.generator)

    def test_statutory_required_content_is_present(self):
        for name in ("actIssuer","actIdentification","actPublication",
                     "challengedProvision","constitutionArticles","caseHistory",
                     "courtDecisions","exhaustionExplanation","deadlineExplanation",
                     "legalArguments","attachments","feeReasons","financialEvidence"):
            self.assertIn("key:'"+name+"'",self.generator)
        for law in ("статьи 36–38, 96–97","333.23","статьями 39",
                    "https://www.ksrf.ru/Petition/PrimerOfStructure.php"):
            self.assertIn(law,self.generator)

    def test_no_false_legal_guarantee(self):
        self.assertIn("не подтверждает допустимость",self.generator)
        self.assertIn("не гарантирует удовлетворения",self.generator)
        self.assertIn("Черновик, не готовая к подаче жалоба",self.generator)

if __name__=="__main__":
    unittest.main()
