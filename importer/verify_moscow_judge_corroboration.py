"""Editorial corroboration of judicial case facts across official register records.

This gate validates cross-record identity, source URLs and field consistency. It does
not scrape the live portal; a researcher must inspect original pages when recording
the witnesses. Two sections on mos-gorsud.ru count as two register records, NOT
as two independently published sources. It cannot verify unseen decision reasoning.
Run: python importer/verify_moscow_judge_corroboration.py
"""
import json
from pathlib import Path
from urllib.parse import urlsplit

DATA=Path(__file__).resolve().parents[1]/"apps/web/app/data"
CASES=DATA/"moscow-judge-case-evidence.json"
CROSS=DATA/"moscow-judge-crosschecked-cases.json"
ROSTERS=[
 DATA/"moscow-district-judges-samples.json",
 DATA/"moscow-legacy-judge-rosters.json",
 DATA/"moscow-additional-judge-rosters.json",
]
def read(p):
 result=json.loads(Path(p).read_text(encoding="utf-8"))
 assert isinstance(result.get("records"),list)
 return result["records"]
def normalized(name):return name.lower().replace("ё","е").replace(".","").replace(" ","")
def verify(row,known_cases,known_judges):
 key=(row["courtSlug"],row["caseNumber"])
 case=known_cases.get(key)
 if not case:raise ValueError(f"Unknown case: {key}")
 if case["status"]!="outcome_recorded":raise ValueError(f"Pending case cannot be promoted: {key}")
 if case.get("uin") is not None and case["uin"]!=row["uin"]:
  raise ValueError("Case-list UIN conflicts with the primary and appellate source records")
 if normalized(row["judgeName"])!=normalized(case["judgeName"]):
  raise ValueError("Judge does not match first-instance case")
 if row["fullTextVerified"] is not False or row["appealResult"] is not None:
  raise ValueError("Unreviewed full text / unspecified appeal result cannot be promoted")
 if row["verificationLevel"]!="official_cross_register_agreement":
  raise ValueError("Only cross-register verification supported in this collection")
 if row["sourceGroup"]!="mos_gorsud_first_instance_and_appeal":
  raise ValueError("Different register records are not independent publishers")
 witnesses=row.get("witnesses",[])
 if len(witnesses)!=2 or {w["kind"] for w in witnesses}!={"first_instance","appeal_registry"}:
  raise ValueError("One first-instance and one appeal witness required")
 first=next(w for w in witnesses if w["kind"]=="first_instance")
 appeal=next(w for w in witnesses if w["kind"]=="appeal_registry")
 for w in witnesses:
  u=urlsplit(w["sourceUrl"])
  if u.scheme!="https" or u.hostname not in {"mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru"}:
   raise ValueError("Only original official court sources count")
  if u.username or u.password or u.port:
   raise ValueError("Invalid source URL")
  if (w["uin"]!=row["uin"] or w["caseNumber"]!=row["caseNumber"]
      or w["categoryCode"]!=row["categoryCode"]):
   raise ValueError("Official registers disagree on case identity/category")
  if normalized(w["judgeLabel"])!=normalized(first["judgeLabel"]):
   raise ValueError("Official registers disagree on judge attribution")
 expected=urlsplit(case["sourceUrl"]).path.split("/services/cases/")[0]
 if not urlsplit(first["sourceUrl"]).path.startswith(expected+"/services/cases/"):
  raise ValueError("First-instance court URL mismatch")
 if not urlsplit(first["sourceUrl"]).path.startswith("/rs/"):
  raise ValueError("Not a district first-instance case page")
 if not urlsplit(appeal["sourceUrl"]).path.startswith("/mgs/services/cases/appeal-"):
  raise ValueError("Second witness is not the official appellate register")
 if first["firstInstanceOutcome"]!=row["courtOutcome"] or case["outcome"]!=row["courtOutcome"]:
  raise ValueError("Published first-instance result conflicts with original case list")
 if first["appealRegisteredOn"] is not None:
  raise ValueError("First-instance record does not certify appeal registration")
 if appeal["firstInstanceOutcome"] is not None:
  raise ValueError("Appeal registration is not evidence of first-instance merits")
 if appeal["appealRegisteredOn"]!=row["appealRegisteredOn"]:
  raise ValueError("Appeal date must match separately registered appellate case")
 if row["courtDecisionDate"]!=case["decisionDate"]:
  raise ValueError("First-instance decision date mismatch")
 surname=row["judgeName"].split()[0]
 if not (first["judgeLabel"].lower().replace("ё","е").startswith(surname.lower().replace("ё","е"))
         and (row["courtSlug"],normalized(row["judgeName"])) in known_judges):
  raise ValueError("Judge surname not supported by official roster")
 if row["appealDocket"]=="":
  raise ValueError("Missing appellate registration number")
 return True

def validate(records=None):
 current=read(CROSS) if records is None else records
 cases={(c["courtSlug"],c["number"]):c for c in read(CASES)}
 judges={(r["slug"],normalized(n)) for p in ROSTERS for r in read(p) for n in r["judges"]}
 seen=set()
 for r in current:
  key=(r["courtSlug"],r["caseNumber"])
  if key in seen:raise ValueError("Duplicate cross-check")
  seen.add(key)
  verify(r,cases,judges)
 return len(current)

if __name__=="__main__":
 print(f"Corroborated {validate()} official cross-register case record(s); no appellate disposition inferred.")
