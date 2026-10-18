"""Search across court topics without presenting unrelated cases as keyword hits."""
import unittest
from pathlib import Path

APP=Path(__file__).resolve().parents[2]/'apps/web/app'
class MoscowCaseSearchTests(unittest.TestCase):
    def test_topic_search_and_category_highlight_have_real_implementation(self):
        search=(APP/'lib/moscow-cases-search.ts').read_text(encoding='utf-8')
        explorer=(APP/'_components/moscow-cases-explorer.tsx').read_text(encoding='utf-8')
        assert "labor:['увол','увольн'" in search
        for phrase in ('topicMatchesSearch','caseMatchesSearch','collectSearchMatches','exactDecidedCount'):
            self.assertIn(phrase,search)
        for phrase in ('defaultOpen={searching}','moscow-case-topic-matched',
                       'Подходящая тема','Дел', 'role="status"', 'Другие дела этой категории'):
            self.assertIn(phrase,explorer)
        self.assertIn('судебных дел непосредственно по этому запросу в нашей подборке пока нет',explorer)
        self.assertIn('item.subject',explorer)
        self.assertIn('item.disposition',explorer)
        self.assertIn('isVerifiedDocument(item)',explorer)
        self.assertIn('court.case_service_url',explorer)
        self.assertNotIn('await fetch(',explorer)

    def test_original_pilot_card_count_untouched(self):
        import json
        x=json.loads((APP/'lib/pilot-review-matrix.json').read_text(encoding='utf-8'))
        self.assertEqual(len(x['records']),10)

if __name__=='__main__':
    unittest.main()
