"""Editorial coverage: 20 attributed court rosters, 3 separately labelled evidence briefs."""
import json,unittest
from pathlib import Path
from urllib.parse import urlsplit
APP=Path(__file__).resolve().parents[2]/'apps/web/app'
load=lambda name:json.loads((APP/'data'/name).read_text(encoding='utf-8'))['records']
COURTS=load('moscow-district-individual-dossiers.json')
ROSTERS=load('moscow-district-judges-samples.json')
BRIEFS=load('moscow-judicial-source-briefs.json')
UI=(APP/'_components/moscow-district-individual-dossier.tsx').read_text(encoding='utf-8')
DETAIL=(APP/'courts/moscow/registry/[slug]/page.tsx').read_text(encoding='utf-8')

class JudicialEvidenceCoverage(unittest.TestCase):
 def test_coverage_and_unique_court_identity(self):
  all_ids={x['slug'] for x in COURTS}
  roster_ids={x['slug'] for x in ROSTERS}
  brief_ids={x['slug'] for x in BRIEFS}
  self.assertEqual(len(all_ids),23)
  self.assertEqual(len(roster_ids),20)
  self.assertEqual(len(brief_ids),3)
  self.assertFalse(roster_ids&brief_ids)
  self.assertEqual(roster_ids|brief_ids,all_ids)
  self.assertEqual(brief_ids,{'tverskoy','tushinskiy','chertanovskiy'})
 def test_court_rosters_not_falsely_marked_current_or_full(self):
  names=sum(len(x['judges']) for x in ROSTERS)
  self.assertEqual(names,283)
  for row in ROSTERS:
   self.assertEqual(len(set(row['judges'])),len(row['judges']))
   self.assertEqual(row['status'],'published_roster_not_live_certification')
   self.assertTrue(row['sourceUrl'].startswith('https://mos-gorsud.ru/rs/'+row['officialSlug']+'/'))
   self.assertTrue(row['sourceUrl'].endswith('/structure/judges'))
   for appt in row['appointmentNotes']:
    self.assertIn(appt['name'],row['judges'])
    self.assertIn('Указ Президента РФ',appt['decree'])
  self.assertIn('Не следует считать подборку обязательно полной',UI)
  self.assertIn('robots:{index:false,follow:true}',DETAIL)
 def test_non_roster_evidence_has_source_and_label(self):
  for row in BRIEFS:
   self.assertIn(row['sourceType'],('official_appointment_notices','official_judicial_assistant_directory'))
   self.assertTrue(row['note'])
   self.assertTrue(row['people'])
   for item in row['people']:
    self.assertTrue(item['name'])
    self.assertTrue(item['basis'])
    parsed=urlsplit(item['sourceUrl'])
    self.assertEqual(parsed.scheme,'https')
    self.assertEqual(parsed.hostname,'mos-gorsud.ru')
    self.assertIn('/rs/',parsed.path)
  self.assertIn('moscowJudicialSourceBrief(profile.slug)',UI)
  self.assertIn('Проверенные упоминания · не полный состав',UI)
  self.assertIn('Официальные сообщения о назначении судей',UI)
if __name__=='__main__':unittest.main()
