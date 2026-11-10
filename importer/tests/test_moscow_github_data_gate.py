"""GitHub-only safeguards for Moscow official source index and metadata."""
import copy
import json
import sys
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
import moscow_github_data_gate as gate


class GithubMoscowDataGateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog=gate.read_bounded(gate.CATALOG_JSON,gate.MAX_CATALOG_BYTES)
        cls.public=gate.read_bounded(gate.BULK_JSON,gate.MAX_BULK_BYTES)

    def test_full_official_catalog_and_zero_raw_cases(self):
        roles=gate.validate_catalog(self.catalog)
        self.assertEqual(sum(roles.values()),40)
        self.assertEqual(roles["excluded"],7)
        self.assertEqual(gate.validate_public_bulk(self.public),len(self.public["records"]))

    def test_no_fake_download_or_legal_reuse_claims(self):
        for key in ("fetchedDatasetBodies","legalReuseAuthorizationVerified",
                    "publicationPermissionGranted"):
            bad=copy.deepcopy(self.catalog)
            bad["meta"][key]=True
            with self.subTest(key=key),self.assertRaises(ValueError):
                gate.validate_catalog(bad)
        changed=copy.deepcopy(self.catalog)
        changed["datasets"][0]["officialPage"]="https://example.com/other"
        with self.assertRaises(ValueError):gate.validate_catalog(changed)
        changed=copy.deepcopy(self.catalog)
        changed["datasets"][0]["dataInGitHub"]=True
        with self.assertRaises(ValueError):gate.validate_catalog(changed)

    def test_reject_case_participants_or_unverified_reasoning(self):
        base={"courtSlug":"testcourt","uin":"77RS0001-01-2026-000001-01",
              "number":"02-123/2026","judgeName":"Судья Тест",
              "sourceUrl":"https://mos-gorsud.ru/rs/test/services/cases/civil/details/1",
              "verificationLevel":"official_registers_concordant",
              "judicialActTextVerified":False,"topicId":"test"}
        for mutation in ({"participants":[{"name":"PRIVATE"}]},
                         {"judicialActTextVerified":True},
                         {"topicId":"restricted"},
                         {"sourceUrl":"https://attacker.example/"}):
            record=dict(base,**mutation)
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):
                gate.validate_public_bulk({"source":"https://data.mos-gorsud.ru/opendata",
                                           "records":[record]})

    def test_no_git_court_dump_or_staging_paths(self):
        for path in ("data/import/raw.json",
                     "data/source-snapshots/2026/moscow.json",
                     "archive/1577116594824-casesgroupfirstcivilhxvgb.json",
                     "archive/1577117744056-casesgroupmgsappealcivilwtxga.zip"):
            with self.subTest(path=path),self.assertRaises(ValueError):
                gate.validate_tracked_paths([path])
        self.assertEqual(gate.validate_tracked_paths([
            "apps/web/app/data/moscow-official-dataset-catalog.json",
            "importer/tests/fixtures/synthetic_case.json"]),2)

    def test_live_repo_validation_no_network(self):
        report=gate.run()
        self.assertEqual(report["datasetIndexEntries"],40)
        self.assertFalse(report["networkUsed"])
        self.assertFalse(report["VPSUsed"])
        self.assertFalse(report["deploymentTriggered"])


if __name__=="__main__":
    unittest.main()
