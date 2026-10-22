"""North Caucasus court detail should expose grounded sections without invented judge rosters."""
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]/"apps/web/app"
class NorthCaucasusCourtProfileTests(unittest.TestCase):
 def test_profile_and_route(self):
  view=(ROOT/"_components/north-caucasus-court-profile.tsx").read_text(encoding="utf-8")
  parent=(ROOT/"_components/regional-arbitration-preview.tsx").read_text(encoding="utf-8")
  for phrase in ["350063", "Рашпилевская", "201-34-00", "info@fassko.arbitr.ru",
    "Кабардино-Балкар", "статье 276 АПК", "статье 275 АПК", "kad.arbitr.ru",
    "my.arbitr.ru", "ras.arbitr.ru", "госпошлину", "Судьи и председатель", "Источники сведений"]:
   self.assertIn(phrase,view)
  self.assertIn("court.slug==='arbitration-district-north-caucasus'",parent)
  self.assertIn("<NorthCaucasusCourtProfile court={court} region={region}/>",parent)
  self.assertNotIn("Действующий состав судей:",view)
  self.assertIn("не публикуются",view)
if __name__=="__main__":unittest.main()
