import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from registry_diff import compare,listing_file

SEED=Path(__file__).resolve().parents[1]/"seeds"/"novosibirsk-federal-official-unreviewed.json"


class RegistryDiffTests(unittest.TestCase):
    def test_modified_new_missing_and_no_automatic_retirement(self):
        before={"54RS0001":{"court_name":"Name A","phone":"111","address":"Address A"},
                "54RS0002":{"court_name":"Name B","phone":"222"}}
        after={"54RS0001":{"court_name":"Name A","phone":"333","address":"Address A"},
               "54GV0001":{"court_name":"Name C","phone":"444"}}
        changes=compare(before,after)
        self.assertEqual([(x.code,x.field,x.kind) for x in changes],
            [("54GV0001","__record__","new"),("54RS0001","phone","changed")])
        verified_complete=compare(before,after,include_missing=True)
        self.assertEqual([(x.code,x.field,x.kind) for x in verified_complete],
            [("54GV0001","__record__","new"),("54RS0001","phone","changed"),
             ("54RS0002","__record__","missing")])

    def test_provenance_and_modified_contacts(self):
        with tempfile.TemporaryDirectory() as tmp:
            old=Path(tmp)/"old.json"
            new=Path(tmp)/"new.json"
            original=json.loads(SEED.read_text(encoding="utf-8"))
            old.write_text(json.dumps(original,ensure_ascii=False),encoding="utf-8")
            updated=json.loads(json.dumps(original))
            updated[0]["courtTelephone"]="(383) 000-00-00"  # synthetically changed for TEST only
            new.write_text(json.dumps(updated,ensure_ascii=False),encoding="utf-8")
            old_source,a=listing_file(old,"sudrf-federal")
            new_source,b=listing_file(new,"sudrf-federal")
            self.assertEqual(old_source,new_source)
            delta=compare(a,b)
            self.assertEqual(len(delta),1)
            self.assertEqual(delta[0].field,"phone")
            self.assertEqual(delta[0].kind,"changed")

    def test_invalid_mismatched_source_rejected_by_normalization(self):
        with tempfile.TemporaryDirectory() as tmp:
            filepath=Path(tmp)/"invalid.json"
            rows=json.loads(SEED.read_text(encoding="utf-8"))
            rows[0]["courtSiteUrl"]="https://sudrf.ru.evil.example/"
            filepath.write_text(json.dumps(rows,ensure_ascii=False),encoding="utf-8")
            with self.assertRaises(ImportValidationError):
                listing_file(filepath,"sudrf-federal")


if __name__=="__main__":
    unittest.main()
