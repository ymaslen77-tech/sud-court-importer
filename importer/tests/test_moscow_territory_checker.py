"""Moscow jurisdiction checker must be honest about missing official boundaries."""
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/'apps/web/app'
class MoscowTerritoryUITests(unittest.TestCase):
    def test_no_unverified_production_rules(self):
        rules=json.loads((APP/'data/moscow-territorial-approved.json').read_text(encoding='utf-8'))
        self.assertEqual(rules['city'],'Москва')
        self.assertEqual(rules['approvedRules'],[])
        self.assertEqual(rules['sourcePortal'],'https://mos-gorsud.ru/territorial')

    def test_each_moscow_profile_uses_shared_resolver(self):
        page=(APP/'courts/moscow/[slug]/page.tsx').read_text(encoding='utf-8')
        component=(APP/'_components/moscow-territory-checker.tsx').read_text(encoding='utf-8')
        self.assertIn('<MoscowTerritoryChecker court={c}/>',page)
        self.assertIn('id="msk-jurisdiction"',page)
        self.assertIn('value="Москва"',component)
        self.assertIn('list={listId}',component)
        for control in ('street','house','corpus','structure'):
            self.assertIn('value={'+control+'}',component)
        self.assertIn('resolveMoscowTerritory',component)
        self.assertIn("result.kind==='match'",component)
        self.assertIn("result.kind==='other'",component)
        self.assertIn("moscow-territory-unknown",component.replace("moscow-territory-'+result.kind","moscow-territory-unknown"))
        self.assertIn("court.territory_service_url",component)
        self.assertIn('setResult(null)',component)
        self.assertNotIn("fetch(",component)
        self.assertNotIn("navigator.geolocation",component)

    def test_public_interface_discloses_empty_address_source_and_official_fallback(self):
        component=(APP/'_components/moscow-territory-checker.tsx').read_text(encoding='utf-8')
        for phrase in ('Наш локальный официальный адресный справочник пока пуст',
                       'moscow-territory-unavailable',
                       'Скопировать полный адрес','navigator.clipboard.writeText',
                       'Открыть официальный поиск',
                       'https://mos-gorsud.ru/territorial',
                       "result.kind==='match'","result.kind==='other'",
                       'result.reason'):
            self.assertIn(phrase,component)
        self.assertIn("copyState==='success'",component)
        self.assertNotIn('fetch(',component)

    def test_existing_pilot_courts_unchanged_and_new_noindex(self):
        pilots=json.loads((APP/'lib/pilot-review-matrix.json').read_text(encoding='utf-8'))
        self.assertEqual(len(pilots['records']),10)
        page=(APP/'courts/moscow/[slug]/page.tsx').read_text(encoding='utf-8')
        self.assertIn('robots:{index:false,follow:true}',page)
if __name__=='__main__':unittest.main()
