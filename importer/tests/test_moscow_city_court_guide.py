"""Moscow City Court research guide: eight real internal topics, valid sources and no click wall."""
import re
import unittest
from pathlib import Path

APP=Path(__file__).resolve().parents[2]/'apps/web/app'
GUIDE=(APP/'lib/moscow-city-court-guide.ts').read_text(encoding='utf-8')
DOSSIER=(APP/'_components/moscow-city-court-dossier.tsx').read_text(encoding='utf-8')
TOPIC=(APP/'courts/moscow/registry/moscow-city-court/info/[topic]/page.tsx').read_text(encoding='utf-8')
DETAIL=(APP/'courts/moscow/registry/[slug]/page.tsx').read_text(encoding='utf-8')

class MoscowCityCourtGuideTests(unittest.TestCase):
 def test_eight_distinct_researched_topics(self):
  slugs=re.findall(r"slug:'([a-z]+)'",GUIDE)
  self.assertEqual(slugs,['jurisdiction','competence','filing','cases','appeals','contacts','fees','structure'])
  self.assertIn('generateStaticParams()',TOPIC)
  self.assertIn('MGS_GUIDE_TOPICS.map(topic=>({topic:topic.slug}))',TOPIC)
  self.assertIn('mgsGuideTopic(slug)',TOPIC)
  self.assertIn('mgsGuideHref(topic.slug)',DOSSIER)
  self.assertIn('mgsGuideHref(s)',TOPIC)

 def test_mgs_keeps_single_canonical_registry_entry(self):
  self.assertIn("if(slug==='moscow-city-court')return <MoscowCityCourtDossier court={court}/>;",DETAIL)
  self.assertIn("robots:moscowDistrictSeoRobots()",DETAIL)
  self.assertIn("robots:mgsSeoRobots()",TOPIC)
  self.assertIn('MGS_BASE',TOPIC)
  self.assertIn('Московский городской суд',DOSSIER)

 def test_court_level_and_postal_discrepancy_explicit(self):
  self.assertIn('районным судам Москвы',DOSSIER)
  self.assertIn('не',DOSSIER)
  self.assertIn('107076',DOSSIER)
  self.assertIn('107996',DOSSIER)
  self.assertIn('Фридриха Энгельса',DOSSIER)
  self.assertIn('не для процессуальной подачи',DOSSIER)
  self.assertIn('не подменяет процессуальную подачу',GUIDE)
  self.assertIn('инстанцию',GUIDE)

 def test_official_sources_are_direct_not_click_gated(self):
  self.assertIn("territory:'https://mos-gorsud.ru/territorial'",GUIDE)
  self.assertIn("contacts:'https://mos-gorsud.ru/mgs/help/contacts'",GUIDE)
  self.assertIn("competence:'https://mos-gorsud.ru/mgs/info/jurisdiction'",GUIDE)
  self.assertIn('target="_blank" rel="noopener noreferrer"',TOPIC)
  self.assertIn('не ограничивает доступ',TOPIC)
  self.assertIn('MGS_OFFICIAL.territory',DOSSIER)
  self.assertIn('firstSteps.map',DOSSIER)

if __name__=='__main__':unittest.main()
