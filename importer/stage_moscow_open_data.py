#!/usr/bin/env python3
"""Stage official Moscow court open-data cases safely, without publishing unreviewed acts.

Accept a locally downloaded official JSON (.json or .ndjson) export. For large arrays,
install optional ijson (python -m pip install ijson) for bounded-memory parsing.
This program never downloads from a portal, writes people's names or copies PDFs.
"""
import argparse
from collections import Counter
from datetime import date
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

COURT_SLUGS={
 "бабушкинский":"babushkinskij","басманный":"basmannyj",
 "гагаринский":"gagarinskij","замоскворецкий":"zamoskvoreckij",
 "кузьминский":"kuzminskij","лефортовский":"lefortovskij",
 "мещанский":"meshchanskij","никулинский":"nikulinskij",
 "пресненский":"presnenskij","таганский":"taganskij",
 "хамовнический":"hamovnicheskij","щербинский":"shcherbinskij"
}
# All labels are read from the open-data public field definitions, not from
# details of participants. Unmapped subjects remain "other" for human review.
ALIASES={
 "court":("Наименование суда","Наименование судебного органа","Суд","courtName","court_name"),
 "number":("Номер дела, материала, жалобы или производства","Номер дела","Номер судебного дела","caseNumber","case_number"),
 "category":("Категория судебного дела, материала, жалобы или производства","Категория дела","Категория судебного дела","category","categoryName"),
 "result":("Результат рассмотрения","Результат рассмотрения дела","Текущее состояние судебного дела","result","resultName"),
 "date":("Дата окончания","Дата рассмотрения","Дата решения","decisionDate","finishDate"),
 "docket":("Ссылка на карточку дела","Ссылка на карточку судебного дела","caseUrl","case_url"),
 "acts":("Судебные акты","acts","documents")
}
TOPICS={
 "labor":("увольнен","восстановлени на работ","трудов","заработн плат","работодател","сокращен","отпускн"),
 "housing":("жилого помещен","жилищн","коммунальн","жкх","выселени"),
 "family":("алимент","родительск прав","расторжени брака","усыновлен","раздел имущества супруг"),
 "credit":("кредитн","договор займа","задолженност"),
 "fraud":("мошеннич","ст. 159","статья 159"),
 "consumer":("защита прав потребител","потребител"),
 "damage":("дтп","дорожно-транспортн","возмещени вреда","возмещени ущерба"),
 "bailiffs":("судебн пристав","фссп","исполнительного производств"),
 "social":("пенсионн","социальн обеспечен","социальн выплат"),
 "property":("недвижим","долевого строительств","аренд","собственност","неосновательн обогащен")
}
VALID_STATUS=("Удовлетворен","Отказано","Частично удовлетворен","Прекращено","Вынесено решение","Приговор","Оправдан","Осужден","Иск удовлетворен")

def txt(v,limit=600):
    return str(v).strip()[:limit] if isinstance(v,(str,int,float)) else ""

def field(rec,key):
    for n in ALIASES[key]:
        if n in rec and rec[n] not in (None,""):return rec[n]
    return ""

def url_ok(raw,court_slug):
    try:
        p=urlsplit(raw)
        return (p.scheme=="https" and p.hostname in
          ("mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru") and
          not p.port and not p.username and not p.password and
          p.path.startswith("/rs/"+court_slug+"/services/cases/"))
    except (ValueError,TypeError):return False

def court_slug(name):
    s=txt(name).lower().replace("ё","е")
    if not s.endswith("районный суд города москвы") and "районный суд" not in s:return None
    return next((v for k,v in COURT_SLUGS.items() if s.startswith(k+" ")),None)

def topic(category):
    s=category.lower().replace("ё","е")
    ids=[id for id,terms in TOPICS.items() if any(term in s for term in terms)]
    return ids[0] if len(ids)==1 else "other"

def date_only(raw):
    s=txt(raw,50)
    if re.fullmatch(r"20\d\d-\d\d-\d\d",s):
        try:date.fromisoformat(s);return s
        except ValueError:return ""
    if re.fullmatch(r"\d\d\.\d\d\.20\d\d",s):
        try:return date.fromisoformat(s[6:]+"-"+s[3:5]+"-"+s[:2]).isoformat()
        except ValueError:return ""
    return ""

def iter_rows(path):
    if path.suffix.lower()==".ndjson":
        with path.open(encoding="utf-8-sig") as f:
            for lineno,line in enumerate(f,1):
                if line.strip():
                    try:row=json.loads(line)
                    except json.JSONDecodeError as ex:raise ValueError(f"invalid JSON at line {lineno}") from ex
                    yield row
        return
    if path.suffix.lower()!=".json":raise ValueError("Only downloaded .json or .ndjson exports accepted")
    if path.stat().st_size>20_000_000:
        try:import ijson
        except ImportError as ex:raise ValueError("Large JSON: install ijson before streaming") from ex
        with path.open("rb") as f:
            for row in ijson.items(f,"item"):
                yield row
        return
    obj=json.loads(path.read_text(encoding="utf-8-sig"))
    if isinstance(obj,dict):
        obj=next((obj[k] for k in ("data","records","items","results") if isinstance(obj.get(k),list)),None)
    if not isinstance(obj,list):raise ValueError("Expected official array of cases; inspect the export schema")
    yield from obj

def stage(input_path,output_path,max_records=250000):
    source=Path(input_path).resolve(strict=True)
    out=Path(output_path).resolve()
    if out==source or out.exists():raise ValueError("Output must be a new separate file")
    if out.suffix.lower()!=".json":raise ValueError("Output must be a JSON file")
    staged=[];seen=set();stats=Counter();by_topic=Counter()
    for idx,record in enumerate(iter_rows(source)):
        if idx>=max_records:raise ValueError("Input record limit reached; split input explicitly")
        stats["seen"]+=1
        if not isinstance(record,dict):stats["non_object"]+=1;continue
        court=court_slug(field(record,"court"))
        if not court:stats["not_selected_court"]+=1;continue
        number=txt(field(record,"number"),80)
        if not re.fullmatch(r"0[12](?:а)?-\d+/20\d\d",number):stats["invalid_number"]+=1;continue
        url=txt(field(record,"docket"),400)
        if not url_ok(url,court):stats["invalid_official_docket"]+=1;continue
        category=txt(field(record,"category"),450)
        if not category:stats["missing_category"]+=1;continue
        key=(court,number)
        if key in seen:stats["duplicate"]+=1;continue
        seen.add(key)
        outcome=txt(field(record,"result"),180)
        # Import only official docket metadata. The displayed "outcome" stays unverified
        # until an editor checks it against the linked court record.
        documents=field(record,"acts")
        doc_urls=[]
        if isinstance(documents,list):
            for item in documents[:6]:
                if isinstance(item,dict):
                    raw=next((txt(item.get(k),500) for k in ("Ссылка на акт","url","link") if item.get(k)), "")
                    if raw.startswith("https://") and urlsplit(raw).hostname in ("mos-gorsud.ru","www.mos-gorsud.ru","m.mos-gorsud.ru"):
                        doc_urls.append(raw)
        t=topic(category)
        staged.append({"court_slug":court,"number":number,"topic_id":t,
          "official_category":category,"docket_url":url,"official_outcome_unverified":outcome,
          "decision_date_unverified":date_only(field(record,"date")),
          "official_document_candidates":doc_urls,
          "editorial_status":"research_only","document_status":"not_reviewed",
          "full_document_verified":False,"source":"data.mos-gorsud.ru",
          "contains_party_information":False})
        by_topic[(court,t)]+=1
        stats["staged"]+=1
    report={"source_file_sha256":hashlib.sha256(source.read_bytes()).hexdigest() if source.stat().st_size<30_000_000 else None,
      "source_dataset":"Official Moscow courts open-data JSON (manually obtained)",
      "retrieved_on":date.today().isoformat(),
      "counts":dict(stats),
      "per_court_topic":[{"court_slug":c,"topic_id":t,"staged":n,"verified_full_documents":0,"target_if_permitted":50}
         for (c,t),n in sorted(by_topic.items())],
      "auto_published":False,"editorial_review_required":True,
      "records":staged}
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return report

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input",required=True)
    parser.add_argument("--output",required=True)
    parser.add_argument("--max-records",type=int,default=250000)
    args=parser.parse_args()
    report=stage(args.input,args.output,args.max_records)
    print(json.dumps({k:report[k] for k in ("counts","auto_published","editorial_review_required")},ensure_ascii=False))
