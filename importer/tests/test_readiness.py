import sys
import unittest
from datetime import datetime,timedelta,timezone
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from readiness import evaluate


def basic(now):
    return {
        "public_courts_verified":1,
        "public_courts_older_than_180d":0,
        "monitor":{
            "registered_enabled":1,"due_or_overdue":0,"with_errors":0,
            "last_successful_check":(now-timedelta(hours=6)).isoformat()
        },
        "review_queues":{
            "registry_differences":0,"watched_page_changes":0,
            "court_field_proposals":0,"judge_appointment_proposals":0,
            "staff_roster_observations_pending":0
        }
    }


class ReadinessTests(unittest.TestCase):
    def setUp(self):
        self.now=datetime(2026,10,13,12,0,tzinfo=timezone.utc)

    def test_empty_verified_courts_never_ready(self):
        data=basic(self.now)
        data["public_courts_verified"]=0
        result=evaluate(data,"https://courts.example",self.now)
        self.assertFalse(result["pilot_technical_ready"])
        self.assertEqual(result["nationwide_complete"],"NOT_ASSESSED")

    def test_no_production_domain(self):
        result=evaluate(basic(self.now),"http://localhost:4173",self.now)
        self.assertFalse(result["pilot_technical_ready"])

    def test_unreviewed_judges_block_release(self):
        data=basic(self.now)
        data["review_queues"]["staff_roster_observations_pending"]=11
        self.assertFalse(evaluate(data,"https://courts.example",self.now)["pilot_technical_ready"])

    def test_stale_or_unavailable_monitor_blocks(self):
        data=basic(self.now)
        data["monitor"]["last_successful_check"]=(self.now-timedelta(days=7)).isoformat()
        self.assertFalse(evaluate(data,"https://courts.example",self.now)["pilot_technical_ready"])
        data["monitor"]["last_successful_check"]=None
        self.assertFalse(evaluate(data,"https://courts.example",self.now)["pilot_technical_ready"])

    def test_hypothetical_pilot_pass_still_not_nationwide(self):
        result=evaluate(basic(self.now),"https://courts.example",self.now)
        self.assertTrue(result["pilot_technical_ready"])
        self.assertEqual(result["nationwide_complete"],"NOT_ASSESSED")


if __name__=="__main__":
    unittest.main()
