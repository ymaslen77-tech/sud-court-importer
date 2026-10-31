"""Acceptance checks for individual evidence in all 23 formerly basic district cards."""
import json
import re
import unittest
from pathlib import Path
from urllib.parse import urlsplit

APP=Path(__file__).resolve().parents[2]/'apps/web/app'
DIRECTORY=json.loads((APP/'data/moscow-official-minimum-registry.json').read_text(encoding='utf-8'))['records']
RESEARCH=json.loads((APP/'lib/moscow-court-dossiers.json').read_text(encoding='utf-8'))
INDIVIDUAL=json.loads((APP/'data/moscow-district-individual-dossiers.json').read_text(encoding='utf-8'))['records']
DETAIL=(APP/'courts/moscow/registry/[slug]/page.tsx').read_text(encoding='utf-8')
UI=(APP/'_components/moscow-district-individual-dossier.tsx').read_text(encoding='utf-8')
LIB=(APP/'lib/moscow-district-individual.ts').read_text(encoding='utf-8')

def norm(s):
 return re.sub(r'\s+',' ',s.lower().replace('ё','е')).strip()

class DistrictIndividualDossiers(unittest.TestCase):
 def test_all_23_legacy_gaps_get_distinct_real_official_sources(self):
  expanded={next(c['slug'] for c in DIRECTORY if norm(r['name']).startswith(norm(c['name']))) for r in RESEARCH}
  expected={c['slug'] for c in DIRECTORY if c['kind']=='general-district'}-expanded
  slugs={r['slug'] for r in INDIVIDUAL}
  self.assertEqual(len(INDIVIDUAL),23)
  self.assertEqual(len(slugs),23)
  self.assertEqual(slugs,expected)
  for r in INDIVIDUAL:
   with self.subTest(court=r['slug']):
    self.assertRegex(r['officialSlug'],r'^[a-z]+$')
    self.assertEqual(r['officialUrl'],'https://mos-gorsud.ru/rs/'+r['officialSlug'])
    for key in ('officialUrl','contactsSourceUrl'):
     uri=urlsplit(r[key])
     self.assertEqual((uri.scheme,uri.hostname),('https','mos-gorsud.ru'))
     self.assertTrue(uri.path.startswith('/rs/'+r['officialSlug']))
    self.assertEqual(r['sourceObservedOn'],'2026-10-31')
    self.assertIn(r['chairStatus'],('as_published','acting_as_published','conflicting_sources'))
    self.assertNotIn('cases',r)
    self.assertNotIn('judges',r)
    self.assertNotIn('portrait',r)

 def test_noninvented_phone_and_leadership_warnings(self):
  self.assertEqual(sum(bool(x['expeditionPhone']) for x in INDIVIDUAL),22)
  self.assertEqual(sum(bool(x['chairPublished']) for x in INDIVIDUAL),22)
  by_slug={x['slug']:x for x in INDIVIDUAL}
  self.assertIsNone(by_slug['simonovskiy']['chairPublished'])
  self.assertIsNone(by_slug['cheryomushkinskiy']['expeditionPhone'])
  self.assertTrue(by_slug['cheryomushkinskiy']['remarks'])
  self.assertNotEqual(by_slug['tushinskiy']['emailAsPublished'],'')
  self.assertNotEqual(by_slug['solntsevskiy']['emailAsPublished'],'')
  self.assertIn('emailConflict',UI)
  self.assertIn('не означает',UI)
  self.assertIn('needsArrivalCheck',UI)
  self.assertIn("profile.remarks.map",UI)

 def test_dossiers_use_existing_unique_routes_and_keep_noindex(self):
  self.assertIn('moscowDistrictIndividual(slug)',DETAIL)
  self.assertIn('<MoscowDistrictIndividualDossier court={court} profile={individual}',DETAIL)
  self.assertIn("if(slug==='moscow-city-court')return <MoscowCityCourtDossier court={court}/>;",DETAIL)
  self.assertIn("robots:{index:false,follow:true}",DETAIL)
  self.assertIn('mgsSeoRobots()',DETAIL)
  self.assertIn('moscowDistrictOfficialPages',UI)
  self.assertIn('moscowDistrictOfficialPages',LIB)
  self.assertIn('Официальные сервисы именно этого суда',UI)
  self.assertIn('/courts/moscow/registry/moscow-city-court/info/appeals',UI)

if __name__=='__main__':unittest.main()
