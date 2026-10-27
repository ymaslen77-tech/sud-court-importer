"""Public official-source references never claim to be a complete or verified court registry."""
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/"apps"/"web"/"app"


class OfficialReferenceCardsTests(unittest.TestCase):
    def test_record_source_provenance_and_no_fake_cases(self):
        source=(APP/"lib"/"official-reference-courts.ts").read_text(encoding="utf-8")
        self.assertIn("https://www.ksrf.ru/contacts.php",source)
        self.assertIn("Сенатская площадь",source)
        self.assertIn("https://kraevoy--alt.sudrf.ru/modules.php?name=sud",source)
        self.assertIn("altai-arbitration-court",source)
        self.assertIn("barnaul-garrison-court",source)
        self.assertIn("aleysky-city-court",source)
        self.assertIn("sourceUrl:",source)
        self.assertIn("casesUrl:",source)
        self.assertNotIn("verified_at:",source)
        self.assertNotIn("judges:[",source)
        self.assertEqual(source.count("judgesUrl:null"),5)
        self.assertEqual(len(re.findall(r"slug:'[^']+',name:",source)),5)

    def test_constitutional_scope_is_not_regional_and_no_zero_only_result(self):
        search=(APP/"search"/"page.tsx").read_text(encoding="utf-8")
        self.assertIn("constitutionalRegionConflict",search)
        self.assertIn("Конституционные (уставные) суды субъектов были упразднены",search)
        self.assertIn("constitutionalCourt",search)
        self.assertIn("officialReferenceMatches(q,kind,region)",search)
        self.assertIn("official.length>0",search)
        self.assertIn("'/search?region='+encodeURIComponent(region)+'&kind=general-regional'",search)
        self.assertIn("href={'/courts/reference/'+c.slug}",search)

    def test_individual_cards_have_map_facts_and_official_cases(self):
        path=APP/"courts"/"reference"/"[slug]"/"page.tsx"
        card=path.read_text(encoding="utf-8")
        for needle in ("<YandexCourtMap","court.address","court.phone","court.email",
                       "court.casesUrl","court.sourceUrl","court.officialUrl",
                       "robots:{index:false,follow:true}","не перенесены в нашу базу",
                       "не публикуются без отдельной сверки"):
            with self.subTest(needle=needle):
                self.assertIn(needle,card)

    def test_regional_and_category_navigation_links_exist(self):
        region=(APP/"courts"/"[region]"/"page.tsx").read_text(encoding="utf-8")
        kind=(APP/"courts"/"types"/"[kind]"/"page.tsx").read_text(encoding="utf-8")
        self.assertIn("officialReferences=OFFICIAL_REFERENCE_COURTS.filter(c=>c.region===region)",region)
        self.assertIn("officialReferences=OFFICIAL_REFERENCE_COURTS.filter(c=>c.kind===kind)",kind)
        self.assertIn("Суды с адресами",kind)
        self.assertIn("Суды с адресами",region)


if __name__=="__main__":
    unittest.main()
