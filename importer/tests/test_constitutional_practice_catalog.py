"""Editorial and navigation safeguards for Constitutional Court decision pages."""
import re
import unittest
from pathlib import Path

APP=Path(__file__).resolve().parents[2]/"apps"/"web"/"app"
BASE=APP/"courts"/"reference"/"constitutional-court-rf"
class ConstitutionalPracticeTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.data=(APP/"lib"/"constitutional-practice.ts").read_text(encoding="utf-8")
  cls.catalog=(APP/"_components"/"constitutional-practice-catalog.tsx").read_text(encoding="utf-8")
  cls.detail=(BASE/"practice"/"[slug]"/"page.tsx").read_text(encoding="utf-8")
  cls.index=(BASE/"practice"/"page.tsx").read_text(encoding="utf-8")
  cls.positions=(BASE/"positions"/"page.tsx").read_text(encoding="utf-8")
  cls.resources=(BASE/"resources"/"page.tsx").read_text(encoding="utf-8")
  cls.dossier=(APP/"_components"/"constitutional-court-dossier.tsx").read_text(encoding="utf-8")
  cls.topic=(BASE/"info"/"[topic]"/"page.tsx").read_text(encoding="utf-8")

 def test_cases_unique_and_honestly_source_backed(self):
  slugs=re.findall(r"slug:'([a-z0-9-]+)',number:'(\d+-П)',year:(\d{4})",self.data)
  self.assertGreaterEqual(len(slugs),10)
  self.assertEqual(len(set(x[0] for x in slugs)),len(slugs))
  self.assertEqual(len(set((x[1],x[2]) for x in slugs)),len(slugs))
  sources=re.findall(r"source:'(https://[^']+)'",self.data)
  self.assertEqual(len(sources),len(slugs))
  self.assertTrue(all(s.startswith("https://www.ksrf.ru/") for s in sources))
  self.assertIn('findConstitutionalCase=(slug:string)',self.data)
  self.assertIn('CONSTITUTIONAL_THEMES',self.data)

 def test_catalog_search_filters_and_accessibility(self):
  for element in ('type="search"','type="search"','role="status"',
                  'CONSTITUTIONAL_THEMES.map','CONSTITUTIONAL_CASES.filter',
                  "Link href={base+'/'+c.slug}"):
   self.assertIn(element,self.catalog)
  self.assertIn('aria-live="polite"',self.catalog)

 def test_decision_routes_have_legal_sources_and_backlinks(self):
  for source in (self.detail,self.index,self.positions,self.resources):
   self.assertIn('metadata',source.lower())
   self.assertIn('robots:{index:false,follow:true}',source)
   self.assertIn('courts/reference/constitutional-court-rf',source)
  for field in ('c.norm','c.position','c.result','c.issue','c.source',
                'findConstitutionalCase','notFound()','generateStaticParams()',
                "documents/complaint"):
   self.assertIn(field,self.detail)

 def test_reference_pages_and_dossier_crosslinked(self):
  for path in ('/practice','/positions','/resources'):
   self.assertIn(path,self.dossier)
   self.assertIn(path,self.topic)
  self.assertNotIn('CONSTITUTIONAL_PRACTICE.map',self.dossier)
  self.assertIn('CONSTITUTIONAL_CASES.slice(0,6).map',self.dossier)

 def test_verified_outcomes_are_not_left_as_unknown(self):
  for expected in (
   "Статья 322 ГК РФ признана не противоречащей Конституции",
   "Производство в отношении статьи 1080 ГК РФ прекращено",
   "Пункт 3 статьи 234 ГК РФ признан неконституционным",
   "До изменения закона единовременные выплаты индексируются",
   "Статья 15 и пункт 1 статьи 1064 ГК РФ признаны не противоречащими Конституции",
   "предварительно выплачивается или вносится на депозит нотариуса"
  ):
   with self.subTest(expected=expected):
    self.assertIn(expected,self.data)

 def test_official_statistics_sources_are_linked_not_fake_live_stats(self):
  for link in ('/Decision/generalization/','/Decision/Statisticses.php','/Decision/lp/',
               '/Decision/extsearch.php'):
   self.assertIn(link,self.resources+self.catalog)
  self.assertIn('не обновляются автоматически',self.resources)

if __name__=="__main__": unittest.main()
