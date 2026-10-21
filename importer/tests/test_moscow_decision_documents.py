"""Ensure no docket-only record gets promoted to a published full judicial act."""
import sys
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
from court_decision_coverage import audit

class DecisionDocumentsTests(unittest.TestCase):
    def test_docket_outcomes_and_full_documents_are_separate(self):
        x=audit()
        self.assertEqual(x["courts"],12)
        self.assertEqual(x["topics"],13)
        self.assertEqual(x["verified_docket_results"],74)
        self.assertEqual(x["verified_full_document_count"],0)
        self.assertEqual(x["full_document_slots"],7200)
        self.assertEqual(len(x["coverage"]),156)
        self.assertTrue(all(z["remaining"]==50 for z in x["coverage"] if z["topic_id"]!="family"))
        self.assertTrue(all(z["remaining"] is None and z["target"] is None for z in x["coverage"] if z["topic_id"]=="family"))

    def test_document_viewer_does_not_fabricate_unpublished_judgments(self):
        page=(ROOT/"apps/web/app/courts/moscow/[slug]/cases/[caseId]/page.tsx").read_text(encoding="utf-8")
        lib=(ROOT/"apps/web/app/lib/moscow-adjudicated-cases.ts").read_text(encoding="utf-8")
        explorer=(ROOT/"apps/web/app/_components/moscow-cases-explorer.tsx").read_text(encoding="utf-8")
        for token in ("isVerifiedDocument(c)","Текст судебного акта","полный текст", "robots:{index:false"):
            self.assertIn(token.lower(),page.lower())
        self.assertIn("redactionReviewed",lib)
        self.assertIn("statutoryPublicationChecked",lib)
        self.assertIn("EXCLUDED_FULL_TEXT_TOPICS",lib)
        self.assertIn("reusePermissionConfirmed",lib)
        self.assertIn("doc.sha256",lib)
        self.assertIn("<Link",explorer)
        self.assertIn("topic.documentCount",explorer)
        self.assertIn("disposition",explorer)

    def test_sql_publication_has_three_independent_gates(self):
        s=(ROOT/"db/migrations/020_moscow_decision_documents.sql").read_text(encoding="utf-8")
        for key in ("source_reuse_confirmed=true","verified_redaction=true","editor_approved=true",
                    "publication_state='approved_document'","official_document_url IS NOT NULL","statutory_publication_checked=true","law_topic <> 'family'"):
            self.assertIn(key,s)

if __name__=="__main__":
    unittest.main()
