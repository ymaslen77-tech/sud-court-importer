"""Validate/merge manually reviewed Moscow judicial case-list extracts.

The tool NEVER scrapes portals, infers a decision, or infers a judge from a party's name.
Only append records after checking one official case-list row containing BOTH judge and
case number. No source full text or litigant information is reproduced.

Usage:
 python importer/ingest_moscow_judge_case_evidence.py --check
 python importer/ingest_moscow_judge_case_evidence.py --staged reviewed.json --check
 python importer/ingest_moscow_judge_case_evidence.py --staged reviewed.json --append

Input format: {"records":[{...fields of moscow-judge-case-evidence.json...,
  "editorialVerified":true}]}. The flag certifies human review, not automatic verification.
"""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

APP=Path(__file__).resolve().parents[1]/"apps"/"web"/"app"
DATA=APP/"data"
EVIDENCE=DATA/"moscow-judge-case-evidence.json"
NUM=re.compile(r"(?:0[12]-[0-9]+|13-[0-9]+|3/[26]-[0-9]+)/20[0-9]{2}\Z")
DATE=re.compile(r"20[0-9]{2}-[0-9]{2}-[0-9]{2}\Z")
ALLOWED_HOSTS={"mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru"}
ALLOWED_PROCEEDINGS={"civil","civil-exec","criminal","criminal-materials"}
ALLOWED_STATUSES={"pending","outcome_recorded"}
FIELDS={
 "courtSlug","judgeName","number","proceeding","topicId","category","status",
 "outcome","decisionDate","sourceUrl","evidenceLevel","judicialActTextVerified",
 "judgeAttribution","observedOn","note"
}
SOURCE_TAG="judge_and_number_in_same_official_row"

def norm(value):
 return re.sub(r"\s+"," ",value.lower().replace("ё","е")).strip()

def read_records(path):
 data=json.loads(Path(path).read_text(encoding="utf-8"))
 if not isinstance(data,dict) or not isinstance(data.get("records"),list):
  raise ValueError(f"Expected a JSON object with a records array: {path}")
 return data["records"]

def judge_sources():
 names={}
 for filename in ("moscow-district-judges-samples.json","moscow-legacy-judge-rosters.json"):
  for row in read_records(DATA/filename):
   for name in row["judges"]:
    key=(row["slug"],norm(name))
    if key in names:raise ValueError(f"Duplicate judge identity: {key}")
    names[key]=row["officialSlug"]
 for row in read_records(DATA/"moscow-judicial-source-briefs.json"):
  for person in row["people"]:
   key=(row["slug"],norm(person["name"]))
   if key in names:raise ValueError(f"Duplicate judge identity: {key}")
   source=urlsplit(person["sourceUrl"]).path
   official=source.split("/rs/")[1].split("/")[0]
   names[key]=official
 return names

def validate_record(row, judges, require_review=False):
 if not isinstance(row,dict):
  raise ValueError("A case entry must be a JSON object")
 extra=set(row)-(FIELDS|{"editorialVerified"})
 missing=FIELDS-set(row)
 if extra or missing:
  raise ValueError(f"Missing fields {sorted(missing)} or unexpected fields {sorted(extra)}")
 if require_review and row.get("editorialVerified") is not True:
  raise ValueError("Human editorialVerified=true required for staged imports")
 if not isinstance(row["courtSlug"],str) or not isinstance(row["judgeName"],str):
  raise ValueError("Court and judge must be explicit strings")
 key=(row["courtSlug"],norm(row["judgeName"]))
 if key not in judges:
  raise ValueError(f"No sourced judge with exact full name in that court: {key}")
 if not isinstance(row["number"],str) or not NUM.fullmatch(row["number"]):
  raise ValueError(f"Invalid official case number: {row['number']}")
 if row["proceeding"] not in ALLOWED_PROCEEDINGS:
  raise ValueError("Unknown case proceeding kind")
 if row["status"] not in ALLOWED_STATUSES:
  raise ValueError("Unknown decision status")
 if row["evidenceLevel"]!="official_case_list" or row["judgeAttribution"]!=SOURCE_TAG:
  raise ValueError("Only documented official judge+case-list attributions are accepted")
 if row["judicialActTextVerified"] is not False:
  raise ValueError("Full text verification requires a separate document review flow")
 if not isinstance(row["observedOn"],str) or not DATE.fullmatch(row["observedOn"]):
  raise ValueError("Missing date of source observation")
 if row["status"]=="pending":
  if row["decisionDate"] is not None or row["outcome"]!="Не установлено":
   raise ValueError("Pending record cannot state a decision")
 else:
  if (not isinstance(row["decisionDate"],str) or
      not DATE.fullmatch(row["decisionDate"]) or
      not isinstance(row["outcome"],str) or row["outcome"]=="Не установлено"):
   raise ValueError("Recorded outcome needs an exact published date and result")
 if not all(isinstance(row[x],str) and row[x].strip() for x in ("topicId","category","note","sourceUrl")):
  raise ValueError("Case topic, provenance and note are required")
 if any(word in (row["category"]+" "+row["note"]).lower() for word in
        ("истец:","ответчик:","подсудимый:","фамилия обвиняемого")):
  raise ValueError("Party-identifying details must not enter public case notes")
 uri=urlsplit(row["sourceUrl"])
 expected="/rs/"+judges[key]+"/services/cases/"
 if (uri.scheme!="https" or uri.hostname not in ALLOWED_HOSTS or uri.username
     or uri.password or uri.port or not uri.path.startswith(expected)):
  raise ValueError(f"Official court/source mismatch: {row['sourceUrl']}")
 return key

def validate_all(rows, judges, require_review=False):
 seen=set()
 for row in rows:
  validate_record(row,judges,require_review=require_review)
  key=(row["courtSlug"],row["number"])
  if key in seen:raise ValueError(f"Duplicate court+case identity: {key}")
  seen.add(key)
 return seen

def main(argv=None):
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument("--check",action="store_true",help="Validate without writing (default)")
 parser.add_argument("--staged",type=Path,help="Manually reviewed JSON records to merge")
 parser.add_argument("--append",action="store_true",help="Explicit permission to write new validated cases")
 args=parser.parse_args(argv)
 judges=judge_sources()
 existing=read_records(EVIDENCE)
 keys=validate_all(existing,judges)
 candidates=read_records(args.staged) if args.staged else []
 if candidates:validate_all(candidates,judges,require_review=True)
 added=[]
 for row in candidates:
  key=(row["courtSlug"],row["number"])
  if key in keys:
   # Do not overwrite a published decision based on a later source without review.
   raise ValueError(f"Existing court+case must be reconciled manually: {key}")
  keys.add(key)
  added.append({k:row[k] for k in FIELDS})
 if args.append:
  if not args.staged:parser.error("--append requires --staged")
  payload=json.loads(EVIDENCE.read_text(encoding="utf-8"))
  payload["records"].extend(added)
  EVIDENCE.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(f"Validated {len(existing)} existing case entries; {len(candidates)} staged; "
       f"{len(added) if args.append else 0} added. "
       f"Linked to {len(judges)} sourced judge identities.")

if __name__=="__main__":
 main()
