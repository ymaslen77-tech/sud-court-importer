"""Offline checks: ten-court research evidence cannot be promoted by staging."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from stage_pilot_evidence import observations, valid_evidence_url

ROOT=Path(__file__).resolve().parents[2]
MIGRATION=ROOT/"db/migrations/014_candidate_evidence.sql"


class CandidateEvidenceTests(unittest.TestCase):
    def test_forty_eight_provenance_rows_are_research_only(self):
        rows=observations()
        self.assertEqual(len(rows),48)
        self.assertEqual(len({r["external_code"] for r in rows}),10)
        self.assertEqual(sum(r["channel"]=="cached_official_case_uid" for r in rows),8)
        self.assertEqual(sum(r["channel"]=="cached_official_page" for r in rows),40)
        self.assertEqual({r["field_name"] for r in rows},
            {"court_name","address","phone","email","classification_code"})
        self.assertEqual({r["researched_on"] for r in rows},{"2026-10-15"})

    def test_unsafe_and_cross_site_urls_are_rejected(self):
        host="barabinsky--nsk.sudrf.ru"
        self.assertTrue(valid_evidence_url("https://"+host+"/modules.php?name=info_court",host))
        for link in ("http://"+host+"/",
                     "https://"+host+".evil.example/",
                     "https://oblsud--oms.sudrf.ru/",
                     "https://user@"+host+"/",
                     "https://"+host+":8080/",
                     "https://"+host+"/#ref"):
            with self.subTest(link=link):
                self.assertFalse(valid_evidence_url(link,host))

    def test_migration_requires_freshness_and_editor_before_approval(self):
        sql=MIGRATION.read_text(encoding="utf8")
        self.assertIn("import_row_id BIGINT NOT NULL REFERENCES court_import_rows(id)",sql)
        self.assertIn("review_status TEXT NOT NULL DEFAULT 'research_only'",sql)
        self.assertIn("source_freshness_attested BOOLEAN NOT NULL DEFAULT false",sql)
        self.assertIn("source_freshness_attested = true",sql)
        self.assertIn("reviewed_by IS NOT NULL",sql)
        self.assertNotIn("INSERT INTO courts",sql)
        self.assertNotIn("UPDATE courts",sql)


if __name__=="__main__":
    unittest.main()
