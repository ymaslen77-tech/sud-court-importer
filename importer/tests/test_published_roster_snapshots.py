"""Published judge rosters are dated observations, not current appointments."""
import json
from pathlib import Path
from urllib.parse import urlsplit
import unittest

ROOT=Path(__file__).resolve().parents[2]/'apps/web/app'
DATA=ROOT/'lib/published-roster-snapshots.json'

class PublishedRosterTests(unittest.TestCase):
    def test_rosters_are_official_and_dated_and_not_claimed_current(self):
        records=json.loads(DATA.read_text(encoding='utf8'))
        self.assertEqual(set(records),{'54AJ0005','54OS0000','54RS0002','54RS0004'})
        self.assertEqual(sum(len(g['people']) for x in records.values() for g in x['snapshot']['groups']),123)
        self.assertEqual(sum(len(g['people']) for g in records['54AJ0005']['snapshot']['groups']),22)
        self.assertEqual(sum(len(g['people']) for g in records['54OS0000']['snapshot']['groups']),77)
        self.assertEqual(sum(len(g['people']) for g in records['54RS0002']['snapshot']['groups']),12)
        self.assertEqual(sum(len(g['people']) for g in records['54RS0004']['snapshot']['groups']),12)
        for code,record in records.items():
            self.assertEqual(code,record['court_code'])
            self.assertIs(record['current_authority_confirmed'],False)
            self.assertRegex(record['observed_on'],r'^2026-10-\d\d$')
            url=urlsplit(record['snapshot']['source_url'])
            self.assertEqual(url.scheme,'https')
            self.assertTrue(url.hostname.endswith('.sudrf.ru'))
            self.assertTrue(record['snapshot']['source_updated_on'].startswith('2026-'))
            names=[p[0] for g in record['snapshot']['groups'] for p in g['people']]
            self.assertEqual(len(names),len(set(names)),code)
            for group in record['snapshot']['groups']:
                for name,role,act in group['people']:
                    self.assertGreaterEqual(len(name.split()),3)
                    self.assertTrue(role.strip())
                    self.assertRegex(act,r'№\s?\d+\b')

    def test_leadership_newer_publication_supersedes_obsolete_source(self):
        leader=json.loads(DATA.read_text())['54AJ0005']['leadership']
        self.assertEqual(leader['source_updated_on'],'2026-06-23')
        self.assertIn('90КД/67',leader['historical_observation'])
        self.assertIn('Сумачакова Наталья',leader['historical_observation'])
        self.assertIn('предыдущей редакции',leader['supersession_note'])
        self.assertIn('Знаменщиков',leader['supersession_note'])

    def test_renders_in_place_without_live_roster_claim(self):
        parent=(ROOT/'_components/pilot-court-public.tsx').read_text()
        child=(ROOT/'_components/published-court-roster.tsx').read_text()
        self.assertIn('<PublishedCourtRoster code={court.code}/>',parent)
        self.assertIn('pilot-roster-publication',parent)
        self.assertIn('id="pilot-roster-publication"',child)
        self.assertIn('не подтверждение действующих полномочий сегодня',child)
        self.assertIn('record.current_authority_confirmed!==false',child)
        self.assertNotIn('fetch(',child)

if __name__=='__main__':
    unittest.main()
