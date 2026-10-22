"""Audit the reusable rich court-card layout and first independently sourced court pilot."""
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]/"apps/web/app"

class RichCourtCardTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.data=(ROOT/"lib/court-rich-records.ts").read_text(encoding="utf-8")
  cls.card=(ROOT/"_components/court-rich-dossier.tsx").read_text(encoding="utf-8")
  cls.matrix=(ROOT/"_components/court-dossier-completeness.tsx").read_text(encoding="utf-8")

 def test_17_judge_entries_are_source_labelled(self):
  rows=self.data.split("const judgeRows:",1)[1].split("];",1)[0]
  names=re.findall(r"^\s*\['([^']+)','[^']+','№ [^']+'\],?$",rows,re.M)
  self.assertEqual(len(names),17)
  self.assertEqual(len(set(names)),17)
  self.assertIn("source:composition",self.data)
  self.assertIn("02.07.2026",self.card)
  self.assertIn("24.07.2026",self.card)

 def test_pilot_has_two_official_buildings_and_sources(self):
  self.assertIn("мкр. Мамонтовка",self.data)
  self.assertIn("Оранжерейная",self.data)
  self.assertIn("pushkino.mo@sudrf.ru",self.data)
  self.assertIn("pushkino--mo.sudrf.ru",self.data)
  self.assertNotIn("mosoblsudi.ru",self.data)
  self.assertIn("ej.sudrf.ru",self.data)
  self.assertIn("modules.php?name=sud_delo",self.data)
  self.assertIn("временно сообщает о недоступности",self.data)

 def test_all_13_sections_and_rich_sections_have_links(self):
  self.assertEqual(self.matrix.count("key:'"),13)
  for marker in ["rich-addresses","rich-judges","rich-staff","rich-hours",
                 "rich-jurisdiction","rich-magistrates","rich-filing","rich-cases",
                 "rich-fees","rich-map","rich-sources"]:
   self.assertIn(marker,self.card)
  self.assertIn("court.judges.map",self.data)
  self.assertIn("court.serviceLinks.map",self.card)
  self.assertIn("source",self.matrix)

 def test_public_routes_have_opt_in_noindex_pilot_and_coverage(self):
  route=(ROOT/"courts/[region]/[court]/page.tsx").read_text(encoding="utf-8")
  region=(ROOT/"courts/[region]/page.tsx").read_text(encoding="utf-8")
  search=(ROOT/"search/page.tsx").read_text(encoding="utf-8")
  self.assertIn("pushkinskyCourt.slug",route)
  self.assertIn("robots:{index:false,follow:true}",route)
  self.assertIn("<CourtRichDossier court={pushkinskyCourt}/>",route)
  self.assertIn("pushkinskyCourt.name",region)
  self.assertIn("pushkinskyMatch",search)
  for file in ["research-court-preview.tsx","regional-arbitration-preview.tsx",
               "pilot-court-public.tsx","north-caucasus-cassation-dossier.tsx"]:
   self.assertIn("CourtDossierCompleteness",(ROOT/"_components"/file).read_text(encoding="utf-8"))
  self.assertIn("CourtDossierCompleteness",
   (ROOT/"courts/moscow/[slug]/page.tsx").read_text(encoding="utf-8"))

if __name__=="__main__":unittest.main()
