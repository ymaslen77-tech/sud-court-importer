"""Editorial promotion of a full-text official decision into a judge's case history.

Requires a real PDF/TXT file supplied by an editor. This does not download, scrape,
extract, publish or infer anything on its own. A full-text review is mandatory.

python importer/promote_moscow_judge_reasoning.py --staged review.json --check
python importer/promote_moscow_judge_reasoning.py --staged review.json --append
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

APP=Path(__file__).resolve().parents[1]/"apps"/"web"/"app"
DATA=APP/"data"
OUTPUT=DATA/"moscow-judge-reviewed-decisions.json"
COURTS=DATA/"moscow-official-minimum-registry.json"
CASE_RECORDS=DATA/"moscow-judge-case-evidence.json"
REVIEW_QUEUE=DATA/"moscow-court-judgment-review-queue.json"
FIELDS={"courtSlug","judgeName","caseNumber","courtCaseUrl","decisionDate",
        "officialFileSha256","reviewedOn","attributionConfirmed","fullTextVerified",
        "publicationPermissionChecked","personalDataReviewed","legalNorms",
        "judicialReasoningSummary","appealStatus"}
DOMAIN={"mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru"}

def read(path):
 result=json.loads(Path(path).read_text(encoding="utf-8"))
 if not isinstance(result,dict) or not isinstance(result.get("records"),list):
  raise ValueError("Expected JSON object with records array")
 return result

def norm(value):
 return re.sub(r"\s+"," ",value.lower().replace("ё","е")).strip()

def validate(row,cases,courts,blocked,already):
 if not isinstance(row,dict) or set(row)!=(FIELDS|{"localEvidenceFile","editorialVerified"}):
  raise ValueError("A staged record must have exactly the reviewed-decision fields plus evidence file and editorial flag")
 if row["editorialVerified"] is not True:
  raise ValueError("Explicit completed full-document editorial review required")
 if any(row[key] is not True for key in
        ("attributionConfirmed","fullTextVerified","publicationPermissionChecked","personalDataReviewed")):
  raise ValueError("Official full-text, authorship, privacy and publication rights must be confirmed")
 key=(row["courtSlug"],row["caseNumber"])
 if key in already:raise ValueError(f"Duplicate reviewed decision: {key}")
 if key in blocked:raise ValueError(f"Official judicial text unavailable or prohibited: {key}")
 case=cases.get(key)
 if case is None or case.get("status")!="outcome_recorded":
  raise ValueError(f"No verified finished judge-linked case: {key}")
 if norm(case["judgeName"])!=norm(row["judgeName"]):
  raise ValueError("Judge identity does not match same official case-list record")
 if case["topicId"]=="family":
  raise ValueError("Family-law full text not eligible for local publication")
 if not re.fullmatch(r"20[0-9]{2}-[0-9]{2}-[0-9]{2}",row["decisionDate"]):
  raise ValueError("Decision date missing")
 if not re.fullmatch(r"20[0-9]{2}-[0-9]{2}-[0-9]{2}",row["reviewedOn"]):
  raise ValueError("Review date missing")
 if not isinstance(row["legalNorms"],list) or not row["legalNorms"]:
  raise ValueError("At least one legal norm must be grounded in the reviewed full text")
 for n in row["legalNorms"]:
  if not isinstance(n,dict) or set(n)!={"law","article","reasoning"}:
   raise ValueError("Every reviewed norm needs law, article and explanation")
  if not all(isinstance(n.get(x),str) and len(n[x].strip())>=2 for x in ("law","article","reasoning")):
   raise ValueError("Empty or generic legal citation")
 if not isinstance(row["judicialReasoningSummary"],str) or len(row["judicialReasoningSummary"].strip())<40:
  raise ValueError("Review requires substantial case-specific legal reasoning")
 if row["appealStatus"]!="not_checked":
  raise ValueError("Appeal outcome requires separate source review workflow")
 u=urlsplit(row["courtCaseUrl"])
 official=courts[row["courtSlug"]]
 if (u.scheme!="https" or u.hostname not in DOMAIN or u.username or u.password or u.port
      or not u.path.startswith("/rs/"+official+"/services/cases/") or "/details/" not in u.path):
  raise ValueError("Case-specific official court details URL required")
 file_path=Path(row["localEvidenceFile"])
 if not file_path.is_file() or file_path.suffix.lower() not in {".pdf",".txt"}:
  raise ValueError("Editor must supply an actual official PDF or text copy")
 evidence=file_path.read_bytes()
 if len(evidence)<256 or (file_path.suffix.lower()==".pdf" and not evidence.startswith(b"%PDF-")):
  raise ValueError("Evidence must be a nonempty PDF or textual judicial act")
 digest=hashlib.sha256(evidence).hexdigest()
 if row["officialFileSha256"]!=digest:
  raise ValueError("Official source document SHA-256 does not match inspected file")
 return {k:row[k] for k in FIELDS}

def main(argv=None):
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument("--staged",type=Path,required=True)
 p.add_argument("--check",action="store_true")
 p.add_argument("--append",action="store_true")
 args=p.parse_args(argv)
 docs=read(args.staged)["records"]
 current=read(OUTPUT)
 courts={r["slug"]:r["source_url"].split("/rs/")[-1].split("/")[0]
         for r in read(COURTS)["records"] if r["kind"]=="general-district"}
 case_rows=read(CASE_RECORDS)["records"]
 cases={(r["courtSlug"],r["number"]):r for r in case_rows}
 blocked={(r["courtSlug"],r["number"]) for r in read(REVIEW_QUEUE)["records"]
          if r["publicationStatus"] in {"publication_forbidden","preparing_publication"}}
 seen={(r["courtSlug"],r["caseNumber"]) for r in current["records"]}
 output=[]
 for row in docs:
  clean=validate(row,cases,courts,blocked,seen)
  seen.add((clean["courtSlug"],clean["caseNumber"]))
  output.append(clean)
 if args.append:
  current["records"].extend(output)
  OUTPUT.write_text(json.dumps(current,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(f"Verified {len(output)} document(s) against locally supplied official full text. "
       f"Added: {len(output) if args.append else 0}.")

if __name__=="__main__":
 main()
