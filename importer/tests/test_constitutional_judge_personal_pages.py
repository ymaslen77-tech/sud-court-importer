"""Source, identity and safe navigation contract for KSRF personal judge dossiers."""
from pathlib import Path
import re
import unittest

APP=Path(__file__).resolve().parents[2]/"apps"/"web"/"app"

class ConstitutionalJudgeDossierTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.profiles=(APP/"lib/constitutional-judge-profiles.ts").read_text(encoding="utf-8")
  cls.official=(APP/"lib/constitutional-court-data.ts").read_text(encoding="utf-8")
  cls.detail=(APP/"_components/constitutional-judge-profile.tsx").read_text(encoding="utf-8")
  cls.route=(APP/"judges/[region]/[slug]/page.tsx").read_text(encoding="utf-8")
  cls.directory=(APP/"judges/page.tsx").read_text(encoding="utf-8")
  cls.court=(APP/"_components/constitutional-court-dossier.tsx").read_text(encoding="utf-8")
  cls.local=(APP/"courts/reference/constitutional-court-rf/info/[topic]/page.tsx").read_text(encoding="utf-8")

 def test_all_official_roster_judges_have_unique_identifiable_profile(self):
  roster=re.findall(r"id:'([a-z]+)',name:'",self.official)
  profiles=re.findall(r"id:'([a-z]+)',slug:'([a-z-]+)'",self.profiles)
  self.assertEqual(len(roster),10)
  self.assertEqual(len(profiles),10)
  self.assertEqual(set(roster),{p[0] for p in profiles})
  self.assertEqual(len({p[1] for p in profiles}),10)
  self.assertIn("CONSTITUTIONAL_JUDGE_REGION='constitutional-court-rf'",self.profiles)
  self.assertIn("sourceCheckedAt:'2026-10-29'",self.profiles)

 def test_shared_judges_route_preserves_moscow_area_profiles(self):
  self.assertIn("return pushkinskyJudges.map",self.route)
  self.assertIn(".concat(constitutionalJudgeProfiles.map",self.route)
  self.assertIn("if(region===CONSTITUTIONAL_JUDGE_REGION)",self.route)
  self.assertIn("<ConstitutionalJudgePersonalPage judge={constitutional}/>",self.route)
  self.assertIn("if(!constitutional)notFound()",self.route)
  self.assertIn("robots:{index:false,follow:true}",self.route)
  self.assertIn("getPushkinskyJudge(slug)",self.route)

 def test_directory_search_and_both_court_rosters_link_profiles(self):
  for item in ("constitutionalMatches","constitutionalJudgeProfiles",
               "constitutionalJudgeProfileHref(judge.id)","matches.map",
               "judgeProfileHref(judge)"):
   self.assertIn(item,self.directory)
  for source in (self.court,self.local):
   self.assertIn("constitutionalJudgeProfileHref(j.id)",source)

 def test_dossiers_are_source_backed_not_personal_ratings(self):
  for item in ("judge.appointed","judge.education","judge.scholarship",
               "judge.career.map","judge.source","judge.portraitCredit",
               "официальный состав","не означают распределения конкретных дел",
               "не аттестованы","неподтверждённые отзывы"):
   self.assertIn(item,self.detail)
  for item in ("личные телефоны","домашние адреса","independent review"):
   if item=="independent review":continue
   self.assertIn(item,self.detail)
  self.assertNotIn("Личный рейтинг",self.detail)
  self.assertNotIn("CONSTITUTIONAL_CASES.filter",self.detail)

 def test_professional_history_is_substantive_for_each(self):
  self.assertEqual(self.profiles.count("education:'"),10)
  self.assertEqual(self.profiles.count("scholarship:'"),10)
  self.assertGreaterEqual(self.profiles.count("{period:"),35)
  for official in ("/about/judges/","/about/legalbases/FCLM/Article4.php"):
   self.assertIn(official,self.detail)

if __name__=="__main__": unittest.main()
