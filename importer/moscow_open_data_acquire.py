#!/usr/bin/env python3
"""Opt-in official dataset download and schema survey. NO publication or Git writes.

plan: fully offline. fetch: only after source terms are reviewed and accepted.
inspect: local-only, reports field NAMES, never actual records or identities.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import gzip
import hashlib
import json
import os
from pathlib import Path
import shutil
import tempfile
from urllib.parse import urlsplit
from urllib.request import Request, HTTPRedirectHandler, HTTPSHandler, build_opener
from urllib.error import URLError, HTTPError
from moscow_open_data_registry import CATALOG, BY_ID

SCOPE = {"first": {"first"}, "case": {"first","appeal","index"},
         "eligible": {"first","appeal","index","context"}}
CIVIL_FIRST = "1577116594824-casesgroupfirstcivilhxvgb"
CIVIL_APPEAL = "1577117744056-casesgroupmgsappealcivilwtxga"

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, url):
        raise ValueError("Unexpected HTTP redirect; inspect current official endpoint")

def selected(scope, only):
    allowed = [d for d in CATALOG if d.role in SCOPE[scope]]
    if only:
        names = set(only)
        if not names <= {d.identifier for d in allowed}:
            raise ValueError("Unknown, excluded, or out-of-scope dataset ID")
        allowed = [d for d in allowed if d.identifier in names]
    return allowed

def safe_endpoint(d):
    url = d.download_url
    u = urlsplit(url)
    if (u.scheme != "https" or u.hostname != "data.mos-gorsud.ru"
        or u.username or u.password or u.port or u.query or u.fragment
        or u.path != "/api/opendata/" + d.identifier + "/latest/data/json/"):
        raise ValueError("Untrusted download URL")
    return url

def fingerprint(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024*1024), b""):
            h.update(chunk)
    return h.hexdigest()

def check_json_header(path):
    with path.open("rb") as f:
        first = f.read(65536).lstrip(b"\xef\xbb\xbf \r\t\n")
    if not first.startswith((b"{",b"[")):
        raise ValueError("Not a JSON object/array: HTML/ZIP/error/unknown data rejected")
    return "object" if first.startswith(b"{") else "array"

def inspection(path):
    kind = check_json_header(path)
    result = {"sizeBytes":path.stat().st_size, "sha256":fingerprint(path),
              "root":kind,"verifiedLegalReasoning":False,"published":False}
    try:
        from moscow_bulk_judge_pipeline import records
        row = next(records(path), None)
        if isinstance(row,dict):
            result["topLevelKeysOnly"] = sorted(str(k)[:100] for k in row.keys())[:100]
            result["schemaStatus"] = "keys_sampled_requires_mapping"
        else:
            result["schemaStatus"] = "unexpected_first_record"
    except (ImportError,ValueError,TypeError,OSError) as exc:
        # ijson required for huge files; never output sampled personal values.
        result["schemaStatus"] = "manual_schema_review"
        result["errorType"] = type(exc).__name__
    return result

def fetch_one(d, folder, max_size, opener):
    target = folder / (d.identifier + ".json")
    if target.exists():
        return {"id":d.identifier,"status":"existing_not_overwritten",**inspection(target)}
    fd, tmpname = tempfile.mkstemp(prefix=".moscow-",suffix=".partial",dir=folder)
    os.close(fd)
    temp = Path(tmpname)
    expanded = None
    try:
        req = Request(safe_endpoint(d),headers={"User-Agent":"SudyRussia/1.0 manual-dataset-download",
                     "Accept":"application/json,application/octet-stream,application/gzip"})
        with opener.open(req,timeout=120) as response, temp.open("wb") as out:
            if urlsplit(response.geturl()).hostname != "data.mos-gorsud.ru":
                raise ValueError("Official host changed")
            length = response.headers.get("Content-Length")
            if length and int(length) > max_size:
                raise ValueError("HTTP Content-Length exceeds configured maximum")
            n=0
            while True:
                block = response.read(1024*1024)
                if not block: break
                n += len(block)
                if n > max_size: raise ValueError("Dataset exceeds configured maximum")
                out.write(block)
        with temp.open("rb") as src:
            packed = src.read(2) == b"\x1f\x8b"
        if packed:
            fd, newname = tempfile.mkstemp(prefix=".moscow-expanded-",suffix=".json",dir=folder)
            os.close(fd)
            expanded = Path(newname)
            size=0
            with gzip.open(temp,"rb") as src, expanded.open("wb") as out:
                while True:
                    chunk=src.read(1024*1024)
                    if not chunk: break
                    size += len(chunk)
                    if size>max_size: raise ValueError("Uncompressed data exceeds size cap")
                    out.write(chunk)
            temp.unlink()
            temp=expanded
            expanded=None
        check_json_header(temp)
        os.replace(temp,target)
        temp=None
        return {"id":d.identifier,"status":"downloaded_private","sizeBytes":target.stat().st_size,
                "sha256":fingerprint(target),"published":False}
    finally:
        if temp: temp.unlink(missing_ok=True)
        if expanded: expanded.unlink(missing_ok=True)

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("action",choices=("plan","fetch","inspect"))
    p.add_argument("--scope",choices=tuple(SCOPE),default="case")
    p.add_argument("--only",nargs="+",metavar="ID")
    p.add_argument("--output-dir",type=Path,default=Path("/srv/sudy-private/moscow-open-data"))
    p.add_argument("--ack-source-terms",action="store_true")
    p.add_argument("--max-file-mib",type=int,default=2048)
    p.add_argument("--max-total-gib",type=int,default=12)
    a=p.parse_args(argv)
    datasets=selected(a.scope,a.only)
    if a.action=="plan":
        print(json.dumps({"total":len(CATALOG),"counts":dict(Counter(d.role for d in CATALOG)),
              "selected":len(datasets),"datasetPlan":[{"id":d.identifier,"title":d.title,
              "role":d.role,"passport":d.passport,"downloadCandidate":d.download_url}
              for d in datasets],"network":False,"published":False,
              "endpointVerifiedLive":False},ensure_ascii=False,indent=2))
        return
    if a.action=="fetch" and not a.ack_source_terms:
        p.error("First review the official portal's conditions; --ack-source-terms required")
    if a.max_file_mib<1 or a.max_total_gib<1: p.error("Size limits must be positive")
    a.output_dir.mkdir(parents=True,exist_ok=True,mode=0o700)
    if a.output_dir.resolve().is_relative_to(Path(__file__).resolve().parents[1]):
        p.error("Unreviewed originals must be OUTSIDE Git checkout")
    os.chmod(a.output_dir,0o700)
    limit=a.max_file_mib*1024**2
    total_limit=a.max_total_gib*1024**3
    if a.action=="fetch" and shutil.disk_usage(a.output_dir).free<limit+256*1024**2:
        p.error("Insufficient free disk for configured single-file bound")
    opener=build_opener(HTTPSHandler(),NoRedirect())
    entries=[]
    used=0
    for d in datasets:
        try:
            if a.action=="fetch":
                available=min(limit,total_limit-used)
                if available<=0: break
                record=fetch_one(d,a.output_dir,available,opener)
                used+=record["sizeBytes"]
            else:
                path=a.output_dir/(d.identifier+".json")
                record=({"id":d.identifier,"status":"not_downloaded"} if not path.is_file()
                        else {"id":d.identifier,"status":"inspected",**inspection(path)})
            entries.append(record)
        except (ValueError,OSError,URLError,HTTPError,EOFError) as exc:
            entries.append({"id":d.identifier,"status":"blocked_review",
                            "error":type(exc).__name__,"details":str(exc)[:150]})
            break
    report={"action":a.action,"utc":datetime.now(timezone.utc).isoformat(),
            "selected":len(datasets),"results":entries,"published":False,
            "legalReview":False,"supportsPublicImportOfAll40":False,
            "civilPairPaths":{"first":str(a.output_dir/(CIVIL_FIRST+".json")),
                             "appeal":str(a.output_dir/(CIVIL_APPEAL+".json"))}}
    location=a.output_dir/"acquisition-report.json"
    location.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    os.chmod(location,0o600)
    print(json.dumps({"report":str(location),"results":dict(Counter(x["status"] for x in entries)),
                      "published":False},ensure_ascii=False))
    if any(x["status"]=="blocked_review" for x in entries):
        raise SystemExit(2)
if __name__=="__main__": main()
