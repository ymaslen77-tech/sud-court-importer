"""Court-leader career facts are supported by specific official history pages."""
import json,unittest
from pathlib import Path
APP=Path(__file__).resolve().parents[2]/'apps/web/app'
RECORDS=json.loads((APP/'data/moscow-judge-career-evidence.json').read_text(encoding='utf-8'))['records']
UI=(APP/'_components/moscow-district-individual-dossier.tsx').read_text(encoding='utf-8')
class JudgeCareerEvidenceTests(unittest.TestCase):
 def test_two_sourced_professional_timelines(self):
  self.assertEqual({x['slug'] for x in RECORDS},{'zelenogradskiy','kuntsevskiy'})
  for item in RECORDS:
   self.assertTrue(item['sourceUrl'].startswith('https://'))
   self.assertIn('mos-gorsud.ru/rs/',item['sourceUrl'])
   self.assertIn('/info/history',item['sourceUrl'])
   self.assertGreaterEqual(len(item['facts']),1)
   self.assertIn('№ ',item['facts'][-1]['description'])
   self.assertFalse(any('образовани' in f['description'].lower() for f in item['facts']))
  self.assertIn('moscowJudgeCareerEvidence(profile.slug)',UI)
  self.assertIn('Документированная профессиональная история',UI)
if __name__=='__main__':unittest.main()
