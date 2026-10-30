"""Checks for offline AllCourts vendor data before any staging/production writes."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from datetime import date

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from allcourts_dataset_audit import audit_dataset, read_mapping, read_rows

MAPPING={
 "name":"title","region_code":"region","kind":"court_type",
 "official_code":"code","observed_on":"snapshot_date",
 "official_url":"official_website","status":"lifecycle"
}
TYPES={"regional":"general-regional","district":"general-district",
       "magistrate":"general-magistrate","cassation":"general-cassation"}
DAY=date(2026,10,30)

def court(name="Верховный Суд Республики Бурятия", region="03", code="04OS0000",
          kind="regional", official="https://vs--bur.sudrf.ru/", when="2026-06-17",status="active"):
 return {"title":name,"region":region,"code":code,"court_type":kind,
         "snapshot_date":when,"official_website":official,"lifecycle":status}

class AllCourtsQualityGateTests(unittest.TestCase):
 def examine(self,rows,reference=None):
  return audit_dataset(rows,MAPPING,TYPES,reference,as_of=DAY)

 def test_code_prefix_is_not_mistaken_for_region_code(self):
  report=self.examine([court()])
  self.assertEqual(report["rows"],1)
  self.assertEqual(report["regions_present"],1)
  self.assertEqual(report["duplicate_code_rows"],[])
  self.assertEqual(report["problem_counts"],{})

 def test_crosscheck_official_identity_and_name(self):
  official=[{"official_code":"04OS0000","name":"Верховный Суд Республики Бурятия",
             "region_code":"03","status":"active"}]
  report=self.examine([court()],official)
  self.assertEqual(report["independent_reference_matched"],1)
  self.assertEqual(report["independent_name_conflicts"],0)
  self.assertEqual(report["independent_region_conflicts"],0)
  self.assertEqual(report["publishable_or_verified"],0)

 def test_conflicting_official_name_region_and_closed_state_are_flagged(self):
  official=[{"official_code":"04OS0000","name":"Другой суд","region_code":"55",
             "status":"closed"}]
  report=self.examine([court()],official)
  self.assertEqual(report["independent_name_conflicts"],1)
  self.assertEqual(report["independent_region_conflicts"],1)
  self.assertEqual(report["problem_counts"]["officially_not_active"],1)

 def test_duplicate_codes_and_names_are_both_reported(self):
  report=self.examine([court(),court()])
  self.assertEqual(report["duplicate_code_rows"],[2])
  self.assertEqual(report["possible_duplicate_name_rows"],[2])

 def test_old_and_inactive_entries_flagged(self):
  report=self.examine([court(when="2025-01-01",status="closed")])
  self.assertEqual(report["problem_counts"]["stale_over_180_days"],1)
  self.assertEqual(report["problem_counts"]["possibly_not_active"],1)

 def test_unknown_court_kind_and_absent_site_not_approved(self):
  report=self.examine([court(kind="arbitrary",official="")])
  self.assertEqual(report["problem_counts"]["unknown_kind"],1)
  self.assertEqual(report["problem_counts"]["missing_or_invalid_official_site"],1)
  self.assertEqual(report["publishable_or_verified"],0)

 def test_legal_export_csv_and_mapping_validated(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)
   (p/"export.csv").write_text(
    "title,region,code,court_type,snapshot_date,official_website,lifecycle\n"
    "Верховный Суд Республики Бурятия,03,04OS0000,regional,2026-06-17,https://vs--bur.sudrf.ru/,active\n",
    encoding="utf-8")
   (p/"map.json").write_text(json.dumps({"fields":MAPPING,"court_type_map":TYPES}),encoding="utf-8")
   fields,kinds=read_mapping(p/"map.json")
   rows=read_rows(p/"export.csv")
   self.assertEqual(len(rows),1)
   self.assertEqual(audit_dataset(rows,fields,kinds,as_of=DAY)["rows"],1)

 def test_missing_authorization_never_triggers_api_or_db_calls(self):
  source=(ROOT/"allcourts_dataset_audit.py").read_text(encoding="utf-8")
  for forbidden in ("requests.get(", "urlopen(", "psycopg.connect(", "INSERT INTO courts", "UPDATE courts SET"):
   self.assertNotIn(forbidden,source)

if __name__=="__main__":
 unittest.main()
