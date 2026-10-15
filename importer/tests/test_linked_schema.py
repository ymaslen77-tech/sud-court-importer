"""Check presence of review protections in the 013 linked-court migration."""
from pathlib import Path
import unittest

MIGRATION = Path(__file__).resolve().parents[2] / "db/migrations/013_court_linked_facts.sql"

class CourtLinkedSchemaTests(unittest.TestCase):
    def test_three_related_tables_default_to_draft(self):
        sql = MIGRATION.read_text(encoding="utf-8")
        self.assertEqual(sql.count("CREATE TABLE IF NOT EXISTS court_"),3)
        self.assertEqual(sql.count("review_status TEXT NOT NULL DEFAULT 'draft'"),3)
        self.assertEqual(sql.count("review_status <> 'approved' OR"),3)
        self.assertIn("court_buildings_one_approved_primary",sql)
        self.assertIn("court_id BIGINT NOT NULL REFERENCES courts(id)",sql)
        self.assertIn("FOREIGN KEY(building_id,court_id) REFERENCES court_buildings(id,court_id)",sql)
        self.assertIn("source_id BIGINT NOT NULL REFERENCES sources(id)",sql)
        self.assertNotIn("INSERT INTO courts",sql)
        self.assertNotIn("UPDATE courts",sql)
        self.assertNotIn("FROM court_import_rows",sql)
        self.assertNotIn("FROM court_discovery_rows",sql)

if __name__ == "__main__":
    unittest.main()
