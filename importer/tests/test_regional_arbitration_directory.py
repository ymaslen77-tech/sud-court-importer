"""The source-backed regional arbitration directory has unique names, coverage and honest review labels."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "apps/web/app"

class RegionalArbitrationDirectoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records = json.loads((APP / "data/regional-arbitration-index.json").read_text(encoding="utf-8"))
        cls.source = json.loads((APP / "data/official-arbitration-list.json").read_text(encoding="utf-8"))
        cls.regions = dict(re.findall(
            r"\['(\d{2})','([^']+)'\]",
            (APP / "lib/regions.ts").read_text(encoding="utf-8")
        ))
    def test_all_89_courts_come_from_existing_official_source_names(self):
        self.assertEqual(len(self.records), 89)
        self.assertEqual(len(self.source), 89)
        self.assertEqual(len({r['slug'] for r in self.records}),89)
        self.assertEqual(
            [(r["courtName"], r["courtKind"], r["sourceRecordUrl"]) for r in self.records],
            [(r["courtName"], r["courtKind"], r["sourceRecordUrl"]) for r in self.source]
        )
        self.assertTrue(all(r["editorialStatus"]=="unreviewed" for r in self.records))
        self.assertTrue(all(r["sourceRecordUrl"].startswith("https://arbitr.ru/")
                            for r in self.records))
    def test_every_region_has_at_least_one_sourced_name_without_fake_profiles(self):
        expected={"moscow" if code=="77" else "region-"+code for code in self.regions}
        observed={region for record in self.records for region in record["regions"]}
        self.assertEqual(len(expected),89)
        self.assertEqual(observed,expected)
        self.assertEqual(len({(region,record["slug"]) for record in self.records
                              for region in record["regions"]}),90)
        self.assertIn("region-47",next(x for x in self.records if x["slug"]=="arbitration-subject-78")["regions"])
        self.assertIn("region-83",next(x for x in self.records if x["slug"]=="arbitration-presence-83")["regions"])
    def test_display_separates_unreviewed_from_approved(self):
        page=(APP / "courts/[region]/page.tsx").read_text(encoding="utf-8")
        lookup=(APP / "search/page.tsx").read_text(encoding="utf-8")
        detail=(APP / "courts/[region]/[court]/page.tsx").read_text(encoding="utf-8")
        preview=(APP / "_components/regional-arbitration-preview.tsx").read_text(encoding="utf-8")
        self.assertIn("regionalArbitrationCourts(region)",page)
        self.assertIn("regionalArbitrationSearch(q,kind,region)",lookup)
        self.assertIn("regionalArbitrationCourt(p.region,p.court)",detail)
        self.assertIn("robots:{index:false,follow:true}",detail)
        self.assertIn("не прошёл редакционную приёмку",preview)
        self.assertIn("ещё не проверены",preview)
        moscow=(APP / "courts/moscow/page.tsx").read_text(encoding="utf-8")
        moscow_arbitration=(APP / "courts/moscow/arbitration/[slug]/page.tsx").read_text(encoding="utf-8")
        self.assertIn("regionalArbitrationCourts('moscow')",moscow)
        self.assertIn("regionalArbitrationHref('moscow',item.slug)",moscow)
        self.assertIn("regionalArbitrationCourt('moscow'",moscow_arbitration)
        self.assertIn("generateStaticParams()",moscow_arbitration)

if __name__=="__main__":
    unittest.main()
