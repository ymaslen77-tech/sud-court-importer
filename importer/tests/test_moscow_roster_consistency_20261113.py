"""Prevent source-count drift and duplicate judge options in the Moscow catalogue.

The rosters describe dated publications, not a certified current workforce.
This test is offline and does not read private litigant data.
"""
import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/"apps/web/app"
DATA=APP/"data"
sys.path.insert(0,str(ROOT/"importer"))
import moscow_research_readiness as readiness
import ingest_moscow_judge_case_evidence as ingest

class MoscowAllRosterSources(unittest.TestCase):
 def test_single_consistent_29_court_report(self):
  report=readiness.readiness()
  self.assertEqual(report["courtsWithHistoricalPublishedRoster"],29)
  self.assertEqual(len(report["courtsWithoutFullOfficialRosterInLocalArchive"]),6)
  self.assertFalse(report["historicalRosterIsCurrentEmploymentProof"])
  self.assertFalse(report["autoApprovedForPublicRelease"])
  self.assertEqual(report["editoriallyReviewedFullTexts"],0)
  self.assertIn("moscow-2026-roster-refresh.json",readiness.ROSTER_FILES)

 def test_judge_case_importer_recognizes_new_official_roster_names(self):
  persons=ingest.judge_sources()
  for name in ("Курахтанов Андрей Владимирович",
               "Гудошникова Елена Александровна",
               "Первовласенко Ксения Александровна"):
   self.assertEqual(persons[("tushinskiy",ingest.norm(name))],"tushinskij")
  self.assertEqual(len(persons),len(set(persons)))
  self.assertEqual(persons[("shcherbinskiy",ingest.norm("Будигина Наталья Геннадьевна"))],"shcherbinskij")
  self.assertEqual(persons[("shcherbinskiy",ingest.norm("Патапенкова Юлия Александровна"))],"shcherbinskij")
  self.assertIn("moscow-2026-roster-refresh.json", 
   (ROOT/"importer/verify_moscow_judge_corroboration.py").read_text(encoding="utf-8"))

 def test_search_deduplicates_repeat_official_sources_without_hiding_them(self):
  component=(APP/"_components/moscow-judges-explorer.tsx").read_text(encoding="utf-8")
  page=(APP/"courts/moscow/judges/page.tsx").read_text(encoding="utf-8")
  self.assertIn("unique=new Map<string,MoscowJudgeProfile>()",component)
  self.assertIn("unique.set(person.judgeSlug,person)",component)
  self.assertIn("rank[person.sourceKind]<rank[previous.sourceKind]",component)
  self.assertIn("distinctPublishedNames",page)
  evidence=(APP/"lib/moscow-district-source-evidence.ts").read_text(encoding="utf-8")
  journey=(APP/"_components/moscow-court-evidence-and-journey.tsx").read_text(encoding="utf-8")
  self.assertIn("...legacyRosters.records,...additionalRosters.records,...refreshedRosters.records",evidence)
  self.assertIn("moscowJudgeRoster(officialSlug)",journey)
  self.assertIn("datedRoster.sourceLastUpdated",journey)
  self.assertIn("rank[person.sourceKind]<rank[previous.sourceKind]",journey)
  self.assertIn("new Set(MOSCOW_JUDGE_PROFILES.map",page)
  self.assertNotIn("<strong>{MOSCOW_JUDGE_PROFILES.length}</strong>",page)

if __name__=="__main__":
 unittest.main()
