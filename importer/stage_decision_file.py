#!/usr/bin/env python3
"""OFFLINE intake of a court PDF for manual editorial review, never publishing it.

Usage:
 python importer/stage_decision_file.py --court lefortovskij --number 02-5648/2026 \
   --file /private/review/decision.pdf --document-source https://mos-gorsud.ru/... \
   --output /private/review/02-5648-manifest.json
Only the manifest is written. The original bytes remain private. A separately
authorized redaction and privacy review is mandatory before publishing an act.
"""
import argparse
import hashlib
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
REGISTRY=ROOT/"apps/web/app/lib/moscow-adjudicated-cases.json"
PROHIBITED_TOPICS={"family"}
MAX_BYTES=25*1024*1024

def validate_document_source(url):
    parsed=urlsplit(url)
    hostname=(parsed.hostname or "").lower()
    if (parsed.scheme!="https" or parsed.username or parsed.password or parsed.port or
        hostname not in {"mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru"}):
        raise ValueError("Document provenance must be an HTTPS Moscow court source")
    if not parsed.path.startswith("/rs/"):
        raise ValueError("Document URL must belong to the official district court portal")
    return parsed.geturl()

def stage(court,number,document_path,document_source,output_path):
    data=json.loads(REGISTRY.read_text(encoding="utf-8"))
    matches=[c for c in data if c["court_slug"]==court and c["number"]==number]
    if len(matches)!=1:
        raise ValueError("Case not found or not unambiguous in individually checked docket records")
    item=matches[0]
    if item["topic_id"] in PROHIBITED_TOPICS:
        raise ValueError("Full text public posting prohibited for this case category: 262-FZ art. 15")
    document_source=validate_document_source(document_source)
    if "/rs/"+court+"/" not in document_source:
        raise ValueError("Document source does not match the court")
    source=Path(document_path).resolve(strict=True)
    output=Path(output_path).resolve()
    if not source.is_file() or source.suffix.lower()!=".pdf":
        raise ValueError("Source must be a PDF file")
    if source.stat().st_size>MAX_BYTES or source.stat().st_size<20:
        raise ValueError("PDF size outside reviewed limits")
    data=source.read_bytes()
    if not data.startswith(b"%PDF-") or b"%%EOF" not in data[-2048:]:
        raise ValueError("File does not have a valid PDF envelope")
    for signature in [b"/JavaScript",b"/JS",b"/Launch",b"/EmbeddedFile",b"/OpenAction"]:
        if signature in data:
            raise ValueError("PDF contains an active-content indicator; reject and review separately")
    if output==source or output.suffix.lower()!=".json":
        raise ValueError("Manifest must be a separate JSON file")
    manifest={
        "schema_version":1,
        "court_slug":court,
        "number":number,
        "topic_id":item["topic_id"],
        "official_docket_url":item["source_url"],
        "official_document_url":document_source,
        "original_source_sha256":hashlib.sha256(data).hexdigest(),
        "file_size_bytes":len(data),
        "source_observed_on":date.today().isoformat(),
        "publication_state":"document_review",
        "source_reuse_confirmed":False,
        "statutory_publication_checked":False,
        "verified_redaction":False,
        "editor_approved":False,
        "public_file_created":False,
        "warning":"Technical preflight only. Do not publish. Manual legal, privacy and factual review required."
    }
    output.parent.mkdir(parents=True,exist_ok=True)
    if output.exists():raise ValueError("Refuse to overwrite an existing review manifest")
    output.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return manifest

if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    for name in ("court","number","file","document-source","output"):
        p.add_argument("--"+name,required=True)
    a=p.parse_args()
    result=stage(a.court,a.number,a.file,a.document_source,a.output)
    print(json.dumps({"staged":True,"case":result["number"],"sha256":result["original_source_sha256"],
                      "publication_state":result["publication_state"],"public_file_created":False}))
