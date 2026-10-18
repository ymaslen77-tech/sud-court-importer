#!/usr/bin/env python3
"""Read-only Moscow docket/document coverage audit; never collect or publish remote court files."""
import json
import re
import hashlib
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

APP=Path(__file__).resolve().parents[1]/"apps/web/app/lib"
VALID_TOPICS={"family","labor","housing","property","consumer","credit","damage","fraud",
              "other-criminal","bailiffs","kas","social","other"}
TARGET=50

def audit():
    courts=json.loads((APP/"moscow-court-dossiers.json").read_text(encoding="utf-8"))
    records=json.loads((APP/"moscow-adjudicated-cases.json").read_text(encoding="utf-8"))
    slugs={c["slug"] for c in courts}
    if len(slugs)!=12 or len(courts)!=12:
        raise ValueError("Moscow court list must preserve twelve distinct courts")
    seen=set()
    review=Counter()
    doc_counts=Counter()
    for c in records:
        key=(c["court_slug"],c["number"])
        if key in seen:raise ValueError("duplicate court case "+repr(key))
        seen.add(key)
        if c["court_slug"] not in slugs or c["topic_id"] not in VALID_TOPICS:
            raise ValueError("unknown court/category "+repr(key))
        uri=urlsplit(c["source_url"])
        if uri.scheme!="https" or uri.hostname!="m.mos-gorsud.ru" or uri.port:
            raise ValueError("unsupported court source "+repr(key))
        if not uri.path.startswith("/rs/"+c["court_slug"]+"/services/cases/") or "/details/" not in uri.path:
            raise ValueError("source not from this court "+repr(key))
        if not re.fullmatch(r"0[12](?:а)?-\d+/20\d\d",c["number"]):
            raise ValueError("invalid case identifier")
        if not re.fullmatch(r"20\d\d-\d\d-\d\d",c["decision_date"]):
            raise ValueError("missing exact result date "+repr(key))
        if c["status"]!="official_docket_result" or not c["disposition"]:
            raise ValueError("unconfirmed or missing result "+repr(key))
        review[(c["court_slug"],c["topic_id"])]+=1
        d=c["published_document"]
        if c["document_status"]=="published_verified":
            if not d or not d.get("reusePermissionConfirmed") or not d.get("redactionReviewed") or not re.fullmatch(r"[a-f0-9]{64}",d.get("sha256","")) or not re.fullmatch(r"/court-decisions/[a-z0-9/_-]+\.(?:pdf|txt)",d.get("localPath","")):
                raise ValueError("unreviewed or invalid local document "+repr(key))
            file_path=Path(__file__).resolve().parents[1]/"apps/web/public"/d["localPath"].lstrip("/")
            if not file_path.is_file():
                raise ValueError("approved document not present in published static assets "+repr(key))
            digest=hashlib.sha256(file_path.read_bytes()).hexdigest()
            if digest!=d["sha256"]:
                raise ValueError("approved document content hash mismatch "+repr(key))
            head=file_path.read_bytes()[:5]
            if d["kind"]=="pdf" and head!=b"%PDF-":
                raise ValueError("document is not a PDF "+repr(key))
            doc_counts[(c["court_slug"],c["topic_id"])]+=1
        elif d is not None:
            raise ValueError("unpublished document cannot have attached payload "+repr(key))
    coverage=[{"court_slug":court,"topic_id":topic,"docket_results":review[(court,topic)],
               "verified_documents":doc_counts[(court,topic)],"target":TARGET,
               "remaining":max(0,TARGET-doc_counts[(court,topic)])}
              for court in sorted(slugs) for topic in sorted(VALID_TOPICS)]
    return {"courts":len(slugs),"topics":len(VALID_TOPICS),"verified_docket_results":len(records),
            "verified_full_document_count":sum(doc_counts.values()),"target_each_court_topic":TARGET,
            "full_document_slots":len(slugs)*len(VALID_TOPICS)*TARGET,
            "coverage":coverage}

if __name__=="__main__":
    print(json.dumps(audit(),ensure_ascii=False,indent=2))
