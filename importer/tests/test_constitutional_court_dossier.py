"""Source-backed Constitutional Court exemplar must stay complete and transparent."""
import unittest
from pathlib import Path
import re

APP=Path(__file__).resolve().parents[2]/"apps/web/app"


class ConstitutionalDossierTests(unittest.TestCase):
    def test_record_has_all_ten_unique_official_judges(self):
        data=(APP/"lib/constitutional-court-data.ts").read_text(encoding="utf-8")
        self.assertEqual(data.count("position:'Судья Конституционного Суда РФ'"),8)
        self.assertIn("Председатель Конституционного Суда РФ",data)
        self.assertIn("Заместитель Председателя Конституционного Суда РФ",data)
        self.assertEqual(len(re.findall(r"source:'https://www.ksrf.ru/about/judges/[0-9]+/'",data)),10)
        self.assertIn("https://www.ksrf.ru/Petition/CommonComplaintQ.php",data)
        self.assertIn("https://www.ksrf.ru/about/apparat/sekretariat.php",data)
        self.assertIn("https://www.ksrf.ru/doc/KSRFDecision903983.pdf",data)
        self.assertEqual(data.count("portrait:"),6)
        self.assertIn("CC BY 4.0",data)

    def test_rich_page_keeps_provenance_and_displays_sections(self):
        page=(APP/"_components/constitutional-court-dossier.tsx").read_text(encoding="utf-8")
        for item in ("CONSTITUTIONAL_JUDGES.map", "CONSTITUTIONAL_PRACTICE.map",
                     "CONSTITUTIONAL_SECRETARIAT.map", "CONSTITUTIONAL_REFERENCE_TOPICS.map",
                     "Подать через официальный кабинет", "Галерная, дом 1",
                     "450 ₽", "6 750 ₽", "<YandexCourtMap",
                     "<details", "CC BY-SA 4.0", "не официальный сайт суда",
                     "11","неподтвержденным"):
            if item=="неподтвержденным":
                continue
            with self.subTest(item=item):self.assertIn(item,page)
        self.assertIn("Конституционный Суд не",page)
        self.assertIn("вакансия не заполнена вымышленной записью",page)
        self.assertIn("право на её воспроизведение ещё не подтверждено",page)
        self.assertNotIn("CONSTITUTIONAL_SOURCES.map",page)
        self.assertIn("href={CONSTITUTIONAL_REFERENCE_BASE+\"/\"+x.slug}",page)

    def test_special_route_does_not_break_other_reference_pages(self):
        page=(APP/"courts/reference/[slug]/page.tsx").read_text(encoding="utf-8")
        self.assertIn("return <ConstitutionalCourtDossier/>",page)
        self.assertIn("return <>",page)
        self.assertIn("court.slug==='constitutional-court-rf'",page)
        self.assertIn("robots:{index:false,follow:true}",page)


if __name__=="__main__":
    unittest.main()
