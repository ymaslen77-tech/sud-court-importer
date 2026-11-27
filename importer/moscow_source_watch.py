#!/usr/bin/env python3
"""Opt-in, metadata-only monitoring of official Moscow open-data datasets.

No judicial records, participants, or decisions are fetched or published.
If official HTTP headers change, request a *review*, not automatic overwrite.
A downloaded snapshot or changed HEAD response is not proof of changed cases.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import tempfile
from urllib.request import Request, HTTPSHandler, build_opener
from urllib.error import HTTPError, URLError

from moscow_open_data_acquire import NoRedirect, safe_endpoint, selected

DEFAULT_STATE=Path("/srv/sudy-private/moscow-open-data/source-watch.json")
ROOT=Path(__file__).resolve().parents[1]


def hash_header(value):
    if not isinstance(value,str) or not value:
        return None
    return hashlib.sha256(value[:512].encode("utf-8")).hexdigest()


def fetch_headers(item, opener):
    url=safe_endpoint(item)
    req=Request(url,method="HEAD",headers={
        "Accept-Encoding":"identity",
        "User-Agent":"SudyRussia/1.0-source-watch (metadata-only)"
    })
    with opener.open(req,timeout=30) as response:
        if response.geturl()!=url or response.status!=200:
            raise ValueError("Unexpected official response or redirect")
        length=response.headers.get("Content-Length")
        content_type=response.headers.get("Content-Type","").split(";")[0].strip().lower()
        if not length or not length.isdecimal() or int(length)<=0:
            raise ValueError("Unusable Content-Length")
        if content_type not in ("application/zip","application/x-zip-compressed",
                                "application/json","application/octet-stream"):
            raise ValueError("Unknown response Content-Type")
        return {"bytes":int(length),"contentType":content_type,
                "etagSha256":hash_header(response.headers.get("ETag")),
                "lastModifiedSha256":hash_header(response.headers.get("Last-Modified"))}


def compare(current,previous):
    if previous is None:
        return "first_observation"
    signals=("bytes","contentType","etagSha256","lastModifiedSha256")
    if any(current.get(k)!=previous.get(k) for k in signals):
        return "metadata_changed_review_needed"
    if not (current.get("etagSha256") or current.get("lastModifiedSha256")):
        # Same content-length alone is never sufficient proof of unchanged data.
        return "insufficient_change_signal"
    return "metadata_unchanged_not_content_verified"


def observe(items,opener,previous):
    prior=previous.get("datasets",{}) if isinstance(previous,dict) else {}
    results={}
    for item in items:
        new=fetch_headers(item,opener)
        results[item.identifier]={"metadata":new,
           "reviewState":compare(new,prior.get(item.identifier,{}).get("metadata"))}
    return results


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--scope",choices=("first","case","eligible"),default="case")
    p.add_argument("--only",nargs="+",metavar="ID")
    p.add_argument("--state",type=Path,default=DEFAULT_STATE)
    p.add_argument("--max-datasets",type=int,default=2)
    p.add_argument("--ack-source-terms",action="store_true")
    a=p.parse_args(argv)
    if not a.ack_source_terms:
        p.error("Review official portal conditions before metadata requests; --ack-source-terms required")
    if not 1<=a.max_datasets<=33:
        p.error("--max-datasets must be 1..33")
    items=selected(a.scope,a.only)
    if len(items)>a.max_datasets:
        p.error("Selected sources exceed per-run request limit")
    if not items:
        p.error("No eligible sources")
    a.state.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    if a.state.resolve().is_relative_to(ROOT):
        p.error("Private source-monitor state must be outside Git checkout")
    previous=None
    if a.state.exists():
        if a.state.stat().st_size>1_000_000:
            p.error("Previous state too large")
        previous=json.loads(a.state.read_text(encoding="utf-8"))
        if not isinstance(previous,dict) or previous.get("schemaVersion")!=1:
            p.error("Unknown existing state schema; refusing overwrite")
    opener=build_opener(HTTPSHandler(),NoRedirect())
    try:
        observations=observe(items,opener,previous)
    except (ValueError,HTTPError,URLError,OSError) as exc:
        # Never replace known good state on a failed network response.
        print(json.dumps({"checked":False,"reasonType":type(exc).__name__,
                          "statePreserved":True,"published":False},ensure_ascii=False))
        raise SystemExit(2)
    all_new=dict(previous.get("datasets",{})) if previous else {}
    all_new.update(observations)
    state={"schemaVersion":1,"observedAtUtc":datetime.now(timezone.utc).isoformat(),
           "datasets":all_new,"autoPublished":False,"contentsRead":False}
    fd,tmp=tempfile.mkstemp(prefix=".source-watch-",suffix=".tmp",dir=a.state.parent)
    try:
        with os.fdopen(fd,"w",encoding="utf-8") as out:
            json.dump(state,out,ensure_ascii=False,indent=2)
            out.write("\n")
        os.chmod(tmp,0o600)
        os.replace(tmp,a.state)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
    statuses={}
    for r in observations.values():
        key=r["reviewState"]
        statuses[key]=statuses.get(key,0)+1
    print(json.dumps({"checked":True,"datasets":len(observations),"statuses":statuses,
                      "statePath":str(a.state),"published":False,
                      "autoUpdatedCases":0,"sourceContentsRead":False},ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
