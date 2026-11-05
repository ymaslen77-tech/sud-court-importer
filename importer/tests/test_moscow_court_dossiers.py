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
        self.assertEqual(sum(len(x['case_examples']) for x in rows),36)
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
                    self.assertEqual(case['source_observed_on'],'2026-10-18')
                    self.assertFalse(case['current_status_verified'])
                    self.assertIn(case['topic_id'],{'family','labor','housing','property','consumer','credit','damage','fraud','other-criminal','bailiffs','kas','social','other'})

    def test_new_pages_noindex_until_address_and_editorial_acceptance(self):
        detail=(APP/'courts/moscow/[slug]/page.tsx').read_text(encoding='utf-8')
        listing=(APP/'courts/moscow/page.tsx').read_text(encoding='utf-8')
        index=(APP/'courts/page.tsx').read_text(encoding='utf-8')
        sitemap=(APP/'sitemap.ts').read_text(encoding='utf-8')
        for key in ('msk-jurisdiction','msk-case-kinds','msk-cases','msk-appeal','msk-faq','msk-sources'):
            self.assertIn(key,detail)
        self.assertIn('robots:moscowDistrictSeoRobots()',detail)
        self.assertIn('robots:moscowDistrictSeoRobots()',listing)
        self.assertIn('moscowCourts()',listing)
        self.assertIn('href="/courts/moscow"',index)
        self.assertNotIn('moscowCourts',sitemap)
        self.assertIn('проверяйте именно адрес здания',detail.lower())
        self.assertIn('<MoscowCasesExplorer court={c} decisions={adjudicatedCasesFor(c.slug)}/>',detail)
        self.assertIn('<MoscowYandexMap court={moved&&officialMinimum?.visitor_locations?.[0]',detail)
        self.assertIn(':c}/>',detail)
        self.assertEqual(detail.count('<MoscowLeadCapture '),2)
        case_ui=(APP/'_components/moscow-cases-explorer.tsx').read_text()
        self.assertIn('<details',case_ui)
        self.assertIn('topic.allOtherCount',case_ui)
        self.assertIn('подборке пока нет',case_ui)
        map_ui=(APP/'_components/moscow-yandex-map.tsx').read_text()
        self.assertIn('https://yandex.ru/map-widget/v1/',map_ui)
        self.assertNotIn('lat:',map_ui)
        lead_ui=(APP/'_components/moscow-lead-capture.tsx').read_text()
        lead_route=(APP/'api/court-leads/route.ts').read_text()
        for value in ('enabled={intakeReady}', 'privacyUrl={privacyUrl}'):
            self.assertIn(value,detail)
        for value in ('consent', 'honeypot', 'disabled={!enabled', 'role="status"'):
            self.assertIn(value,lead_ui.lower())
        for value in ("ORIGIN_MISMATCH", "SERVICE_NOT_CONFIGURED", "COURT_LEADS_RU_STORAGE_ATTESTED", "honeypot.length", "DELIVERY_FAILED"):
            self.assertIn(value,lead_route)
        migration=(ROOT/'db/migrations/019_moscow_case_and_territory_review.sql').read_text()
        self.assertIn('reuse_permission_confirmed = true',migration)
        self.assertIn('moscow_territorial_address_review',migration)
        self.assertIn('moscow_case_source_review',migration)
        self.assertNotIn('fetch(',detail)
if __name__=='__main__': unittest.main()
