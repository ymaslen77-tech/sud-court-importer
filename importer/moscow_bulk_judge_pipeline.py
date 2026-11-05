#!/usr/bin/env python3
"""Prepare source-attributed Moscow judge/case data BEFORE mass publication.

Reads locally downloaded official JSON/NDJSON files, never downloads or publishes.
Accepts a first-instance file and optional appeal file. Produces PRIVATE NDJSON:
  candidates.ndjson, appeal_links.ndjson, quarantine.ndjson, report.json.
Does not copy participants, names of parties, full decision texts or birth dates.
Unknown JSON shapes and ambiguous judicial identities fail closed.
Usage:
 python importer/moscow_bulk_judge_pipeline.py --first /private/first.json \
   --appeal /private/appeal.json --output /private/moscow-prepared
Requires ijson for JSON files >20 MB.
"""
import argparse
from collections import Counter,defaultdict
from datetime import date
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import sys
from urllib.parse import urlsplit

HERE=Path(__file__).resolve().parent
DATA=HERE.parent/"apps/web/app/data"
sys.path.insert(0,str(HERE))
from ingest_moscow_judge_case_evidence import judge_sources,read_records

OFFICIAL={"mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru"}
FIELDS={
 "court":("Наименование суда","Наименование судебного органа","courtName","court_name","Суд"),
 "number":("Номер дела, материала, жалобы или производства","Номер дела","Номер судебного дела","caseNumber","case_number","number"),
 "uin":("Уникальный идентификатор дела","УИД","uniqueCaseId","uin","uid"),
 "judge":("Судья","Судья первой инстанции","judge","judgeName"),
 "category":("Категория судебного дела, материала, жалобы или производства","Категория дела","Категория судебного дела","category"),
 "outcome":("Результат рассмотрения","Результат рассмотрения дела","result","resultName"),
 "date":("Дата окончания","Дата решения","Дата рассмотрения","decisionDate","finishDate"),
 "url":("Ссылка на карточку дела","Ссылка на карточку судебного дела","caseUrl","case_url","url"),
 "acts":("Судебные акты","acts","documents"),
 "first":("Дело/документ в нижестоящей инстанции","Дело в нижестоящей инстанции","lowerCourtCases","lower"),
 "regdate":("Дата поступления дела в апелляционную инстанцию","Дата регистрации","registrationDate","dateReg"),
}
NUMBER=re.compile(r"^(?:0[12](?:а)?-\d+|13-\d+|3/[26]-\d+)/20\d\d$")
UIN=re.compile(r"^77RS\d{4}-\d{2}-20\d{2}-\d{6}-\d{2}$")
STATUSES=("Удовлетворено","Удовлетворено частично","Отказано в удовлетворении","Прекращено","Завершено")
BLOCKED=("семейн","алимент","усыновлен","несовершеннолетн","опек","удочер","развод")
TOPICS={
 "housing":("жилищ","жилого помещен","выселен","жкх"),
 "consumer":("потребител","защит прав потреб"),
 "employment":("трудов","заработн плат","увольнен","восстановлени на работ"),
 "credit":("кредит","договор займа","взыскани задолженн"),
 "construction":("долевое строительств","дду","застройщик"),
 "damage":("возмещени вреда","ущерб","дтп"),
 "property":("собственност","имуществен","недвижим"),
 "administrative":("кас рф","административн иск"),
}
def plain(x,limit=500):
 return str(x).strip()[:limit] if isinstance(x,(str,int,float)) and not isinstance(x,bool) else ""
def value(r,k):
 for a in FIELDS[k]:
  if a in r and r[a] is not None and r[a]!="":return r[a]
 return None
def norm(s):
 return re.sub(r"\s+"," ",s.lower().replace("ё","е")).strip()
def initials(s):
 p=norm(s).replace("."," ").split()
 if len(p)==3 and all(len(x)>1 for x in p):
  return p[0],p[1][0],p[2][0]
 return None
def extract_initials(s):
 s=norm(s)
 m=re.fullmatch(r"([а-я-]+)\s+([а-я])\s*\.?\s*([а-я])\s*\.?",s)
 return (m.group(1),m.group(2),m.group(3)) if m else None
def date_str(s):
 x=plain(s,32)
 try:
  if re.fullmatch(r"\d{2}\.\d{2}\.20\d{2}",x):
   return date(int(x[6:]),int(x[3:5]),int(x[:2])).isoformat()
  if re.fullmatch(r"20\d{2}-\d{2}-\d{2}",x):
   return date.fromisoformat(x).isoformat()
 except ValueError:pass
 return None
def url_check(s,prefix):
 if not isinstance(s,str):return False
 try:
  u=urlsplit(s)
  return (u.scheme=="https" and u.hostname in OFFICIAL and
   not (u.username or u.password or u.port) and u.path.startswith(prefix))
 except (TypeError,ValueError):return False
def uid(s):
 x=plain(s,60)
 return x if UIN.fullmatch(x) else None
def topic(s):
 t=norm(s)
 if any(b in t for b in BLOCKED):return "restricted"
 matches=[k for k,terms in TOPICS.items() if any(term in t for term in terms)]
 return matches[0] if len(matches)==1 else "other"
def shape(path):
 with path.open("rb") as f:
  start=f.read(128*1024).lstrip(b"\xef\xbb\xbf \r\n\t")
 if start.startswith(b"["):return "item"
 if start.startswith(b"{"):
  match=re.search(rb'"(data|records|items|results)"\s*:\s*\[',start)
  if match:return match.group(1).decode()+".item"
 raise ValueError("Unknown JSON array wrapper. Inspect real official export; do not guess.")
def records(path):
 if path.suffix.lower()==".ndjson":
  with path.open(encoding="utf-8-sig") as f:
   for line in f:
    if line.strip():yield json.loads(line)
 elif path.suffix.lower()==".json":
  if path.stat().st_size<20_000_000:
   data=json.loads(path.read_text(encoding="utf-8-sig"))
   if isinstance(data,dict):
    data=next((data[x] for x in ("data","records","items","results") if isinstance(data.get(x),list)),None)
   if not isinstance(data,list):raise ValueError("Input must contain a JSON array of court records")
   yield from data
  else:
   try:import ijson
   except ImportError as ex:raise ValueError("Install ijson for streaming large official JSON") from ex
   with path.open("rb") as f:yield from ijson.items(f,shape(path))
 else:raise ValueError("Only local .json and .ndjson exports accepted")
def sha256(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def court_directory():
 courts=read_records(DATA/"moscow-official-minimum-registry.json")
 codes={}
 for c in courts:
  if c["kind"]=="general-district":
   label=norm(c["name"])
   codes[label]=c["slug"]
   codes[label+" города москвы"]=c["slug"]
 assert len({v for v in codes.values()})==35
 judges=judge_sources()
 official={}
 for (slug,name),code in judges.items():
  if slug in official and official[slug]!=code:raise ValueError("Conflicting official court names: "+slug)
  official[slug]=code
 if len(official)!=35:raise ValueError("Incomplete 35-court official source mapping")
 return codes,official,judges
def judge_for(s,court,judges):
 raw=norm(plain(s,130))
 options={name for (slug,name) in judges if slug==court}
 if raw in options:return raw,"full_name"
 abbreviated=extract_initials(raw)
 if abbreviated:
  matches=[x for x in options if initials(x)==abbreviated]
  if len(matches)==1:return matches[0],"unique_official_initials"
 return None,"ambiguous_or_unknown"
def outcome(s):
 x=norm(plain(s,160))
 if not x:return None
 if "частич" in x and "удовлетвор" in x:return "Удовлетворено частично"
 if "отказано" in x and "удовлетворен" in x:return "Отказано в удовлетворении"
 if "удовлетворен" in x:return "Удовлетворено"
 if "прекращен" in x:return "Прекращено"
 return None
def safe_act_links(raw):
 links=[]
 if not isinstance(raw,list):return links
 for obj in raw[:10]:
  if not isinstance(obj,dict):continue
  u=next((v for k in ("Ссылка на акт","url","link") if isinstance((v:=obj.get(k)),str)),None)
  if url_check(u,"/rs/") or url_check(u,"/mgs/"):links.append(u)
 return links[:5]

# IMPORTANT: judgeTeam is not treated as an identified judge without evidence of its structure.
# dateFinal is not treated as a verified judicial decision date.
def first_row(raw,aliases,official,judges):
 if not isinstance(raw,dict):return None,"not_object"
 label=norm(plain(value(raw,"court"),150))
 court=aliases.get(label)
 if not court:return None,"court_not_in_35"
 number=plain(value(raw,"number"),80)
 if not NUMBER.fullmatch(number):return None,"invalid_number"
 u=uid(value(raw,"uin"))
 if not u:return None,"missing_or_invalid_uin"
 url=plain(value(raw,"url"),1000)
 if not url_check(url,"/rs/"+official[court]+"/services/cases/"):return None,"invalid_official_url"
 judge,kind=judge_for(value(raw,"judge"),court,judges)
 if not judge:return None,"unknown_or_ambiguous_judge"
 category=plain(value(raw,"category"),350)
 if not category:return None,"missing_category"
 t=topic(category)
 if t=="restricted":return None,"privacy_sensitive_category"
 finished=outcome(value(raw,"outcome"))
 day=date_str(value(raw,"date"))
 # A case-status string is NOT a judicial disposition. Pending is not a denial.
 status="outcome_recorded" if finished and day else "pending"
 return {
  "courtSlug":court,"judgeName":judge.title(),
  "number":number,"uin":u,
  "proceeding":"civil" if number.startswith("02") else "civil-exec" if number.startswith("13-") else "criminal-materials" if "3/" in number else "civil",
  "topicId":t,"category":category,"status":status,
  "outcome":finished if status=="outcome_recorded" else "Не установлено",
  "decisionDate":day if status=="outcome_recorded" else None,
  "sourceUrl":url,"sourceDataset":"official_moscow_open_data",
  "judgeAttribution":"judge_and_number_in_same_official_row" if kind=="full_name" else "initials_resolved_to_unique_official_roster_name",
  "sourceJudgeLabel":plain(value(raw,"judge"),130),
  "judicialActTextVerified":False,
  "officialDocumentCandidates":safe_act_links(value(raw,"acts")),
  "evidenceLevel":"official_dataset_record",
  "verificationLevel":"single_official_record_unchecked_live",
  "note":"Официальная машиночитаемая запись; полный текст и дата актуальности требуют дополнительной сверки."
 },None
def lower_refs(raw):
 value_=value(raw,"first")
 if not isinstance(value_,list):return []
 out=[]
 for x in value_:
  if not isinstance(x,dict):continue
  n=plain(next((x[k] for k in ("Номер дела в суде нижестоящей инстанции","Номер дела","caseNumber","number") if k in x),""))
  judge=plain(next((x[k] for k in ("Судья первой инстанции","Судья","judge") if k in x),""))
  if n and NUMBER.fullmatch(n):out.append({"number":n,"judgeLabel":judge})
 return out
def appeal_row(raw):
 if not isinstance(raw,dict):return None,"not_object"
 u=uid(value(raw,"uin"))
 if not u:return None,"missing_or_invalid_uin"
 url=plain(value(raw,"url"),1000)
 if not url_check(url,"/mgs/services/cases/appeal-"):return None,"invalid_appeal_url"
 d=date_str(value(raw,"regdate"))
 if not d:return None,"missing_appeal_registration"
 refs=lower_refs(raw)
 if not refs:return None,"missing_lower_case_reference"
 return {"uin":u,"appealUrl":url,"appealRegisteredOn":d,
   "appealDocket":plain(value(raw,"number"),60),"lower":refs,
   "reportedAppealResult":plain(value(raw,"outcome"),100) or None},None
def emit(f,row):
 f.write(json.dumps(row,ensure_ascii=False,separators=(",",":"))+"\n")
def run(first,appeal,output,max_rows=3000000):
 if not first.is_file() or (appeal and not appeal.is_file()):raise ValueError("Missing local official dataset")
 if max_rows<1:raise ValueError("max_rows must be positive")
 if output.exists() and any(output.iterdir()):raise ValueError("Output must be a new or empty directory")
 output.mkdir(parents=True,exist_ok=True)
 aliases,official,judges=court_directory()
 counts=Counter();counts["staged"]=0;covered=set();problems=[]
 # On-disk indexed storage: source files may be hundreds of MB. NEVER load all cases in RAM.
 db=sqlite3.connect(str(output/"private-stage.sqlite3"))
 try:
  db.execute("CREATE TABLE cases (court TEXT, uin TEXT, number TEXT, payload TEXT, held INTEGER DEFAULT 0, PRIMARY KEY(court,uin,number))")
  db.execute("CREATE INDEX court_uin_idx ON cases(uin)")
  with (output/"quarantine.ndjson").open("w",encoding="utf-8") as quarantine:
   for n,raw in enumerate(records(first),1):
    if n>max_rows:raise ValueError("Input limit exceeded; split files and rerun")
    counts["first_seen"]+=1
    result,reason=first_row(raw,aliases,official,judges)
    if reason:
     counts[reason]+=1
     # No raw record, party name or payload in the quarantine log.
     if len(problems)<500:problems.append({"index":n,"reason":reason})
     continue
    covered.add(result["courtSlug"])
    key=(result["courtSlug"],result["uin"],result["number"])
    by_number=db.execute("SELECT uin,payload FROM cases WHERE court=? AND number=?",(key[0],key[2])).fetchall()
    if any(item[0]!=key[1] for item in by_number):
     counts["conflicting_uin_same_court_number"]+=1
     db.execute("UPDATE cases SET held=1 WHERE court=? AND number=?",(key[0],key[2]))
     emit(quarantine,{"courtSlug":key[0],"number":key[2],"reason":"conflicting_uin_same_court_number"})
     continue
    prev=db.execute("SELECT payload,held FROM cases WHERE court=? AND uin=? AND number=?",key).fetchone()
    if prev:
     old=json.loads(prev[0])
     if any(old[k]!=result[k] for k in ("judgeName","status","outcome","decisionDate","category")):
      counts["contradictory_duplicates"]+=1
      db.execute("UPDATE cases SET held=1 WHERE court=? AND uin=? AND number=?",key)
      emit(quarantine,{"courtSlug":result["courtSlug"],"uin":result["uin"],"number":result["number"],"reason":"contradictory_duplicate"})
     else:counts["exact_duplicates"]+=1
     continue
    db.execute("INSERT INTO cases(court,uin,number,payload) VALUES(?,?,?,?)",(*key,json.dumps(result,ensure_ascii=False,separators=(",",":"))))
    if n%5000==0:db.commit()
   db.commit()
   if appeal:
    with (output/"appeal_links.ndjson").open("w",encoding="utf-8") as ap:
     linked=set()
     for n,raw in enumerate(records(appeal),1):
      if n>max_rows:raise ValueError("Appeal input limit exceeded")
      counts["appeal_seen"]+=1
      a,reason=appeal_row(raw)
      if reason:counts["appeal_"+reason]+=1;continue
      possible=db.execute("SELECT court,uin,number,payload,held FROM cases WHERE uin=?",(a["uin"],)).fetchall()
      matches=[v for v in possible if any(l["number"]==v[2] for l in a["lower"])]
      if len(matches)!=1:counts["appeal_unmatched_or_ambiguous"]+=1;continue
      court,uin_,number,payload,held=matches[0]
      item=json.loads(payload)
      if not any(
       norm(ref["judgeLabel"]) in (norm(item["sourceJudgeLabel"]),norm(item["judgeName"]))
       or (extract_initials(ref["judgeLabel"]) is not None and
           extract_initials(ref["judgeLabel"])==extract_initials(item["sourceJudgeLabel"]))
       for ref in a["lower"] if ref["number"]==number):
       counts["appeal_judge_mismatch"]+=1;continue
      key=(court,uin_,number)
      if key in linked:counts["appeal_duplicate_links"]+=1;continue
      linked.add(key)
      if held:continue
      item["verificationLevel"]="official_registers_concordant"
      db.execute("UPDATE cases SET payload=? WHERE court=? AND uin=? AND number=?",
       (json.dumps(item,ensure_ascii=False,separators=(",",":")),*key))
      counts["appeal_linked"]+=1
      emit(ap,{"courtSlug":court,"uin":uin_,"number":number,"judgeName":item["judgeName"],
       "firstInstanceUrl":item["sourceUrl"],"appealUrl":a["appealUrl"],
       "appealDocket":a["appealDocket"],"appealRegisteredOn":a["appealRegisteredOn"],
       "appealResult":None,"verificationLevel":"official_registers_concordant"})
     db.commit()
   with (output/"candidates.ndjson").open("w",encoding="utf-8") as good:
    for payload,held in db.execute("SELECT payload,held FROM cases ORDER BY court,uin,number"):
     if held:counts["held_conflict"]+=1;continue
     emit(good,json.loads(payload));counts["staged"]+=1
   emit(quarantine,{"_summary":"Rejected records are counted; no raw payload or participant identities copied.","counts":dict(counts),"sample":problems})
 finally:
  db.close()
 report={"schemaVersion":1,"mode":"stage_only","source":"https://data.mos-gorsud.ru/opendata",
  "firstSha256":sha256(first),"appealSha256":sha256(appeal) if appeal else None,"counts":dict(counts),
  "coveredCourts":len(covered),"autoPublished":False,"decisionTextsReviewed":0,
  "warning":"Private stage only. Verify export schema and original court records before any public promotion."}
 (output/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+chr(10),encoding="utf-8")
 return report
def main(argv=None):
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument("--first",type=Path,required=True)
 p.add_argument("--appeal",type=Path)
 p.add_argument("--output",type=Path,required=True)
 p.add_argument("--max-rows",type=int,default=3000000)
 a=p.parse_args(argv)
 report=run(a.first,a.appeal,a.output,a.max_rows)
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=="__main__":main()
