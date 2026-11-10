"""Offline contract: opt-in VPS gateway cannot deploy or auto-publish."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ops/vps"))
from validate_request import validate


class MoscovVpsOperatorContractTests(unittest.TestCase):
    def test_committed_request_is_safe_and_only_private_preflight(self):
        job = validate(ROOT / "ops/vps/request.json")
        self.assertFalse(job["deploy"])
        self.assertFalse(job["publish"])
        self.assertEqual(job["operation"], "moscow-private-preflight")

    def test_request_will_not_accept_arbitrary_commands(self):
        obj=json.loads((ROOT/"ops/vps/request.json").read_text(encoding="utf-8"))
        for injection in (
            {"command":"rm -rf /"},
            {"operation":"publish"},
            {"operation":"moscow-private-preflight;id"},
            {"apply":True},
            {"deploy":True},
        ):
            with self.subTest(injection=injection), tempfile.TemporaryDirectory() as td:
                p=Path(td)/"invalid.json"
                p.write_text(json.dumps(dict(obj, **injection)), encoding="utf-8")
                with self.assertRaises(ValueError):
                    validate(p)

    def test_all_bash_scripts_parse(self):
        for file in ("sudy-stage-ssh-gate.sh", "sudy-stage-preflight.sh",
                     "install-moscow-operator.sh"):
            path=ROOT/"ops/vps"/file
            result=subprocess.run(["bash", "-n", str(path)], capture_output=True, text=True)
            with self.subTest(path=file):
                self.assertEqual(result.returncode,0,result.stderr)

    def test_ssh_gateway_requires_forced_command_and_no_prod_mutation(self):
        gate=(ROOT/"ops/vps/sudy-stage-ssh-gate.sh").read_text(encoding="utf-8")
        stage=(ROOT/"ops/vps/sudy-stage-preflight.sh").read_text(encoding="utf-8")
        installer=(ROOT/"ops/vps/install-moscow-operator.sh").read_text(encoding="utf-8")
        workflow=ROOT/".github/workflows/moscow-vps-private-preflight.yml"
        self.assertFalse(workflow.exists(), "Retired VPS runner must stay disabled")
        self.assertIn("SSH_ORIGINAL_COMMAND",gate)
        self.assertIn("/usr/local/libexec/sudy-stage-preflight",gate)
        self.assertIn("--mode crosschecked",stage)
        self.assertIn("bash scripts/moscow-bulk-release.sh --first",stage)
        self.assertIn('restrict,command="/usr/local/libexec/sudy-stage-ssh-gate"',installer)
        self.assertIn("setfacl -m u:sudy-stage:r--",installer)
        self.assertIn("usermod --password '*'",installer)
        self.assertNotIn("passwd -l sudy-stage",installer)

        self.assertNotIn("--apply --ack-source-terms --push",stage)

if __name__=="__main__":
    unittest.main()
