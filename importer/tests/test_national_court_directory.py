"""Nationwide directory source-provenance and verified API regression checks."""
import json
import unittest
from pathlib import Path

APP=Path(__file__).resolve().parents[2]/'apps/web/app'
class NationalCourtDirectoryTests(unittest.TestCase):
    def test_national_facets_and_source_separation(self):
        page=(APP/'courts/page.tsx').read_text(encoding='utf-8')
        search=(APP/'search/page.tsx').read_text(encoding='utf-8')
        ui=(APP/'_components/court-directory-explorer.tsx').read_text(encoding='utf-8')
        form=(APP/'_components/court-search.tsx').read_text(encoding='utf-8')
        self.assertIn('CourtDirectoryExplorer entries={all}',page)
        self.assertIn('directoryEntries()',search)
        for phrase in ('Все регионы','DIRECTORY_REGIONS'):
            self.assertIn(phrase,form)
        for phrase in ('Ожидают наполнения','Сбросить фильтры','Название из официального перечня'):
            self.assertIn(phrase,ui)
        self.assertIn("status==='research'",ui)
        self.assertIn('searchVerifiedCourtsPage',search)
        self.assertIn('verifiedBackendConfigured',search)
        self.assertIn('verifiedPage',search)
        self.assertIn('Страницы подтверждённого реестра',search)
        api=(APP.parents[2]/'apps/api/src/module.ts').read_text(encoding='utf-8')
        self.assertIn("@Get('courts/search-page')",api)
        self.assertIn('async searchPage(',api)
        self.assertIn('SEARCH_FILTER_REQUIRED',api)
        self.assertIn('c.court_kind=',api)
        self.assertIn('r.slug=',api)
        self.assertIn('LIMIT ',api)
        self.assertIn('https://sudrf.ru/',ui)
        self.assertNotIn('window.location',ui)
    def test_data_remains_research_only(self):
        courts=json.loads((APP/'lib/research-courts.json').read_text(encoding='utf-8'))
        magistrates=json.loads((APP/'lib/research-magistrates.json').read_text(encoding='utf-8'))
        self.assertEqual(len(courts),76)
        self.assertEqual(len(magistrates),75)
        self.assertTrue(all(x['status']=='unreviewed' for x in courts+magistrates))
        self.assertEqual(len(json.loads((APP/'lib/moscow-court-dossiers.json').read_text(encoding='utf-8'))),12)
        self.assertEqual(len(json.loads((APP/'data/official-arbitration-list.json').read_text(encoding='utf-8'))),89)
        self.assertEqual(len(json.loads((APP/'data/official-arbitration-appeals-districts.json').read_text(encoding='utf-8'))),32)
if __name__=='__main__':unittest.main()
