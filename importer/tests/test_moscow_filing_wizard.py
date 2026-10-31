"""A filing questionnaire must drive real branching, produce safe results, and replace the six static cards."""
from pathlib import Path
import unittest
APP=Path(__file__).resolve().parents[2]/'apps/web/app'
WIZARD=(APP/'_components/moscow-filing-wizard.tsx').read_text(encoding='utf-8')
RICH=(APP/'courts/moscow/[slug]/page.tsx').read_text(encoding='utf-8')
GUIDE=(APP/'_components/moscow-district-registry-guide.tsx').read_text(encoding='utf-8')
TOPIC=(APP/'courts/moscow/registry/[slug]/info/[topic]/page.tsx').read_text(encoding='utf-8')
CSS=(APP/'globals.css').read_text(encoding='utf-8')

class MoscowFilingWizardTests(unittest.TestCase):
 def test_wizard_renders_in_all_district_profiles_and_topic(self):
  self.assertIn("<MoscowFilingWizard courtName={c.name} officialUrl={c.official_url} caseSearchUrl={c.case_service_url}/>",RICH)
  self.assertNotIn("const stages=[",RICH)
  self.assertIn("id=\"msk-filing\"",RICH)
  self.assertIn("<MoscowFilingWizard courtName={court.name}",GUIDE)
  self.assertIn("moscowDistrictIndividual(court.slug)?.officialUrl",GUIDE)
  self.assertIn("<MoscowFilingWizard courtName={court.name} officialUrl={official.overview}",TOPIC)
 def test_goal_specific_questions_and_end_result(self):
  for text in ("'use client'","useState<Answers>","filingQuestions(answers)","filingResult(answers,courtName)",
               "chosen(question.id,o.value)","setCompleted(true)","setStep(step-1)",
               "setAnswers({});setStep(0);setCompleted(false)"):
   self.assertIn(text,WIZARD)
  for goal in ("'claim'","'appeal'","'motion'","'information'"):
   self.assertIn(goal,WIZARD)
  for kind in ("'civil'","'public'","'criminal'","'offence'","'business'","'unsure'"):
   self.assertIn(kind,WIZARD)
  for field in ("id:'court'","id:'actor'","id:'channel'","id:'copies'"):
   self.assertIn(field,WIZARD)
 def test_legal_routing_is_conditional_and_never_auto_filing(self):
  for phrase in ("статьям 131–132 ГПК РФ","статьёй 132 ГПК РФ","КАС РФ",
    "КоАП РФ","УПК РФ","АПК РФ","арбитражному","Вы указали другой суд",
    "Сроки обжалования существенно различаются",
    "специальных полномочий на подписание","электронную подпись","результат носит справочный"):
   self.assertIn(phrase.lower(),WIZARD.lower())
  self.assertIn("https://mos-gorsud.ru/territorial",WIZARD)
  self.assertIn("https://mos-gorsud.ru/lk",WIZARD)
  self.assertIn("Ничего вводить о себе не нужно",WIZARD)
  self.assertNotIn("fetch(",WIZARD)
  self.assertNotIn("localStorage",WIZARD)
  self.assertNotIn("document.cookie",WIZARD)
  self.assertNotIn("navigator.geolocation",WIZARD)
 def test_accessibility_and_responsive_layout(self):
  for fragment in ("type=\"button\"","aria-live=\"polite\"","aria-label=",
                   "className=\"moscow-filing-option\"","Начать заново","← Назад"):
   self.assertIn(fragment,WIZARD)
  for fragment in (".moscow-filing-wizard{",".moscow-filing-progress",
                   "@media(max-width:710px)",".moscow-filing-option:focus-visible",
                   "@media(prefers-reduced-motion:reduce)"):
   self.assertIn(fragment,CSS)
if __name__=='__main__':unittest.main()
