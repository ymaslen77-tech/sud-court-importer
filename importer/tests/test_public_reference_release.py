"""Public reference release remains separate from fully verified court publishing."""
import sys
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
from publish_reference_pilot import release_candidates

class ReferencePublicationTests(unittest.TestCase):
    def test_ten_allowed_source_publication_candidates(self):
        rows=release_candidates()
        self.assertEqual(len(rows),10)
        self.assertEqual(len({r["code"] for r in rows}),10)
        self.assertTrue(all(r["slug"]=="sud-"+r["code"].lower() for r in rows))
        self.assertTrue(all(r["home"].startswith("https://") for r in rows))
        self.assertTrue(all(r["source"].startswith(r["home"][:-1]) for r in rows))

    def test_database_source_reference_is_not_verified(self):
        sql=(ROOT/"db/migrations/015_public_reference_profiles.sql").read_text(encoding="utf8")
        self.assertIn("REFERENCES court_import_rows",sql)
        self.assertIn("DEFAULT 'sourced_reference'",sql)
        self.assertIn("current_freshness_attested BOOLEAN NOT NULL DEFAULT false",sql)
        self.assertNotIn("INSERT INTO courts",sql)
        self.assertNotIn("UPDATE courts",sql)
        self.assertNotIn("review_status='approved'",sql)

if __name__=="__main__":
    unittest.main()
