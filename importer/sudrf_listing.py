"""Offline adapter for saved official sudrf regional federal-courts listings.

Does NOT fetch URLs. It reads a user-supplied HTML or text snapshot of a
specific official regional search page. Listing format was checked against
the 2026-10-13 official Novosibirsk listing, including RS/OS/GV/KV/AJ codes.

Examples:
  python importer/sudrf_listing.py extract /input/novosibirsk.html \
    --region 54 --region-name "Новосибирская область" \
    --source-url 'https://sudrf.ru/index.php?act=go_search&court_subj=54&id=300&searchtype=fs' \
    --out /input-output/novosibirsk.json
  python importer/sudrf_listing.py validate /input/novosibirsk.html ...flags...
  python importer/sudrf_listing.py stage /input/novosibirsk.html ...flags...

The resulting JSON can be validated and staged by importer/federation.py.
No direct writes into published courts occur.
"""
from __future__ import annotations

import argparse
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, urlsplit

from contacts import ImportValidationError, MAX_BYTES
from federation import parse_export as validate_export, stage as stage_federal

CODE = re.compile(r"Классификационный\s+код\s*:\s*([0-9]{2}[A-Z]{2,3}[0-9]{4})",re.I)
FIELD = re.compile(
    r"Адрес\s*:\s*(?P<address>.*?)\s+Телефон\s*:\s*(?P<phone>.*?)"
    r"\s+E-?mail\s*:\s*(?P<email>.*?)\s+Официальный\s+сайт\s*:\s*(?P<site>.*)",
    re.I | re.S,
)
URL = re.compile(r"https?://[a-z0-9.-]+(?::[0-9]+)?(?:/[^\s<>\"']*)?",re.I)
TYPES = {
    "RS":"Районный или городской суд",
    "OS":"Суд субъекта Российской Федерации",
    "GV":"Гарнизонный военный суд",
    "KV":"Кассационный военный суд",
    "AJ":"Апелляционный суд общей юрисдикции",
}


class ItemText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth=0
        self.parts:list[str]=[]
        self.items:list[str]=[]

    def handle_starttag(self,tag,attrs):
        if tag=="li":
            if self.depth==0:self.parts=[]
            self.depth+=1
        elif self.depth and tag in ("br","p","div","tr"):
            self.parts.append(" ")

    def handle_endtag(self,tag):
        if tag=="li" and self.depth:
            self.depth-=1
            if self.depth==0:
                item=" ".join("".join(self.parts).split())
                if CODE.search(item):self.items.append(item)
        elif self.depth and tag in ("p","div","tr"):
            self.parts.append(" ")

    def handle_data(self,data):
        if self.depth:self.parts.append(data+" ")


def canonical_source(region:str,source_url:str):
    try:
        u=urlsplit(source_url)
        args=parse_qs(u.query)
        if (u.scheme!="https" or u.hostname!="sudrf.ru" or u.path!="/index.php"
            or u.username or u.password or u.port not in (None,443)
            or args.get("act")!=["go_search"] or args.get("court_subj")!=[region]
            or args.get("searchtype")!=["fs"] or args.get("id")!=["300"]):
            raise ImportValidationError("Source must be exact official sudrf regional federal listing")
    except ValueError as exc:
        raise ImportValidationError("Invalid regional source URL") from exc


def parse_card(card:str,region:str,region_name:str,source_url:str):
    codes=CODE.findall(card)
    if len(codes)!=1:
        raise ImportValidationError("Ambiguous classification codes in court card")
    code=codes[0]
    if code[:2]!=region or code[2:4] not in TYPES:
        raise ImportValidationError("Unexpected region or unsupported court code")
    head=card[:CODE.search(card).start()].strip(" -*\n\r\t")
    if not head.endswith(region_name):
        raise ImportValidationError("Region label not found immediately before classification code")
    name=head[:-len(region_name)].strip()
    if not name or len(name)>250:
        raise ImportValidationError("Court name missing or too long")
    match=FIELD.search(card[CODE.search(card).end():])
    if not match:
        raise ImportValidationError("Missing address / telephone / email / site labels")
    address=" ".join(match["address"].split())
    phone=" ".join(match["phone"].split()) or None
    email=" ".join(match["email"].split()) or None
    site=URL.search(match["site"])
    if not site:
        raise ImportValidationError("No court website URL")
    website=site.group(0).rstrip(".,;)")
    if not address:
        raise ImportValidationError("Address is missing; stage partial record through discovery instead")
    return {
        "courtCode":code,
        "regionCode":region,
        "regionName":region_name,
        "courtName":name,
        "courtType":TYPES[code[2:4]],
        "courtAddress":address,
        "courtTelephone":phone,
        "courtEmail":email,
        "courtSiteUrl":website,
        "sourceRecordUrl":source_url,
    }


def extract(raw:bytes,region:str,region_name:str,source_url:str):
    if not re.fullmatch(r"[0-9]{2}",region):
        raise ImportValidationError("region must be two digits")
    if not isinstance(region_name,str) or not 2<=len(region_name)<=120:
        raise ImportValidationError("region-name required")
    canonical_source(region,source_url)
    if not raw or len(raw)>MAX_BYTES:
        raise ImportValidationError("Snapshot is empty or exceeds 5 MB")
    try:
        text=raw.decode("utf-8-sig")
    except UnicodeError as exc:
        raise ImportValidationError("Expected UTF-8 official page snapshot") from exc
    if "<html" in text[:2000].lower() or "<li" in text[:2000].lower():
        parser=ItemText()
        parser.feed(text)
        cards=parser.items
    else:
        # Browser-exported page plaintext. Each court entry starts with
        # its name, region and official classification code.
        headline=re.compile(
            r"(?m)^\s*(?:[-*]\s*)?[^\n]{3,260}"+re.escape(region_name)
            +r"\s+Классификационный\s+код\s*:\s*"+re.escape(region)+r"[A-Z]{2,3}[0-9]{4}\s*$"
        )
        starts=[m.start() for m in headline.finditer(text)]
        cards=[text[begin:(starts[i+1] if i+1<len(starts) else len(text))]
               for i,begin in enumerate(starts)]
    if not cards:
        raise ImportValidationError("No official court entries recognized (no partial import)")
    results=[]
    seen=set()
    for index,card in enumerate(cards,1):
        try:
            record=parse_card(card,region,region_name,source_url)
        except ImportValidationError as exc:
            raise ImportValidationError(f"Court card {index}: {exc}") from exc
        if record["courtCode"] in seen:
            raise ImportValidationError(f"Duplicate court code {record['courtCode']}")
        seen.add(record["courtCode"])
        results.append(record)
    results.sort(key=lambda x:x["courtCode"])
    # Preserve existing federation validations and avoid direct publication.
    data=json.dumps(results,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode("utf-8")
    validate_export(data,"sudrf-federal")
    return data,results


def main():
    p=argparse.ArgumentParser(description="Read a saved official sudrf page without network access")
    p.add_argument("command",choices=("extract","validate","stage"))
    p.add_argument("file",type=Path)
    p.add_argument("--region",required=True)
    p.add_argument("--region-name",required=True)
    p.add_argument("--source-url",required=True)
    p.add_argument("--out",type=Path)
    args=p.parse_args()
    try:
        if not args.file.is_file():
            raise ImportValidationError("Page snapshot is not a file")
        raw=args.file.read_bytes()
        normalized,records=extract(raw,args.region,args.region_name,args.source_url)
        if args.command=="extract":
            if args.out is None:
                raise ImportValidationError("--out is required for extract")
            if args.out.resolve()==args.file.resolve():
                raise ImportValidationError("Will not overwrite primary source snapshot")
            if not args.out.parent.is_dir():
                raise ImportValidationError("Output directory must already exist")
            args.out.write_bytes(normalized)
            output={"output":str(args.out),"records":len(records),"published":0,
                    "source_sha256":sha256(raw).hexdigest()}
        elif args.command=="validate":
            output={"records":len(records),"codes":[r["courtCode"] for r in records[:10]],
                    "published":0,"source_sha256":sha256(raw).hexdigest()}
        else:
            output=stage_federal(normalized,validate_export(normalized,"sudrf-federal"),"sudrf-federal")
            output["source_sha256"]=sha256(raw).hexdigest()
    except ImportValidationError as exc:
        p.exit(2,f"Validation error: {exc}\n")
    print(json.dumps(output,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
