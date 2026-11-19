"""Pre-deploy script must be explicitly opt-in; no automatic VPS publish."""
import subprocess
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/"scripts/moscow-bulk-release.sh"
STAGE=ROOT/"importer/moscow_bulk_judge_pipeline.py"
PROMOTE=ROOT/"importer/promote_moscow_bulk_metadata.py"
CATALOG=ROOT/"apps/web/app/lib/moscow-judge-directory.ts"
DATA=ROOT/"apps/web/app/data/moscow-judge-bulk-cases.json"

class MoscowBulkReleaseEntrypointTests(unittest.TestCase):
 def test_bash_syntax_and_safe_defaults(self):
  r=subprocess.run(["bash","-n",str(SCRIPT)],capture_output=True,text=True)
  self.assertEqual(r.returncode,0,r.stderr)
  s=SCRIPT.read_text(encoding="utf-8")
  for x in ("set -Eeuo pipefail","--first","--appeal","--ack-source-terms","--apply","--push",
            "git push origin infra/coolify-russian-vps",
            "python","--mode","--max-per-court","--max-per-judge"):
   self.assertIn(x,s)
  self.assertIn("if (( DO_APPLY )); then",s)
  self.assertIn("if (( DO_PUSH )); then",s)
  self.assertIn("if git diff --cached --quiet",s)
  self.assertIn("refusing --apply",s)
 def test_staging_is_private_and_publishing_needs_explicit_approval(self):
  st=STAGE.read_text(encoding="utf-8")
  pub=PROMOTE.read_text(encoding="utf-8")
  for value in ("quarantine.ndjson","private-stage.sqlite3","sourceRecordHash" if False else "firstSha256",
                "official_registers_concordant","single_official_record_unchecked_live"):
   self.assertIn(value,st)
  self.assertIn("if apply and not ack:",pub)
  self.assertIn("if apply and new:",pub)
  self.assertIn("MOSCOW_PRIVATE_BACKUP_DIR",pub)
  self.assertIn("sourceJudgeLabel",pub)
  self.assertIn("known",pub.lower())
  self.assertIn("bulkFile.records",CATALOG.read_text(encoding="utf-8"))
  self.assertIn('"records": []',DATA.read_text(encoding="utf-8"))
if __name__=="__main__":unittest.main()
