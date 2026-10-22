"""The national directory must search its existing Moscow profiles without pretending all Russia is covered."""
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/"apps/web/app"
class NationalCourtDirectoryTests(unittest.TestCase):
    def test_single_search_and_moscow_coverage(self):
        page=(APP/"courts/page.tsx").read_text(encoding="utf-8")
        search=(APP/"_components/court-search.tsx").read_text(encoding="utf-8")
        results=(APP/"search/page.tsx").read_text(encoding="utf-8")
        self.assertEqual(page.count("<CourtSearch compact />"),1)
        self.assertNotIn('<form className="court-advanced-search"',page)
        self.assertIn('href="/search"',page)
        self.assertIn('id="court-regions"',page)
        self.assertIn('href="/courts/moscow"',page)
        self.assertIn('research.map(item=>',page)
        self.assertIn('verifiedOthers.map(item=>',page)
        self.assertIn('awaiting.map(item=>',page)
        self.assertIn('Показать районные суды Москвы',page)
        self.assertEqual(page.count('Каталог по регионам'),1)
        self.assertNotIn('aria-labelledby="research-regions"',page)
        self.assertIn('Актуальные',page.replace('актуальные','Актуальные'))
        self.assertIn('ALL_REGIONS.map',search)
        self.assertIn('findRegion(requestedRegion)',results)
        self.assertIn("moscowCourts()",results)
        self.assertIn("'general-district'",results)
        self.assertIn("href={'/courts/moscow/'+c.slug}",results)
        self.assertIn('Это не полный реестр судов России',results)
        self.assertIn('verified',results)
        self.assertIn('researchOnly',results)
    def test_12_source_labeled_moscow_dossiers(self):
        import json
        entries=json.loads((APP/"lib/moscow-court-dossiers.json").read_text(encoding="utf-8"))
        self.assertEqual(len(entries),12)
        self.assertEqual(len({c["slug"] for c in entries}),12)
        self.assertTrue(all(c["editorial_status"]=="research_only" for c in entries))
if __name__=="__main__":
    unittest.main()
