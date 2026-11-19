"""Eight useful internal pages for all 35 source-attributed district courts."""
import json,unittest,re
from pathlib import Path
APP=Path(__file__).resolve().parents[2]/'apps/web/app'
COURTS=[x for x in json.loads((APP/'data/moscow-official-minimum-registry.json').read_text(encoding='utf-8'))['records'] if x['kind']=='general-district']
TOPICS=(APP/'lib/moscow-district-topics.ts').read_text(encoding='utf-8')
PAGE=(APP/'courts/moscow/registry/[slug]/info/[topic]/page.tsx').read_text(encoding='utf-8')
GUIDE=(APP/'_components/moscow-district-registry-guide.tsx').read_text(encoding='utf-8')
REGISTRY=(APP/'courts/moscow/registry/[slug]/page.tsx').read_text(encoding='utf-8')
ROSTERS=json.loads((APP/'data/moscow-district-judges-samples.json').read_text(encoding='utf-8'))['records']

class MoscowDistrictTopicRoutesTests(unittest.TestCase):
 def test_eight_unique_topics_and_280_static_routes(self):
  slugs=re.findall(r"slug:'([a-z]+)',title:",TOPICS)
  self.assertEqual(slugs,['jurisdiction','competence','filing','cases','appeal','fees','judges','faq'])
  self.assertEqual(len(COURTS)*len(slugs),280)
  self.assertIn("MOSCOW_OFFICIAL_MINIMUM_COURTS.filter",PAGE)
  self.assertIn("MOSCOW_DISTRICT_TOPICS.map",PAGE)
  self.assertIn("export const dynamicParams=false",PAGE)
  self.assertIn("if(!court||!topic||!official||court.kind!=='general-district')notFound();",PAGE)
  self.assertIn("robots:{index:false,follow:true}",PAGE)
  self.assertIn("alternates:{canonical:url}",PAGE)
 def test_sources_and_valid_interlinking(self):
  self.assertIn("MoscowDistrictAddressLookup",PAGE)
  self.assertIn("moscowDistrictTopicNext(topic.slug)",PAGE)
  self.assertIn("moscowDistrictTopicHref(slug,next.slug)",PAGE)
  self.assertIn("moscowJudgeRoster(slug)",PAGE)
  self.assertIn("moscowDistrictOfficialPagesBySlug(slug)",PAGE)
  self.assertIn("MoscowOfficialCourtHref(court)",PAGE)
  self.assertIn("moscowCourtPracticalFacts(slug)",PAGE)
  self.assertIn("moscowCourtCaseExamples(slug)",PAGE)
  self.assertIn("moscowJudicialSourceBrief(slug)",PAGE)
  self.assertIn("Официальная информация суда",PAGE)
  self.assertIn("href={moscowDistrictTopicHref(court.slug,id)}",GUIDE)
  self.assertIn("проверить подсудность",GUIDE)
  self.assertIn("if(detailed!==('/courts/moscow/registry/'+court.slug))permanentRedirect(detailed);",REGISTRY)
 def test_judge_sources_have_correct_exact_official_suffix(self):
  self.assertEqual(len(ROSTERS),20)
  for r in ROSTERS:
   self.assertEqual(r["sourceUrl"],"https://mos-gorsud.ru/rs/"+r["officialSlug"]+"/structure/judges")
if __name__=='__main__':unittest.main()
