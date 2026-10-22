"""Prevent the empty research subset from hiding known arbitration cassation results."""
import unittest
from pathlib import Path

SEARCH=Path(__file__).resolve().parents[2]/"apps/web/app/search/page.tsx"

class ArbitrationSearchUiTests(unittest.TestCase):
    def test_direct_link_to_single_found_court(self):
        source=SEARCH.read_text(encoding="utf-8")
        self.assertIn("arbitration.length===1", source)
        self.assertIn("arbitration[0].courtName", source)
        self.assertIn("regionalArbitrationHref(region||arbitration[0].regions[0],arbitration[0].slug)",source)
    def test_irrelevant_old_research_zero_is_hidden_for_arbitration(self):
        source=SEARCH.read_text(encoding="utf-8")
        self.assertIn("(!kind||!kind.startsWith('arbitration-'))",source)
        self.assertIn("aria-labelledby=\"unreviewed-filters\"",source)
        self.assertIn("arbitration.length>0",source)

if __name__=="__main__":unittest.main()
