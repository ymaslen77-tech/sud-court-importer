"""Arbitration cassation search must follow court districts, not physical location."""
import json
import re
import unittest
from pathlib import Path

APP=Path(__file__).resolve().parents[2]/"apps/web/app"
class CassationDistrictTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.districts=json.loads((APP/"data/arbitration-cassation-jurisdiction.json").read_text(encoding="utf-8"))
        cls.original=json.loads((APP/"data/official-arbitration-appeals-districts.json").read_text(encoding="utf-8"))
        cls.regions={
            ("moscow" if code=="77" else "region-"+code)
            for code in re.findall(r"\['(\d{2})','[^']+'\]",(APP/"lib/regions.ts").read_text(encoding="utf-8"))
        }

    def test_all_ten_official_arbitration_districts_and_disjoint_coverage(self):
        source_names={
            e["courtName"] for e in self.original if e["courtKind"]=="arbitration-district"
        }
        self.assertEqual(len(source_names),10)
        self.assertEqual(len(self.districts),10)
        self.assertEqual({e["courtName"] for e in self.districts},source_names)
        self.assertEqual(len({d["slug"] for d in self.districts}),10)
        self.assertTrue(all(d["courtKind"]=="arbitration-district" for d in self.districts))
        self.assertTrue(all("cons_doc_LAW_6510" in d["jurisdictionLawUrl"] for d in self.districts))
        memberships=[region for district in self.districts for region in district["regions"]]
        self.assertEqual(len(memberships),len(self.regions))
        self.assertEqual(set(memberships),self.regions)

    def test_kabardino_balkaria_maps_to_north_caucasus_not_zero(self):
        results=[d for d in self.districts if "region-07" in d["regions"]]
        self.assertEqual(len(results),1)
        d=results[0]
        self.assertEqual(d["courtName"],"Арбитражный суд Северо-Кавказского округа")
        self.assertEqual(d["slug"],"arbitration-district-north-caucasus")
        self.assertEqual(d["officialCourtUrl"],"https://fassko.arbitr.ru")
        self.assertIn("Рашпилевская",d["address"])
        self.assertIn("cons_doc_LAW_56549",d["contactSourceUrl"])

    def test_search_respects_court_type_and_displays_match_not_absence(self):
        lib=(APP/"lib/regional-arbitration.ts").read_text(encoding="utf-8")
        search=(APP/"search/page.tsx").read_text(encoding="utf-8")
        detail=(APP/"courts/[region]/[court]/page.tsx").read_text(encoding="utf-8")
        preview=(APP/"_components/regional-arbitration-preview.tsx").read_text(encoding="utf-8")
        self.assertIn("...cassation as RegionalArbitrationName[]",lib)
        self.assertIn("['arbitration-subject','arbitration-district']",lib)
        self.assertIn("item.courtKind===kind",lib)
        self.assertIn("regionalArbitrationSearch(q,kind,region)",search)
        self.assertIn("Ниже найден подходящий суд",search)
        self.assertIn("regionalArbitrationCourt(p.region,p.court)",detail)
        self.assertIn("court.jurisdictionLawUrl",preview)
        self.assertIn("court.contactSourceUrl",preview)
        self.assertIn("robots:{index:false,follow:true}",detail)

if __name__=="__main__":
    unittest.main()
