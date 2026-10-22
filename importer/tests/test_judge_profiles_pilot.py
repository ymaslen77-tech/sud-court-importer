"""Source, route and disclosure checks for the first judge dossiers."""
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]/"apps/web/app"

class JudgeProfileTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.data=(ROOT/"lib/judge-dossiers.ts").read_text(encoding="utf-8")
  cls.detail=(ROOT/"judges/[region]/[slug]/page.tsx").read_text(encoding="utf-8")
  cls.directory=(ROOT/"judges/page.tsx").read_text(encoding="utf-8")
  cls.court=(ROOT/"_components/court-rich-dossier.tsx").read_text(encoding="utf-8")

 def test_bazyleva_official_role_and_four_appointments(self):
  for phrase in ["Базылева Татьяна Анатольевна","2016-04-28","2019-07-18",
                 "2022-12-07","2024-11-14","№ 981","№ 892","№ 345","№ 3/164-П"]:
   self.assertIn(phrase,self.data)
  self.assertIn("official_court",self.data)
  self.assertIn("secondary_reference",self.data)
  self.assertIn("legal_text_secondary",self.data)
  self.assertIn("pushkino--mo.sudrf.ru",self.data)

 def test_examples_are_only_official_case_links_not_full_statistics(self):
  self.assertIn("11-2/2025",self.data)
  self.assertIn("11-119/2024",self.data)
  self.assertIn("case_uid=",self.data)
  self.assertIn("Примеры судебных дел не являются статистикой",self.detail)
  self.assertIn("Без повторной проверки кадровых актов",self.detail)

 def test_all_court_roster_names_get_deterministic_links(self):
  self.assertIn("pushkinskyCourt.judges.map",self.data)
  self.assertIn("judgeForName(p.name)",self.court)
  self.assertIn("judgeProfileHref",self.court)
  self.assertIn("matches.map",self.directory)
  self.assertIn("judgeProfileHref(judge)",self.directory)
  self.assertIn("generateStaticParams()",self.detail)
  self.assertIn("return pushkinskyJudges.map",self.detail)
  self.assertIn("robots:{index:false,follow:true}",self.detail)
  self.assertIn("'я':'ya'",self.data)
  self.assertIn("'ь':''",self.data)

 def test_privacy_and_provenance_controls(self):
  self.assertIn("не являются личными контактами судьи",self.detail)
  self.assertIn("не воспроизводятся целиком из сторонних каталогов",self.detail)
  self.assertIn("неподтверждённые отзывы",self.detail)
  self.assertIn("Вторичный источник",self.detail)

if __name__=="__main__":unittest.main()
