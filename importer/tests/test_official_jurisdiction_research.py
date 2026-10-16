"""Regression tests for official territorial data staged without fictitious routing."""
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SEEDS=ROOT/'importer/seeds'
MIGRATIONS=ROOT/'db/migrations'

class OfficialJurisdictionResearchTests(unittest.TestCase):
    def load(self,basename):
        return json.loads((SEEDS/basename).read_text(encoding='utf8'))

    def test_omsk_central_clauses(self):
        d=self.load('omsk-central-court-territory-official-research-2026-10-16.json')
        self.assertEqual(d['court_code'],'55RS0007')
        self.assertEqual(d['region_code'],'55')
        self.assertEqual(d['evidence_status'],'research_only')
        self.assertFalse(d['usable_for_address_routing'])
        self.assertEqual(len(d['excerpts']),103)
        self.assertEqual([x['source_item_no'] for x in d['excerpts']],list(range(1,104)))
        self.assertEqual(d['last_source_update_on'],'2025-05-26')

    def test_omsk_kirov_clauses(self):
        d=self.load('omsk-kirov-court-territory-official-research-2026-10-16.json')
        self.assertEqual(d['court_code'],'55RS0001')
        self.assertEqual(d['region_code'],'55')
        self.assertEqual(d['review_status'],'research_only')
        self.assertFalse(d['allowed_for_routing'])
        self.assertEqual(len(d['excerpts']),180)
        self.assertEqual([x['source_item_no'] for x in d['excerpts']],list(range(1,181)))
        self.assertEqual(d['source_published_on'],'2026-03-01')

    def test_sources_have_explicit_quality_state(self):
        d=self.load('territorial-source-status-official-2026-10-16.json')
        self.assertEqual(len(d['sources']),6)
        self.assertEqual(sum(x['source_status']=='territory_published' for x in d['sources']),2)
        self.assertEqual(sum(x['source_status']=='page_unfilled' for x in d['sources']),4)
        self.assertEqual(len({(x['external_code'],x['source_url']) for x in d['sources']}),6)
        self.assertEqual(d['approved_for_address_lookup'],0)
        for s in d['sources']:
            self.assertTrue(s['source_url'].startswith('https://'))
            self.assertTrue(s['source_url'].split('/')[2].endswith('.sudrf.ru'))

    def test_novosibirsk_138_annexes_are_not_coordinates(self):
        d=self.load('novosibirsk-2026-149oz-jurisdiction-annex-manifest.json')
        self.assertEqual(d['expected_annex_count'],138)
        self.assertFalse(d['allowed_for_routing'])
        self.assertEqual(len(d['pending_annexes']),138)
        self.assertEqual([x['annex_no'] for x in d['pending_annexes']],list(range(1,139)))
        for x in d['pending_annexes']:
            self.assertEqual(x['status'],'awaiting_official_attachment')
            self.assertIsNone(x['coordinates'])
            self.assertIsNone(x['court_code'])

    def test_sql_tables_cannot_approve_unreviewed_sources(self):
        a=(MIGRATIONS/'016_official_jurisdiction_research.sql').read_text(encoding='utf8')
        b=(MIGRATIONS/'017_jurisdiction_annex_manifest.sql').read_text(encoding='utf8')
        self.assertIn("CHECK(review_status='research_only')",a)
        self.assertIn("CHECK(allowed_for_routing=false)",a)
        self.assertIn("CHECK(allowed_for_routing=false)",b)
        self.assertIn("CHECK(original_document_url IS NULL AND court_code IS NULL AND boundary_geometry IS NULL)",b)
        self.assertNotIn('INSERT INTO court_jurisdiction_units',a+b)
        self.assertNotIn('UPDATE court_jurisdiction_units',a+b)

if __name__=='__main__': unittest.main()
