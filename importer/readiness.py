"""Fail-closed operational release-readiness gate.

Uses real database measurements from coverage.report(). It is a **pilot**
technical gate only; it cannot certify national completeness, legal permission
to reuse sources, GDPR/privacy compliance or active production uptime.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from urllib.parse import urlsplit
import ipaddress

from coverage import report



def valid_production_origin(value:str|None)->bool:
    if not value or not isinstance(value,str):
        return False
    try:
        parsed=urlsplit(value)
        host=parsed.hostname
        if (parsed.scheme!='https' or not host or parsed.username is not None
            or parsed.password is not None or parsed.port not in (None,443)
            or parsed.path not in ('','/') or parsed.query or parsed.fragment):
            return False
        host=host.lower().rstrip('.')
        if host=='localhost' or host.endswith('.localhost') or host.endswith('.local'):
            return False
        try:
            ipaddress.ip_address(host)
            return False
        except ValueError:
            pass
        return '.' in host and all(part and len(part)<=63 for part in host.split('.'))
    except ValueError:
        return False


def evaluate(stats:dict,public_url:str|None,now:datetime|None=None)->dict:
    now=now or datetime.now(timezone.utc)
    issues=[]
    count=stats["public_courts_verified"]
    if count<=0:
        issues.append("No independently verified public court cards")
    if stats["public_courts_older_than_180d"]>0:
        issues.append("At least one verified court has stale base evidence")
    monitored=stats["monitor"]
    if monitored["registered_enabled"]<=0:
        issues.append("No verified court source registered for ongoing monitoring")
    if monitored["due_or_overdue"]>0 or monitored["with_errors"]>0:
        issues.append("Registered source watches are overdue or failing")
    stamp=monitored["last_successful_check"]
    if not stamp:
        issues.append("No successful monitoring check recorded")
    else:
        try:
            checked=datetime.fromisoformat(stamp)
            if checked.tzinfo is None or checked>now or (now-checked).total_seconds()>72*3600:
                issues.append("Latest source check is stale, future-dated or timezone-naive")
        except ValueError:
            issues.append("Monitoring check time invalid")
    if not valid_production_origin(public_url):
        issues.append("No reviewed HTTPS production public origin")
    queues=stats["review_queues"]
    if queues["registry_differences"]>0 or queues["court_field_proposals"]>0 or queues["watched_page_changes"]>0 or queues.get("contact_changes_pending",0)>0:
        issues.append("Court source and contact review queues still contain unresolved items")
    if queues["judge_appointment_proposals"]>0 or queues.get("staff_roster_observations_pending",0)>0 or queues.get("staff_roster_changes_pending",0)>0:
        issues.append("Judicial personnel information still awaits identity/appointment review")
    return {
        "scope":"pilot technical preflight only",
        "pilot_technical_ready":not issues,
        "nationwide_complete":"NOT_ASSESSED",
        "published_verified":count,
        "blockers":issues,
        "limitations":[
            "An empty blocker list is not a legal/accuracy certification",
            "Full nationwide coverage requires signed source-specific region/type evidence",
            "Production deployment and 24/7 host uptime must be checked independently"
        ]
    }


def main():
    p=argparse.ArgumentParser(description="Fail-closed pre-production court portal readiness")
    p.add_argument("--public-url",default=os.getenv("PUBLIC_SITE_URL"))
    p.add_argument("--fail-if-not-ready",action="store_true")
    args=p.parse_args()
    result=evaluate(report(),args.public_url)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if args.fail_if_not_ready and not result["pilot_technical_ready"]:
        p.exit(2)


if __name__=="__main__":
    main()
