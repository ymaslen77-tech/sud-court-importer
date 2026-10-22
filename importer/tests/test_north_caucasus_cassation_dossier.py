"""Source integrity and public content safety for North Caucasus arbitration cassation dossier."""
from pathlib import Path
import json
import unittest
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[2]/"apps/web/app"
class NorthCaucasusCassationDossierTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/"data/north-caucasus-cassation-dossier.json").read_text(encoding="utf-8"))
        cls.cassation=json.loads((ROOT/"data/arbitration-cassation-jurisdiction.json").read_text(encoding="utf-8"))
        cls.view=(ROOT/"_components/north-caucasus-cassation-dossier.tsx").read_text(encoding="utf-8")
        cls.route=(ROOT/"courts/[region]/[court]/page.tsx").read_text(encoding="utf-8")

    def test_court_identity_matches_existing_jurisdiction(self):
        row=next(x for x in self.cassation if x["slug"]==self.data["slug"])
        self.assertEqual(self.data["courtName"],row["courtName"])
        self.assertEqual(self.data["jurisdictions"],row["regions"])
        self.assertEqual(len(row["regions"]),11)
        self.assertIn("region-07",row["regions"])
        self.assertIn("region-23",row["regions"])
        self.assertEqual(self.data["courtClassCode"],"Ф08")
        self.assertEqual(row["contactSourceUrl"],self.data["contactDirectorySource"])
        self.assertNotIn("krasnodar-leninsky",row["contactSourceUrl"])

    def test_each_source_url_is_https_and_known_court_services(self):
        urls=[self.data[k] for k in (
            "officialSite","contactDirectorySource","leaderSource","territorialLaw",
            "supremePlenum","procedureLaw","filingLaw","deadlineLaw","taxLaw","fullCourtList")]
        urls += [s["url"] for s in self.data["publicSystems"]]
        permitted={"fassko.arbitr.ru","www.consultant.ru","cdep.ru","arbitr.ru",
                   "kad.arbitr.ru","rad.arbitr.ru","ras.arbitr.ru","my.arbitr.ru",
                   "recess.arbitr.ru","guard.arbitr.ru"}
        self.assertTrue(all(urlparse(x).scheme=="https" and urlparse(x).hostname in permitted for x in urls))
        self.assertEqual(len(self.data["publicSystems"]),6)

    def test_no_fake_judges_cases_or_gps_and_no_unverified_indexing(self):
        self.assertIn("Захаров Владимир Викторович",self.data["leader"])
        self.assertEqual(self.data["sourceReviewDate"],"2026-10-22")
        self.assertIn("map-widget/v1/",self.view)
        self.assertIn("а не отображаются неподтверждённые GPS-координаты",self.view)
        self.assertIn("Полная локальная выгрузка дел",self.view)
        self.assertIn("Список остальных действующих судей",self.view)
        self.assertIn("Банковские реквизиты не подставляются автоматически",self.view)
        self.assertIn("court==='arbitration-district-north-caucasus'",self.route)
        self.assertIn("return <NorthCaucasusCassationDossier region={p.region}/>",self.route)
        self.assertIn("robots:{index:false,follow:true}",self.route)
        for marker in ("#nc-contacts","#nc-map","#nc-territory","#nc-filing",
                       "#nc-fee","#nc-judges","#nc-cases","#nc-sources"):
            self.assertIn(marker,self.view)

if __name__=="__main__":unittest.main()
