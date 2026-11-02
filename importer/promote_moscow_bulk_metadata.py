#!/usr/bin/env python3
"""Explicit, bounded promotion of OFFICIAL CASE METADATA into the site's JSON.

Precondition: importer/moscow_bulk_judge_pipeline.py produced a private stage.
--check performs a full preflight without writing. --apply requires acknowledgement
that the user reviewed actual export shape and the source's reuse conditions.
Never imports raw parties, document bodies or a purported legal reasoning summary.
Use a fresh stage from source, never treat one register as an independent legal audit.
"""
import argparse
from collections import Counter
from datetime import date
import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlsplit
from ingest_moscow_judge_case_evidence import judge_sources

DATA=Path(__file__).resolve().parents[1]/"apps/web/app/data"
PUBLIC=DATA/"moscow-judge-bulk-cases.json"
KNOWN=DATA/"moscow-judge-case-evidence.json"
SOURCE_URL="https://data.mos-gorsud.ru/opendata"
DOMAINS={"mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru"}
FIELDS={"courtSlug","judgeName","number","uin","proceeding","topicId","category",
 "status","outcome","decisionDate","sourceUrl","judgeAttribution","verificationLevel"}
CLEAN={"courtSlug","judgeName","number","uin","proceeding","topicId","category","status",
 "outcome","decisionDate","sourceUrl","sourceJudgeLabel","observedOn","note",
 "judgeAttribution","judicialActTextVerified","evidenceLevel","verificationLevel"}
def read(p):
 obj=json.loads(p.read_text(encoding="utf-8"))
 if not isinstance(obj,dict) or not isinstance(obj.get("records"),list):
  raise ValueError("Expected JSON records array: "+str(p))
 return obj
def check_row(x,mode):
 if not isinstance(x,dict) or not FIELDS.issubset(x):
  raise ValueError("Missing mandatory case identifiers/fields")
 if x["judicialActTextVerified"] is not False or x["verificationLevel"] not in (
   "official_registers_concordant","single_official_record_unchecked_live"):
  raise ValueError("Unverified legal conclusions or unknown provenance")
 if x["status"] not in ("outcome_recorded","pending"):
  raise ValueError("Unknown case outcome status")
 if x["status"]=="pending" and (x["decisionDate"] is not None or x["outcome"]!="Не установлено"):
  raise ValueError("Pending case incorrectly has an outcome")
 if x["status"]=="outcome_recorded" and (not x["decisionDate"] or x["outcome"]=="Не установлено"):
  raise ValueError("Result missing date or disposition")
 if not re.fullmatch(r"77RS\d{4}-\d{2}-20\d{2}-\d{6}-\d{2}",x["uin"]):
  raise ValueError("Bad UIN")
 if not re.fullmatch(r"(?:0[12](?:а)?-\d+|13-\d+|3/[26]-\d+)/20\d{2}",x["number"]):
  raise ValueError("Bad case number")
 if not re.fullmatch(r"[a-z][a-z0-9_-]+",x["courtSlug"]):
  raise ValueError("Bad court ID")
 if not isinstance(x["judgeName"],str) or len(x["judgeName"].split())<2:
  raise ValueError("Judge must have full sourced name")
 judge_key=(x["courtSlug"]," ".join(x["judgeName"].lower().replace("ё","е").split()))
 sources=judge_sources()
 if judge_key not in sources:
  raise ValueError("Judge is not linked to an official court roster or appointment")
 official_path="/rs/"+sources[judge_key]+"/services/cases/"
 if x["judgeAttribution"] not in (
  "judge_and_number_in_same_official_row","initials_resolved_to_unique_official_roster_name"):
  raise ValueError("Invalid judicial attribution")
 if x["topicId"]=="restricted":
  raise ValueError("Sensitive/protected categories not accepted")
 u=urlsplit(x["sourceUrl"])
 if u.scheme!="https" or u.hostname not in DOMAINS or u.username or u.password or u.port or not u.path.startswith(official_path):
  raise ValueError("Original court URL required")
 if len(x["category"])>350 or len(x["note"])>600:
  raise ValueError("Overlong public field")
 if mode=="crosschecked" and x["verificationLevel"]!="official_registers_concordant":
  return False
 return True

def promote(prepared,max_per_court=100,max_per_judge=25,mode="official",apply=False,ack=False):
 if mode not in ("official","crosschecked"):raise ValueError("Invalid mode")
 if not 1<=max_per_court<=250 or not 1<=max_per_judge<=50:
  raise ValueError("Per-court and per-judge caps enforced to keep deployment manageable")
 if apply and not ack:raise ValueError("Apply requires --ack-source-terms")
 report=read_report(prepared/"report.json")
 if report.get("autoPublished") is not False or report.get("mode")!="stage_only":
  raise ValueError("Only unopened private official preflight stages accepted")
 if not isinstance(report.get("firstSha256"),str) or len(report["firstSha256"])!=64:
  raise ValueError("Missing original export fingerprint")
 if not (prepared/"candidates.ndjson").is_file():raise ValueError("No candidate stage")
 existing=read(KNOWN)["records"]
 dest=read(PUBLIC)
 keys={(x["courtSlug"],x.get("uin") or "",x["number"]) for x in existing+dest["records"]}
 by_number={(x["courtSlug"],x["number"]):x.get("uin") for x in existing+dest["records"]}
 ccount=Counter(x["courtSlug"] for x in dest["records"])
 jcount=Counter((x["courtSlug"],x["judgeName"]) for x in dest["records"])
 new=[];stats=Counter();today=date.today().isoformat()
 with (prepared/"candidates.ndjson").open(encoding="utf-8") as f:
  for n,line in enumerate(f,1):
   if not line.strip():continue
   if n>3_000_000:raise ValueError("Candidate limit; split into distinct batches")
   stats["seen"]+=1
   x=json.loads(line)
   if not check_row(x,mode):
    stats["single_source_skipped"]+=1;continue
   key=(x["courtSlug"],x["uin"],x["number"])
   old_id=by_number.get((x["courtSlug"],x["number"]))
   if (x["courtSlug"],x["number"]) in by_number and old_id!=x["uin"]:
    raise ValueError("Same court and case number carry contradictory UIDs; reconcile manually")
   if key in keys:
    stats["already_present"]+=1;continue
   if ccount[x["courtSlug"]]>=max_per_court or jcount[(x["courtSlug"],x["judgeName"])]>=max_per_judge:
    stats["cap_reached"]+=1;continue
   # Output is strictly positive-list fields, never raw names of litigants/JSON acts.
   row={k:v for k,v in x.items() if k in CLEAN}
   row.pop("sourceJudgeLabel",None)
   row["evidenceLevel"]="official_dataset_record"
   row["judicialActTextVerified"]=False
   row["observedOn"]=today
   row["note"]="Сведения из официальной выгрузки судов Москвы. "+(
    "Реестровые данные согласуются с апелляцией; мотивировка акта не проверялась."
     if x["verificationLevel"]=="official_registers_concordant" else
    "Сведения подтверждены одним реестром; требуется проверить актуальность карточки.")
   keys.add(key);by_number[(x["courtSlug"],x["number"])]=x["uin"];new.append(row)
   ccount[x["courtSlug"]]+=1;jcount[(x["courtSlug"],x["judgeName"])]+=1
   stats["accepted"]+=1
 if apply and new:
  # Atomic write. Private original backup must never be copied into the public web image.
  result={**dest,"records":dest["records"]+new,"source":SOURCE_URL}
  private=Path(os.environ.get("MOSCOW_PRIVATE_BACKUP_DIR",
   str(Path(__file__).resolve().parents[1]/"data/import/backups")))
  private.mkdir(parents=True,exist_ok=True)
  backup=private/("moscow-judge-bulk-"+date.today().isoformat()+".json")
  if backup.exists():raise ValueError("Existing private backup; move it before another apply")
  backup.write_bytes(PUBLIC.read_bytes())
  with tempfile.NamedTemporaryFile(mode="w",encoding="utf-8",dir=str(PUBLIC.parent),suffix=".tmp",delete=False) as tmp:
   json.dump(result,tmp,ensure_ascii=False,indent=2)
   tmp.write(chr(10));staged=Path(tmp.name)
  os.replace(staged,PUBLIC)
 return {"mode":"applied" if apply else "dry_run","sourceDatasetSha256":report["firstSha256"],
  "accepted":len(new),"existing":len(dest["records"]),"total":len(dest["records"])+len(new),
  "counts":dict(stats),"publisher":"local Git checkout only; commit/push and Coolify redeploy required",
  "fullTextReviewed":0}

def read_report(p):
 if not p.is_file():raise ValueError("Missing stage report")
 return json.loads(p.read_text(encoding="utf-8"))
def main(argv=None):
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument("--prepared",type=Path,required=True)
 p.add_argument("--mode",choices=("official","crosschecked"),default="official")
 p.add_argument("--max-per-court",type=int,default=100)
 p.add_argument("--max-per-judge",type=int,default=25)
 p.add_argument("--apply",action="store_true")
 p.add_argument("--ack-source-terms",action="store_true")
 a=p.parse_args(argv)
 print(json.dumps(promote(a.prepared,a.max_per_court,a.max_per_judge,a.mode,a.apply,a.ack_source_terms),ensure_ascii=False,indent=2))
if __name__=="__main__":main()
