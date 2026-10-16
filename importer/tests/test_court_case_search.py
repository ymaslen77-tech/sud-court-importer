"""Public case search must use only real same-day records and official case pages."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[2]/"apps/web/app"

class CourtCaseSearchTests(unittest.TestCase):
 def read_case_search(self):
  return (ROOT/'_components/court-case-search.tsx').read_text(encoding='utf8')
 def test_official_target_within_court(self):
  source=(ROOT/"_components/court-case-search.tsx").read_text(encoding="utf8")
  self.assertIn("url.hostname.endsWith('.sudrf.ru')",source)
  self.assertIn("url.pathname!=='/modules.php'",source)
  self.assertIn("result.searchParams.set('name_op','sf')",source)
  self.assertIn("rel=\"noopener noreferrer\"",source)
  self.assertIn("hit.url",source)
  self.assertIn("Официальная карточка дела",source)
 def test_search_never_claims_full_registry_results(self):
  source=(ROOT/"_components/court-case-search.tsx").read_text(encoding="utf8")
  self.assertIn("report.state==='available'",source)
  self.assertIn("report.hearings.filter(",source)
  self.assertIn("Сегодняшний список дел недоступен",source)
  self.assertIn("В сегодняшнем расписании совпадений нет",source)
  self.assertIn("Полный реестр дел пока не синхронизирован",source)
  self.assertIn("официальную форму суда",source)
  self.assertNotIn("fetch(",source)
  self.assertNotIn("localStorage",source)
 def test_visible_today_and_search_navigation(self):
  today=(ROOT/"_components/court-today-hearings.tsx").read_text(encoding="utf8")
  card=(ROOT/"_components/pilot-court-public.tsx").read_text(encoding="utf8")
  self.assertIn("<CourtCaseSearch report={report}/>",today)
  self.assertIn('href="#pilot-case-search"',card)
  self.assertIn('id="pilot-case-search"',self.read_case_search())
  self.assertIn("Asia/Novosibirsk",today)
  self.assertIn("Asia/Omsk",today)
  self.assertIn("h.url",today)
 def test_sensitive_parties_not_copied(self):
  source=(ROOT/"_components/court-case-search.tsx").read_text(encoding="utf8")
  for term in ("partyName","defendant","caseText","charges"):
   self.assertNotIn(term,source)

if __name__=="__main__":
 unittest.main()
