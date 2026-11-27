"""Validate dated appellate hearing observations against two existing official court registers.

This does not fetch a live portal or claim a hearing happened. The file is
only a non-sensitive snapshot of what an official docket page said on a date.
"""
import json
import re
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlsplit

DATA=Path(__file__).resolve().parents[1]/"apps/web/app/data"
SNAPSHOTS=DATA/"moscow-appeal-hearing-snapshots.json"
CROSS=DATA/"moscow-judge-crosschecked-cases.json"
FIELDS={
 "courtSlug","caseNumber","uin","appealDocket","appealCaseNumber",
 "hearingDate","hearingTime","venueAsPublished","statusAsPublished",
 "observedOn","sourceUrl","appealResult","judicialActTextVerified","note"
}

def records(path):
 obj=json.loads(Path(path).read_text(encoding="utf-8"))
 if not isinstance(obj,dict) or not isinstance(obj.get("records"),list):
  raise ValueError("Missing reviewed records array")
 return obj["records"]

def validate(rows=None,links=None):
 rows=records(SNAPSHOTS) if rows is None else rows
 links=records(CROSS) if links is None else links
 refs={(x["courtSlug"],x["caseNumber"]):x for x in links}
 seen=set()
 for x in rows:
  if not isinstance(x,dict) or set(x)!=FIELDS:
   raise ValueError("Unexpected fields in public appointment record")
  if x["appealResult"] is not None or x["judicialActTextVerified"] is not False:
   raise ValueError("No outcome or full-text verification permitted from a hearing listing")
  if not all(isinstance(x[f],str) and x[f].strip() for f in FIELDS-{"appealResult","judicialActTextVerified"}):
   raise ValueError("All source and hearing descriptions are required")
  key=x["courtSlug"],x["caseNumber"]
  if key in seen or key not in refs:
   raise ValueError("Duplicate or unlinked official appellate case")
  seen.add(key)
  link=refs[key]
  witnesses=[w for w in link.get("witnesses",[]) if w.get("kind")=="appeal_registry"]
  if (len(witnesses)!=1 or link["uin"]!=x["uin"]
      or link["appealDocket"]!=x["appealDocket"] or link["appealResult"] is not None
      or witnesses[0]["sourceUrl"]!=x["sourceUrl"]):
   raise ValueError("Observed hearing does not match official appeal witness")
  if not re.fullmatch(r"33-\d{4,7}/20\d{2}",x["appealCaseNumber"]):
   raise ValueError("Expected exact appellate case number from published page")
  try:
   observed=date.fromisoformat(x["observedOn"])
   hearing=date.fromisoformat(x["hearingDate"])
   datetime.strptime(x["hearingTime"],"%H:%M")
  except (ValueError,TypeError) as exc:
   raise ValueError("Invalid official schedule date or time") from exc
  if observed>hearing or observed>date.today():
   raise ValueError("Observed date must not be after the appointment or in the future")
  if x["statusAsPublished"]!=(
   "Назначено судебное заседание на "+hearing.strftime("%d.%m.%Y")+" "+x["hearingTime"]):
   raise ValueError("Hearing status must agree with observed date/time")
  u=urlsplit(x["sourceUrl"])
  if (u.scheme!="https" or u.hostname not in
      {"mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru"} or
      u.username or u.password or u.port or u.query or u.fragment or
      not u.path.startswith("/mgs/services/cases/appeal-civil/details/")):
   raise ValueError("Untrusted appellate source URL")
  if any(s in x["note"].lower() for s in ("истец:","ответчик:","пересмотрено:","отменено:")):
   raise ValueError("Private parties or invented appellate result in public description")
 return len(rows)

if __name__=="__main__":
 print(f"Verified {validate()} dated appellate schedule observation(s); no court result inferred.")
