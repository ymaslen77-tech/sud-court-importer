import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from migrate import ROOT, list_migrations, migration_files


class MigrationManifestTests(unittest.TestCase):
    def test_all_existing_migrations_are_declared_by_filename_and_digest(self):
        files=migration_files()
        manifest=list_migrations()
        self.assertEqual(len(files),len(manifest))
        self.assertGreaterEqual(len(files),10)
        self.assertEqual([x["name"] for x in manifest],[x.name for x in files])
        self.assertTrue(all(len(x["sha256"])==64 for x in manifest))
        # Numeric prefix 008 exists twice intentionally: full names are migration IDs.
        self.assertEqual(sum(x["name"].startswith("008_") for x in manifest),2)

    def test_malformed_or_symlink_migration_fails(self):
        with tempfile.TemporaryDirectory() as d:
            folder=Path(d)
            (folder/"001_normal.sql").write_text("SELECT 1;",encoding="utf-8")
            (folder/"unexpected.sql").write_text("SELECT 2;",encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"Unsafe migration filename"):
                migration_files(folder)
            (folder/"unexpected.sql").unlink()
            (folder/"002_link.sql").symlink_to(folder/"001_normal.sql")
            with self.assertRaisesRegex(ValueError,"symlink"):
                migration_files(folder)

    def test_cli_lists_without_database(self):
        proc=subprocess.run([sys.executable,str(ROOT.parents[1]/"importer"/"migrate.py"),"--list"],
                            capture_output=True,text=True,check=True)
        parsed=json.loads(proc.stdout)
        self.assertEqual(len(parsed),len(migration_files()))

    def test_apply_requires_explicit_confirmation(self):
        proc=subprocess.run([sys.executable,str(ROOT.parents[1]/"importer"/"migrate.py"),"--apply"],
                            capture_output=True,text=True)
        self.assertNotEqual(proc.returncode,0)
        self.assertIn("--confirm",proc.stderr)


if __name__=="__main__":
    unittest.main()
