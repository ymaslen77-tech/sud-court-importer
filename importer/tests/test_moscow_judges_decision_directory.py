"""Judge directory QA: only verified court+judge+case links; no unsupported decision trends."""
import json,re,unittest
from pathlib import Path
from urllib.parse import urlsplit
APP=Path(__file__).resolve().parents[2]/'apps/web/app'
def data(name):return json.loads((APP/'data'/name).read_text(encoding='utf-8'))['records']
ROSTERS=data('moscow-district-judges-samples.json')
LEGACY=data('moscow-legacy-judge-rosters.json')
BRIEFS=data('moscow-judicial-source-briefs.json')
CASES=data('moscow-judge-case-evidence.json')
MINIMUM=data('moscow-official-minimum-registry.json')
LIB=(APP/'lib/moscow-judge-directory.ts').read_text(encoding='utf-8')
SELECTOR=(APP/'_components/moscow-judges-explorer.tsx').read_text(encoding='utf-8')
LISTING=(APP/'courts/moscow/judges/page.tsx').read_text(encoding='utf-8')
PERSON=(APP/'courts/moscow/judges/[courtSlug]/[judgeSlug]/page.tsx').read_text(encoding='utf-8')
PROFILE=(APP/'_components/moscow-district-individual-dossier.tsx').read_text(encoding='utf-8')
MOSCOW=(APP/'courts/moscow/page.tsx').read_text(encoding='utf-8')
RESEARCH=(APP/'courts/moscow/[slug]/page.tsx').read_text(encoding='utf-8')
def norm(name):return re.sub(r'\s+',' ',name.replace('ё','е').lower()).strip()
class JudgeEvidenceAcceptance(unittest.TestCase):
 def test_301_unique_published_names_with_court_identity(self):
  people=[(r['slug'],n) for r in ROSTERS+LEGACY for n in r['judges']]
  people += [(r['slug'],p['name']) for r in BRIEFS for p in r['people']]
  self.assertEqual(len(people),335)
  self.assertEqual(len({(slug,norm(n)) for slug,n in people}),335)
  self.assertEqual(len({r['slug'] for r in ROSTERS}),20)
  self.assertEqual(len({r['slug'] for r in LEGACY}),3)
  self.assertEqual(sum(len(r['judges']) for r in LEGACY),34)
  self.assertTrue({'basmanny','lefortovskiy','presnenskiy'}=={r['slug'] for r in LEGACY})
  self.assertEqual(len({r['slug'] for r in BRIEFS}),3)
  courts={r['slug'] for r in MINIMUM}
  self.assertEqual(len(courts),36)
  self.assertTrue(all(slug in courts for slug,n in people))
  self.assertIn('moscowJudgeSlug',LIB)
  self.assertIn('MoscowOfficialCourtHref(court)',LIB)
  self.assertIn('official_assistant_reference',LIB)
  self.assertIn('legacyRosters.records',LIB)
  self.assertIn('judge.courtVisitNotice',PERSON)
 def test_officially_attributed_cases_are_not_fabricated_full_judgments(self):
  people={(slug,norm(name)) for slug,name in
      [(r['slug'],n) for r in ROSTERS+LEGACY for n in r['judges']]+
      [(r['slug'],p['name']) for r in BRIEFS for p in r['people']]}
  self.assertEqual(len(CASES),21)
  self.assertEqual(sum(x['status']=='outcome_recorded' for x in CASES),18)
  self.assertEqual(sum(x['status']=='pending' for x in CASES),3)
  self.assertEqual(len({(x['courtSlug'],x['number']) for x in CASES}),21)
  for row in CASES:
   with self.subTest(case=row['number']):
    self.assertIn((row['courtSlug'],norm(row['judgeName'])),people)
    self.assertEqual(row['evidenceLevel'],'official_case_list')
    self.assertEqual(row['judgeAttribution'],'judge_and_number_in_same_official_row')
    self.assertFalse(row['judicialActTextVerified'])
    self.assertNotIn('parties',row)
    self.assertTrue(re.fullmatch(r'(?:0[12]-\d+|3/[26]-\d+)/2026',row['number']))
    u=urlsplit(row['sourceUrl'])
    self.assertEqual(u.scheme,'https')
    self.assertIn(u.hostname,{'mos-gorsud.ru','www.mos-gorsud.ru','m.mos-gorsud.ru'})
    self.assertIn('/services/cases/',u.path)
    self.assertTrue(row['note'])
    if row['status']=='pending':
     self.assertIsNone(row['decisionDate'])
     self.assertEqual(row['outcome'],'Не установлено')
    else:
     self.assertRegex(row['decisionDate'],r'^2026-\d\d-\d\d$')
 def test_directory_filtering_and_personal_pages_are_accessible(self):
  self.assertIn('MoscowJudgesExplorer',LISTING)
  self.assertIn('MOSCOW_OFFICIAL_MINIMUM_COURTS.filter',LISTING)
  self.assertIn('MOSCOW_JUDGE_PROFILES',LISTING)
  self.assertIn('setCourt(e.target.value)',SELECTOR)
  self.assertIn('setJudge(e.target.value)',SELECTOR)
  self.assertIn('setCategory(e.target.value)',SELECTOR)
  self.assertIn("status==='all'||c.status===status",SELECTOR)
  self.assertIn('moscowJudgeHref(selected)',SELECTOR)
  self.assertIn("robots:{index:false,follow:true}",LISTING)
  self.assertIn("robots:{index:false,follow:true}",PERSON)
  self.assertIn('MOSCOW_JUDGE_PROFILES.map',PERSON)
  self.assertIn('moscowJudgeCases(courtSlug,judge.name)',PERSON)
  self.assertIn('moscowJudgeCaseCategories(cases)',PERSON)
  self.assertIn('moscowJudgeSlug(name)',PROFILE)
  self.assertIn('href="/courts/moscow/judges"',RESEARCH)
  self.assertIn('href="/courts/moscow/judges"',MOSCOW)
 def test_no_faked_statistics_or_outcome_inference(self):
  for key in ('Это не общее количество дел судьи','неполная выборка','полный текст'):
   self.assertIn(key.lower(),(SELECTOR+PERSON).lower())
  self.assertNotIn('fetch(',SELECTOR)
  self.assertNotIn('navigator.geolocation',SELECTOR)
  self.assertNotIn('Мотивировочная часть подтверждена',PERSON)
if __name__=='__main__':unittest.main()
