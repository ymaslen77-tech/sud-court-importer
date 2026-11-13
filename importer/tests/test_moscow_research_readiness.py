"""Safety checks for offline Moscow dossiers' research status."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
import moscow_research_readiness as readiness

class ResearchReadinessTests(unittest.TestCase):
 def test_existing_reference_counts_and_no_premature_publication(self):
  report=readiness.readiness()
  self.assertEqual(report["sourcedPracticalFactSections"],35)
  self.assertEqual(report["courtsWithHistoricalPublishedRoster"],29)
  self.assertEqual(len(report["courtsWithoutFullOfficialRosterInLocalArchive"]),6)
  self.assertFalse(report["autoApprovedForPublicRelease"])
  self.assertFalse(report["historicalRosterIsCurrentEmploymentProof"])
  self.assertFalse(report["legalReasoningInferredFromRegister"])
  self.assertEqual(report["editoriallyReviewedFullTexts"],0)
 def test_disallows_nonpublic_or_unverified_fulltext_records(self):
  data=readiness.DEFAULT_DATA
  real=readiness.entries
  def injected(root,name):
   if name=="moscow-judge-reviewed-decisions.json":
    return [{"courtSlug":"nikulinskiy","caseNumber":"02-8403/2026",
             "fullTextVerified":True,"publicationPermissionChecked":True}]
   return real(root,name)
  with patch.object(readiness,"entries",side_effect=injected):
   with self.assertRaises(ValueError):
    readiness.readiness()
 def test_cannot_promote_falsely_verified_decision(self):
  real=readiness.entries
  def injected(root,name):
   if name=="moscow-judge-reviewed-decisions.json":
    return [{"courtSlug":"nikulinskiy","caseNumber":"02-1925/2026",
             "fullTextVerified":False,"publicationPermissionChecked":False}]
   return real(root,name)
  with patch.object(readiness,"entries",side_effect=injected):
   with self.assertRaises(ValueError):
    readiness.readiness()

if __name__=="__main__":
 unittest.main()
