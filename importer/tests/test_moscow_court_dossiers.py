"""Source-gated Moscow court dossier acceptance, without touching the first ten pilots."""
import json
import re
import unittest
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/'apps/web/app'
MOSCOW=APP/'lib/moscow-court-dossiers.json'
FIRST_TEN=APP/'lib/pilot-review-matrix.json'

class MoscowDossierTests(unittest.TestCase):
    def test_exactly_twelve_distinct_official_moscow_courts(self):
        rows=json.loads(MOSCOW.read_text(encoding='utf-8'))
        self.assertEqual(len(rows),12)
        self.assertEqual(len({row['slug'] for row in rows}),12)
        self.assertEqual(len(json.loads(FIRST_TEN.read_text(encoding='utf-8'))['records']),10)
        for row in rows:
            with self.subTest(slug=row['slug']):
                self.assertRegex(row['slug'],r'^[a-z]+$')
                self.assertIn('районный суд',row['name'].lower())
                self.assertEqual(row['court_level'],'district_general_jurisdiction')
                self.assertEqual(row['region'],'Москва')
                self.assertIn('Москва',row['address'])
                self.assertTrue(row['email'].endswith('.msksud.ru'))
                self.assertFalse(row['current_details_attested'])
                self.assertFalse(row['full_address_boundary_verified'])
                self.assertEqual(row['editorial_status'],'research_only')
                self.assertEqual(row['source_observed_on'],'2026-10-18')
                self.assertFalse(row['office_hours_is_department_hours'])
                self.assertGreater(len(row['notes']),65)
                for suffix,field in [('', 'official_url'),('/services/territorial','territory_service_url'),('/services/cases','case_service_url')]:
                    uri=urlsplit(row[field])
                    self.assertEqual(uri.scheme,'https')
                    self.assertEqual(uri.hostname,'mos-gorsud.ru')
                    self.assertEqual(uri.path,'/rs/'+row['slug']+suffix)

    def test_real_case_examples_have_court_specific_provenance_and_no_personal_details(self):
        rows=json.loads(MOSCOW.read_text(encoding='utf-8'))
        self.assertGreaterEqual(sum(len(x['case_examples']) for x in rows),12)
        for court in rows:
            with self.subTest(slug=court['slug']):
                self.assertGreaterEqual(len(court['case_examples']),1)
                seen=set()
                for case in court['case_examples']:
                    self.assertRegex(case['number'],r'^0[12](?:а)?-[0-9]+/2026$')
                    self.assertNotIn(case['number'],seen)
                    seen.add(case['number'])
                    uri=urlsplit(case['source_url'])
                    self.assertEqual(uri.hostname,'mos-gorsud.ru')
                    self.assertTrue(uri.path.startswith('/rs/'+court['slug']+'/services/cases/'))
                    self.assertTrue(case['case_type'])
                    self.assertGreater(len(case['subject']),10)
                    self.assertNotIn('Истец:',case['subject'])
                    self.assertNotIn('Ответчик:',case['subject'])

    def test_new_pages_noindex_until_address_and_editorial_acceptance(self):
        detail=(APP/'courts/moscow/[slug]/page.tsx').read_text(encoding='utf-8')
        listing=(APP/'courts/moscow/page.tsx').read_text(encoding='utf-8')
        index=(APP/'courts/page.tsx').read_text(encoding='utf-8')
        sitemap=(APP/'sitemap.ts').read_text(encoding='utf-8')
        for key in ('msk-jurisdiction','msk-case-kinds','msk-cases','msk-appeal','msk-faq','msk-sources'):
            self.assertIn(key,detail)
        self.assertIn('robots:{index:false,follow:true}',detail)
        self.assertIn('robots:{index:false,follow:true}',listing)
        self.assertIn('moscowCourts()',listing)
        self.assertIn('href="/courts/moscow"',index)
        self.assertNotIn('moscowCourts',sitemap)
        self.assertIn('полные улицы и дома',detail.lower())
        self.assertIn('case_examples.map',detail)
        self.assertNotIn('fetch(',detail)
if __name__=='__main__': unittest.main()
