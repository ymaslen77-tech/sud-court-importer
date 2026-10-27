"""Navigation regression: all nine primary-source tiles open real local pages."""
import unittest
from pathlib import Path
import re

APP=Path(__file__).resolve().parents[2]/"apps"/"web"/"app"
BASE="/courts/reference/constitutional-court-rf/info"
EXPECTED={
    "judges","powers","composition","reception","complaint",
    "payment","history","apparatus","secretariat"
}

class ConstitutionalLocalLibraryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=(APP/"lib/constitutional-reference-library.ts").read_text(encoding="utf-8")
        cls.page=(APP/"courts/reference/constitutional-court-rf/info/[topic]/page.tsx").read_text(encoding="utf-8")
        cls.dossier=(APP/"_components/constitutional-court-dossier.tsx").read_text(encoding="utf-8")

    def test_every_evidence_tile_is_internal(self):
        names=set(re.findall(r"slug:'([a-z]+)',title:",self.data))
        self.assertEqual(names,EXPECTED)
        self.assertIn("CONSTITUTIONAL_REFERENCE_TOPICS.map",self.dossier)
        self.assertIn("CONSTITUTIONAL_REFERENCE_BASE+\"/\"+x.slug",self.dossier)
        self.assertNotIn("CONSTITUTIONAL_SOURCES.map",self.dossier)
        self.assertIn("getConstitutionalTopic((await params).topic)",self.page)
        self.assertIn("notFound()",self.page)
        self.assertIn("generateStaticParams()",self.page)
        self.assertIn("robots:{index:false,follow:true}",self.page)

    def test_each_topic_has_source_and_substantive_sections(self):
        self.assertEqual(self.data.count("sourceName:"),10) # type + nine entries
        self.assertGreaterEqual(self.data.count("heading:'"),18)
        self.assertIn("topic.sections.map",self.page)
        self.assertIn("section.paragraphs.map",self.page)
        self.assertIn("section.points.map",self.page)
        self.assertIn("id=\"primary-source\"",self.page)
        self.assertIn("href={topic.sourceUrl}",self.page)
        self.assertIn("href={CONSTITUTIONAL_REFERENCE_BASE+'/'+x.slug}",self.page)
        self.assertIn("27.10.2026",self.page)

    def test_judges_reception_secretariat_and_fees_real_content(self):
        self.assertIn("CONSTITUTIONAL_JUDGES.map",self.page)
        self.assertIn("CONSTITUTIONAL_SECRETARIAT.map",self.page)
        self.assertIn("<YandexCourtMap",self.page)
        self.assertIn("Галерная улица",self.page)
        self.assertIn("450 ₽",self.page)
        self.assertIn("6 750 ₽",self.page)
        self.assertIn("не воспроизводим внутри справочника банковские счета",self.data)
        self.assertIn("Федерального конституционного закона № 1-ФКЗ",self.data)
        self.assertIn("не являются самостоятельными судами",self.data)

    def test_no_duplicated_placeholders_in_reference_topics(self):
        self.assertNotIn("Здесь будет информация",self.data)
        self.assertNotIn("TODO",self.data)
        self.assertNotIn("В разработке",self.page)

if __name__=="__main__":
    unittest.main()
