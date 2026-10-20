#!/usr/bin/env python3
"""Merge human-approved official Moscow court CASE METADATA into the site's public registry.

This command never downloads official data, approves documents, or publishes PDF files.
An approval manifest must be prepared after manual reconciliation with each official docket.
Unapproved, protected, inconsistent or duplicate entries fail closed.
"""
import argparse
from datetime import date
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/"apps/web/app/lib"
EXISTING=APP/"moscow-adjudicated-cases.json"
OUTPUT=APP/"moscow-reviewed-cases.json"
COURTS={c["slug"] for c in json.loads((APP/"moscow-court-dossiers.json").read_text(encoding="utf-8"))}
TOPICS={"family","labor","housing","property","consumer","credit","damage",
        "fraud","other-criminal","bailiffs","kas","social","other"}
MAX_PER_GROUP=250

def allowed_url(value,court):
    if not isinstance(value,str):return False
    try:
        p=urlsplit(value)
        return p.scheme=="https" and p.hostname in ("m.mos-gorsud.ru","mos-gorsud.ru",
            "www.mos-gorsud.ru") and not p.username and not p.password and not p.port and (
            p.path.startswith("/rs/"+court+"/services/cases/") and "/details/" in p.path)
    except (TypeError,ValueError):return False

def reviewed_value(value,max_length):
    if not isinstance(value,str):raise ValueError("Required review field is not text")
    x=" ".join(value.split())
    if not x or len(x)>max_length or any(ord(c)<32 for c in x):
        raise ValueError("Required review field missing or too long")
    return x

def manifest_row(x):
    if not isinstance(x,dict):raise ValueError("Expected review record")
    court=reviewed_value(x.get("court_slug"),36)
    if court not in COURTS:raise ValueError("Unknown court "+court)
    number=reviewed_value(x.get("number"),50)
    if not re.fullmatch(r"0[12](?:а)?-\d+/20\d\d",number):
        raise ValueError("Invalid first-instance case number "+number)
    topic=reviewed_value(x.get("topic_id"),32)
    if topic not in TOPICS or topic=="other" and not x.get("category_manually_classified"):
        raise ValueError("Unknown or unreviewed category for "+number)
    source=reviewed_value(x.get("official_docket_url"),700)
    if not allowed_url(source,court):raise ValueError("Wrong official case URL for "+number)
    subject=reviewed_value(x.get("safe_public_subject"),300)
    outcome=reviewed_value(x.get("verified_first_instance_outcome"),180)
    date_string=reviewed_value(x.get("decision_date"),10)
    reviewed_on=reviewed_value(x.get("reviewed_on"),10)
    try:
        day=date.fromisoformat(date_string)
        reviewed=date.fromisoformat(reviewed_on)
    except ValueError as ex:raise ValueError("Invalid date for "+number) from ex
    if reviewed<day or reviewed>date.today():raise ValueError("Review date inconsistent "+number)
    reviewer=reviewed_value(x.get("reviewer"),120)
    if len(reviewer)<3:raise ValueError("Missing reviewer")
    for flag in ("official_docket_verified","first_instance_result_verified",
                 "privacy_reviewed","statutory_publication_checked",
                 "source_reuse_confirmed","editor_approved"):
        if x.get(flag) is not True:raise ValueError(flag+" must be individually confirmed: "+number)
    # No automatic full-act publishing. A PDF requires a separate document review pipeline.
    if x.get("published_document") is not None:raise ValueError("PDF is not approved by metadata importer")
    if x.get("participants") or x.get("party_names") or x.get("personal_data"):
        raise ValueError("Participant details forbidden in public metadata")
    if x.get("source_record_hash") is None or not re.fullmatch(r"[a-f0-9]{64}",str(x["source_record_hash"])):
        raise ValueError("Missing exact source record hash")
    return {
      "court_slug":court,
      "slug":number.replace("/","-").lower(),
      "number":number,"topic_id":topic,
      "subject":subject,"decision_date":day.isoformat(),
      "disposition":outcome,"source_url":source,
      "status":"official_docket_result",
      "document_status":"source_document_not_ingested",
      "published_document":None,
      "researched_on":reviewed.isoformat(),
      "official_file_listed":False,
      "official_listing_checked_on":None,
      "source_record_hash":x["source_record_hash"],
      "reviewer":reviewer
    }

def publish(review_path,output_path=OUTPUT):
    source=Path(review_path).resolve(strict=True)
    dest=Path(output_path).resolve()
    if source==dest:raise ValueError("Approval file and output may not be the same")
    payload=json.loads(source.read_text(encoding="utf-8"))
    if not isinstance(payload,dict) or payload.get("schema_version")!=1:
        raise ValueError("Review manifest must contain schema_version=1")
    if not isinstance(payload.get("records"),list):raise ValueError("Missing records")
    if not payload["records"]:raise ValueError("No reviewed records to publish")
    existing=json.loads(EXISTING.read_text(encoding="utf-8"))
    current=json.loads(dest.read_text(encoding="utf-8")) if dest.is_file() else []
    if not isinstance(current,list):raise ValueError("Reviewed registry must be a JSON array")
    keys={(c["court_slug"],c["number"]) for c in existing}
    saved={(c["court_slug"],c["number"]):c for c in current}
    for raw in payload["records"]:
        row=manifest_row(raw)
        k=(row["court_slug"],row["number"])
        if k in keys:raise ValueError("Case already exists in the historical registry: "+str(k))
        if k in saved and saved[k]!=row:raise ValueError("Conflicting reviewed record "+str(k))
        saved[k]=row
    from collections import Counter
    totals=Counter((c["court_slug"],c["topic_id"]) for c in saved.values())
    if any(n>MAX_PER_GROUP for n in totals.values()):
        raise ValueError("Exceeded per-category publication budget; paginate through database instead")
    output=sorted(saved.values(),key=lambda r:(r["court_slug"],r["topic_id"],r["number"]))
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return {"published_metadata":len(output),"added":len(payload["records"]),
            "published_full_documents":0,"courts":len({c["court_slug"] for c in output})}

if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--review",required=True)
    p.add_argument("--output",default=str(OUTPUT))
    a=p.parse_args()
    print(json.dumps(publish(a.review,a.output),ensure_ascii=False))
