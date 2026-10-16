"""Release policy for source-based local useful court content."""
import json
from pathlib import Path
import re
import unittest
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/'apps/web/app'
PUBLIC={x['external_code'] for x in json.loads((APP/'lib/pilot-review-matrix.json').read_text())['records']}

class PilotLocalFactTests(unittest.TestCase):
    def test_all_ten_have_real_official_sources_and_facts(self):
        data=json.loads((APP/'lib/pilot-practical-source-facts.json').read_text())
        self.assertEqual(set(data),PUBLIC)
        self.assertEqual(sum(len(x['items']) for x in data.values()),26)
        for code,record in data.items():
            with self.subTest(code=code):
                u=urlsplit(record['source_url'])
                self.assertEqual(u.scheme,'https')
                self.assertTrue(u.hostname=='sudrf.ru' or u.hostname.endswith('.sudrf.ru'))
                self.assertEqual(record['editorially_verified_current'],False)
                self.assertRegex(record['researched_on'],r'^20\d\d-\d\d-\d\d$')
                self.assertGreaterEqual(len(record['items']),2)
                self.assertEqual(len({x['title'] for x in record['items']}),len(record['items']))
                for item in record['items']:
                    self.assertGreater(len(item['description']),60)
                    self.assertNotIn('неограниченно',item['description'].lower())

    def test_new_department_numbers_are_labelled_as_publication_research(self):
        departments=json.loads((APP/'lib/pilot-department-contacts.json').read_text())
        expected={'54OS0000':11,'54RS0002':7}
        for code,count in expected.items():
            with self.subTest(code=code):
                record=departments[code]
                self.assertEqual(len(record['departments']),count)
                self.assertTrue(record['source_url'].startswith('https://'))
                self.assertTrue(record['source_url'].split('/')[2].endswith('.sudrf.ru'))
                self.assertEqual(len({x['label'] for x in record['departments']}),count)
                self.assertTrue(all(re.search(r'\d',x['phone']) for x in record['departments']))

    def test_public_ui_not_required_to_leave_page(self):
        parent=(APP/'_components/pilot-court-public.tsx').read_text()
        child=(APP/'_components/pilot-practical-facts.tsx').read_text()
        self.assertIn('<PilotPracticalFacts code={court.code}/>',parent)
        self.assertIn('href="#pilot-useful-facts"',parent)
        self.assertIn('id="pilot-useful-facts"',child)
        self.assertIn('fact.description',child)
        self.assertIn('info.source_stated_updated',child)
        self.assertIn('info.editorially_verified_current!==false',child)
        self.assertNotIn('fetch(',child)
        self.assertNotIn('court_jurisdiction_units',child)
        self.assertNotIn('approved',child.lower().split('return <section')[1])

if __name__=='__main__':
    unittest.main()
