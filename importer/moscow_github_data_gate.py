#!/usr/bin/env python3
"""Offline release guard for the GitHub-only Moscow source catalogue.

Does NOT download official case files, call the network, read VPS secrets,
publish records or infer court decisions. GitHub contains curated links and
reviewed public metadata, not raw files with litigant identifiers.
"""
from collections import Counter
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit

from moscow_open_data_registry import BY_ID, CATALOG

ROOT=Path(__file__).resolve().parents[1]
CATALOG_JSON=ROOT/"apps/web/app/data/moscow-official-dataset-catalog.json"
BULK_JSON=ROOT/"apps/web/app/data/moscow-judge-bulk-cases.json"
MAX_CATALOG_BYTES=128*1024
MAX_BULK_BYTES=8*1024*1024
PUBLIC_FIELDS={
 "courtSlug","judgeName","number","uin","proceeding","topicId","category",
 "status","outcome","decisionDate","sourceUrl","observedOn","note",
 "judgeAttribution","judicialActTextVerified","evidenceLevel",
 "verificationLevel",
}
SAFE_ROLES={"first","appeal","index","context","excluded"}
OFFICIAL_CASE_DOMAINS={"mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru"}
SOURCE_BASE="https://data.mos-gorsud.ru"
RAW_FILE_RE=re.compile(r"1577\d{9}-cases[^/]*\.(?:json|jsonl|ndjson|zip|gz)$",re.I)


def read_bounded(path,limit):
    if not path.is_file() or path.stat().st_size>limit:
        raise ValueError("Missing or oversized approved JSON: "+path.name)
    return json.loads(path.read_text(encoding="utf-8"))


def validate_catalog(data):
    if not isinstance(data,dict) or set(data)!={"meta","datasets"}:
        raise ValueError("Unexpected catalog structure")
    meta,records=data["meta"],data["datasets"]
    if not isinstance(meta,dict) or not isinstance(records,list) or len(records)!=len(CATALOG):
        raise ValueError("Catalog is not the official 40-item index")
    if (meta.get("datasetCount")!=len(CATALOG) or
        meta.get("sourceIndex")!=SOURCE_BASE+"/opendata" or
        meta.get("fetchedDatasetBodies") is not False or
        meta.get("containsCaseParticipants") is not False or
        meta.get("legalReuseAuthorizationVerified") is not False or
        meta.get("publicationPermissionGranted") is not False):
        raise ValueError("Catalog incorrectly claims fetched data or source permission")
    if meta.get("verifiedDownloadEndpointsLive") is not False:
        raise ValueError("Do not assert untested live download endpoints")
    observed=set()
    roles=Counter()
    keys={"id","role","title","officialPage","officialPassportCandidate",
          "officialDownloadCandidate","dataInGitHub","liveEndpointVerified"}
    for item in records:
        if not isinstance(item,dict) or set(item)!=keys:
            raise ValueError("Unexpected dataset fields, possible raw data")
        identifier=item["id"]
        if not isinstance(identifier,str) or identifier not in BY_ID or identifier in observed:
            raise ValueError("Unknown or duplicate official dataset ID")
        source=BY_ID[identifier]
        if item["role"]!=source.role or item["role"] not in SAFE_ROLES or item["title"]!=source.title:
            raise ValueError("Official source catalog drift")
        if (item["officialPage"]!=source.portal_url or
            item["officialPassportCandidate"]!=source.passport or
            item["officialDownloadCandidate"]!=source.download_url):
            raise ValueError("Unverified alternate URL or nonofficial host")
        if item["dataInGitHub"] is not False or item["liveEndpointVerified"] is not False:
            raise ValueError("Catalog must not claim raw case data or live verification")
        observed.add(identifier)
        roles[source.role]+=1
    if observed!=set(BY_ID) or dict(roles)!=meta.get("roles"):
        raise ValueError("Catalog incomplete or role counts inconsistent")
    return dict(roles)


def validate_public_bulk(data):
    if not isinstance(data,dict) or not isinstance(data.get("records"),list):
        raise ValueError("Expected reviewed public JSON records")
    if data.get("source")!=SOURCE_BASE+"/opendata":
        raise ValueError("Official source provenance missing")
    seen=set()
    for row in data["records"]:
        if not isinstance(row,dict) or not set(row)<=PUBLIC_FIELDS:
            raise ValueError("Raw judicial case content or unknown field in published metadata")
        if (row.get("judicialActTextVerified") is not False or
            row.get("topicId")=="restricted" or
            row.get("verificationLevel") not in
            ("official_registers_concordant","single_official_record_unchecked_live")):
            raise ValueError("Cannot automatically publish restricted or unverified decision")
        if not all(isinstance(row.get(k),str) and row[k].strip()
                   for k in ("courtSlug","uin","number","judgeName","sourceUrl")):
            raise ValueError("Missing public case identifier")
        u=urlsplit(row["sourceUrl"])
        if u.scheme!="https" or u.hostname not in OFFICIAL_CASE_DOMAINS or u.username or u.password or u.port:
            raise ValueError("Untrusted public case link")
        key=(row["courtSlug"],row["uin"],row["number"])
        if key in seen:
            raise ValueError("Duplicate public case key")
        seen.add(key)
        if len(json.dumps(row,ensure_ascii=False))>4500:
            raise ValueError("Unexpectedly large public case metadata row")
    return len(seen)


def validate_tracked_paths(paths):
    forbidden=[]
    for name in paths:
        path=name.replace("\\","/").lstrip("./")
        if path=="data/import/inbox/.gitkeep":
            # Deliberate empty tracked scaffold, not an original court export.
            continue
        if (path.startswith(("data/import/","data/source-snapshots/","sudy-private/",
                              "srv/sudy-private/")) or RAW_FILE_RE.search(path)):
            forbidden.append(path)
    if forbidden:
        # Never emit filenames of unreviewed dumps in CI logs.
        raise ValueError("Raw private dataset or staging file committed to GitHub")
    return len(paths)


def run(root=ROOT):
    roles=validate_catalog(read_bounded(root/"apps/web/app/data/moscow-official-dataset-catalog.json",MAX_CATALOG_BYTES))
    cases=validate_public_bulk(read_bounded(root/"apps/web/app/data/moscow-judge-bulk-cases.json",MAX_BULK_BYTES))
    tracked=subprocess.check_output(["git","-C",str(root),"ls-files","-z"]).decode("utf-8").split("\0")
    nfiles=validate_tracked_paths([x for x in tracked if x])
    return {
        "datasetIndexEntries":sum(roles.values()),
        "officialDatasetRoles":roles,
        "publishedReviewedCaseMetadataRows":cases,
        "trackedFilesChecked":nfiles,
        "rawCaseDatasetsCommitted":False,
        "rawParticipantsExposed":False,
        "networkUsed":False,
        "VPSUsed":False,
        "deploymentTriggered":False,
        "fullTextJudicialDecisionsVerifiedByThisCheck":False,
    }


if __name__=="__main__":
    print(json.dumps(run(),ensure_ascii=False,indent=2))
