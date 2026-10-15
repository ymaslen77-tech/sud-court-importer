"""Ten publicly sourced pilot pages must remain distinct from verified court records."""
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[2]
WEB=ROOT/'apps/web/app'
MATRIX=WEB/'lib/pilot-review-matrix.json'

class PublicPilotCourtTests(unittest.TestCase):
    def test_exactly_ten_official_source_profiles(self):
        research=json.loads(MATRIX.read_text(encoding='utf8'))
        records=research['records']
        self.assertEqual(len(records),10)
        self.assertEqual(len({r['external_code'] for r in records}),10)
        for item in records:
            with self.subTest(code=item['external_code']):
                self.assertTrue(item['https_site_url'].startswith('https://'))
                self.assertTrue(item['https_site_url'].endswith('.sudrf.ru/'))
                self.assertEqual(item['publication_state'],'pending')
                self.assertFalse(item['editorial_approved'])
                self.assertIsNone(item['source_date_confirmed'])
                self.assertIsNone(item['reviewer'])
                self.assertTrue(item['archived_values']['address'])
                self.assertTrue(item['individual_source_url'].startswith(item['https_site_url'][:-1]))

    def test_public_display_has_source_warning_and_no_invented_jurisdiction(self):
        s=(WEB/'_components/pilot-court-public.tsx').read_text(encoding='utf8')
        for phrase in ['официальных источников','не гарантируется','уличная','судей','пошлин','публикац']:
            self.assertIn(phrase.lower(),s.lower())
        self.assertIn('ResearchDossier',s)
        self.assertIn('safeOfficialSource',s)
        self.assertNotIn("editorial_approved:true",s)
        self.assertNotIn("status:'verified'",s)

    def test_metadata_and_directory_use_distinct_public_status(self):
        pages=(WEB/'app').exists()
        for path in ('courts/page.tsx','courts/[region]/page.tsx',
                     'courts/[region]/[court]/page.tsx','sitemap.ts'):
            p=WEB/('app/'+path if not path=='sitemap.ts' else 'app/sitemap.ts')
            self.assertTrue(p.exists(),path)
            self.assertIn('pilotPublic',p.read_text(encoding='utf8'),path)
        s=(WEB/'_components/research-court-preview.tsx').read_text(encoding='utf8')
        self.assertIn('PilotCourtPublic',s)
        api=(ROOT/'apps/api/src/module.ts').read_text(encoding='utf8')
        self.assertIn("WHERE c.status='verified'",api)

if __name__=='__main__':
    unittest.main()
