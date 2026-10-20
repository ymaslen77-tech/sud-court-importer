"""Publication gates for official Moscow court case metadata, without fake case inflation."""
import hashlib
import json
from datetime import date,timedelta
from pathlib import Path
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
from publish_reviewed_moscow_cases import manifest_row,publish,allowed_url

class MoscowReviewedCasePublicationTests(unittest.TestCase):
    def row(self):
        now=date.today().isoformat()
        return {
          "court_slug":"lefortovskij",
          "number":"02-456789/2026",
          "topic_id":"labor",
          "safe_public_subject":"Восстановление на работе после увольнения",
          "verified_first_instance_outcome":"Иск удовлетворен частично",
          "official_docket_url":"https://m.mos-gorsud.ru/rs/lefortovskij/services/cases/civil/details/approved-sample-only",
          "decision_date":"2026-05-15",
          "reviewed_on":now,
          "reviewer":"Редактор судебного каталога",
          "official_docket_verified":True,
          "first_instance_result_verified":True,
          "privacy_reviewed":True,
          "statutory_publication_checked":True,
          "source_reuse_confirmed":True,
          "editor_approved":True,
          "source_record_hash":"a"*64,
          "published_document":None
        }

    def test_valid_metadata_only_but_never_full_document(self):
        record=manifest_row(self.row())
        self.assertEqual(record["number"],"02-456789/2026")
        self.assertEqual(record["topic_id"],"labor")
        self.assertEqual(record["document_status"],"source_document_not_ingested")
        self.assertIsNone(record["published_document"])
        self.assertEqual(record["source_record_hash"],"a"*64)

    def test_every_approval_flag_is_required(self):
        for f in ("official_docket_verified","first_instance_result_verified",
                  "privacy_reviewed","statutory_publication_checked",
                  "source_reuse_confirmed","editor_approved"):
            row=self.row()
            row[f]=False
            with self.subTest(flag=f),self.assertRaisesRegex(ValueError,f):
                manifest_row(row)

    def test_reject_wrong_court_domain_and_pdf_in_metadata_pipeline(self):
        row=self.row()
        self.assertFalse(allowed_url("https://mos-gorsud.ru.evil.net/rs/lefortovskij/services/cases/civil/details/test","lefortovskij"))
        row["official_docket_url"]="https://mos-gorsud.ru.evil.net/rs/lefortovskij/services/cases/civil/details/test"
        with self.assertRaises(ValueError):manifest_row(row)
        row=self.row()
        row["published_document"]={"localPath":"/court-decisions/fake.pdf"}
        with self.assertRaisesRegex(ValueError,"PDF"):manifest_row(row)
        row=self.row()
        row["participants"]=["Иванов И.И."]
        with self.assertRaises(ValueError):manifest_row(row)
        row=self.row()
        row["topic_id"]="other"
        with self.assertRaises(ValueError):manifest_row(row)
        row=self.row()
        row["source_record_hash"]="missing"
        with self.assertRaises(ValueError):manifest_row(row)

    def test_publish_to_temporary_output_and_no_repeat_duplicate(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            p=root/"approved.json"
            output=root/"reviewed.json"
            p.write_text(json.dumps({"schema_version":1,"records":[self.row()]},ensure_ascii=False))
            result=publish(p,output)
            self.assertEqual(result["published_metadata"],1)
            self.assertEqual(result["published_full_documents"],0)
            data=json.loads(output.read_text())
            self.assertEqual(len(data),1)
            self.assertNotIn("party_names",data[0])
            self.assertEqual(data[0]["source_url"],self.row()["official_docket_url"])
            same=publish(p,output)
            self.assertEqual(same["published_metadata"],1)
            self.assertEqual(len(json.loads(output.read_text())),1)
            conflicting=self.row()
            conflicting["safe_public_subject"]="Другое описание без проверки"
            p.write_text(json.dumps({"schema_version":1,"records":[conflicting]},ensure_ascii=False))
            with self.assertRaises(ValueError):publish(p,output)

    def test_default_site_has_no_auto_approved_court_cases(self):
        public=ROOT/"apps/web/app/lib/moscow-reviewed-cases.json"
        rows=json.loads(public.read_text(encoding="utf-8"))
        self.assertEqual(rows,[])
        website=(ROOT/"apps/web/app/lib/moscow-adjudicated-cases.ts").read_text(encoding="utf-8")
        self.assertIn("moscow-reviewed-cases.json",website)
        self.assertIn("adjudicatedCasesFor",website)
        self.assertIn("officialCourtDocketUrl",website)

if __name__=="__main__":unittest.main()
