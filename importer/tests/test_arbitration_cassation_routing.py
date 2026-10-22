"""Regression for arbitration cassation by judicial district, not physical location."""
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[2]/"apps/web/app"
class CassationRoutingTests(unittest.TestCase):
    def test_kabardino_balkaria_cassation(self):
        source=(ROOT/"lib/regional-arbitration.ts").read_text(encoding="utf-8")
        self.assertIn("'arbitration-district-north-caucasus'",source)
        self.assertIn("'region-07'",source)
        self.assertIn("(!kind||item.courtKind===kind)",source)
        self.assertIn("appellate.find",source)
        view=(ROOT/"_components/regional-arbitration-preview.tsx").read_text(encoding="utf-8")
        self.assertIn("кассационная инстанция",view)
        self.assertIn("Суд расположен в Краснодаре",view)
        results=(ROOT/"search/page.tsx").read_text(encoding="utf-8")
        self.assertIn("Арбитражная кассация",results)
if __name__=="__main__":unittest.main()
