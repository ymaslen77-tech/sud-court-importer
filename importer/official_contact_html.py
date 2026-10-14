"""Offline contact change signals from already permitted official court HTML.

No HTTP calls, court updates, judicial appointments or authoritative role
inference. A disappeared phone is NOT proof that a public contact is obsolete.
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass, asdict
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

from contacts import ImportValidationError
from profile import official_url

MAX_HTML_BYTES=1_000_000
MAX_VISIBLE=150_000
SKIP={"script","style","svg","noscript","template"}
BREAKS={"p","div","tr","td","th","li","br","h1","h2","h3","h4","section","article"}
PHONE=re.compile(r"(?<!\d)(?:\+7|8)[\s\-–]*\(?\d{3}\)?(?:[\s\-–]*\d{2,3}){2,4}(?!\d)")
EMAIL=re.compile(r"(?<![\w.+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?![\w.-])")
PAGE_DATE=re.compile(r"последнее\s+обновление\s+выполнено\s+(\d{2}\.\d{2}\.\d{4})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?",re.I)

class VisibleHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip=0
        self.fragments=[]
    def handle_starttag(self,tag,attrs):
        tag=tag.lower()
        if tag in SKIP:self.skip+=1
        if tag in BREAKS and not self.skip:self.fragments.append("\n")
    def handle_endtag(self,tag):
        tag=tag.lower()
        if tag in SKIP and self.skip:self.skip-=1
        if tag in BREAKS and not self.skip:self.fragments.append("\n")
    def handle_data(self,value):
        if not self.skip:self.fragments.append(value)


@dataclass(frozen=True)
class Evidence:
    kind:str
    key:str
    example:str
    context:str

@dataclass(frozen=True)
class Signal:
    kind:str
    value:str
    event:str
    old_context:str|None
    new_context:str|None


def official_hours_url(url:str)->str:
    if not isinstance(url,str) or not official_url(url):
        raise ImportValidationError("Official HTTPS court URL required")
    parts=urlsplit(url)
    if parts.query or parts.fragment or not re.fullmatch(
        r"/rs/[a-z0-9-]{3,70}/help/hours/?",parts.path):
        raise ImportValidationError("Expected an official /rs/<court>/help/hours page")
    return url


def parse_html(data:bytes)->tuple[list[str],str]:
    if not 0<len(data)<=MAX_HTML_BYTES:
        raise ImportValidationError("HTML absent or exceeds 1 MB")
    try: page=data.decode("utf-8-sig")
    except UnicodeError as exc:raise ImportValidationError("HTML must be UTF-8") from exc
    parser=VisibleHTML()
    try:parser.feed(page);parser.close()
    except (ValueError,AssertionError) as exc:
        raise ImportValidationError("Invalid HTML") from exc
    text="".join(parser.fragments)
    if len(text)>MAX_VISIBLE:raise ImportValidationError("Excessive visible HTML content")
    lines=[" ".join(x.split()) for x in text.splitlines()]
    lines=[x for x in lines if x]
    if len(lines)>5000:raise ImportValidationError("Too many HTML lines")
    return lines,text


def phone_key(value:str)->str|None:
    digits=re.sub(r"\D","",value)
    if len(digits)!=11 or digits[0] not in "78":return None
    return "+7"+digits[1:]


def extract(data:bytes)->dict:
    lines,text=parse_html(data)
    if not lines or "суд" not in text.casefold():
        raise ImportValidationError("No court page text; refusing empty/incomplete snapshot")
    found={}
    for line in lines:
        for match in PHONE.finditer(line):
            key=phone_key(match.group())
            if key and ("phone",key) not in found:
                found[("phone",key)]=Evidence("phone",key,match.group().strip(),line[:320])
        for match in EMAIL.finditer(line):
            key=match.group().lower()
            if ("email",key) not in found:
                found[("email",key)]=Evidence("email",key,match.group(),line[:320])
    updated=PAGE_DATE.search(" ".join(lines))
    return {"html_sha256":sha256(data).hexdigest(),
            "page_last_updated": (" ".join(updated.groups(default="")).strip() if updated else None),
            "observations": [asdict(x) for x in sorted(found.values(),key=lambda v:(v.kind,v.key))],
            "court_facts_verified":False,"auto_published":0}


def compare(older:dict,newer:dict)->dict:
    old={(e["kind"],e["key"]):e for e in older["observations"]}
    new={(e["kind"],e["key"]):e for e in newer["observations"]}
    results=[]
    for k in sorted(new.keys()-old.keys()):
        e=new[k]
        results.append(asdict(Signal(e["kind"],e["key"],"newly_observed",None,e["context"])))
    for k in sorted(old.keys()-new.keys()):
        e=old[k]
        results.append(asdict(Signal(e["kind"],e["key"],"not_observed_in_new_snapshot",
                                     e["context"],None)))
    return {"older_sha256":older["html_sha256"],"newer_sha256":newer["html_sha256"],
            "signals":results,"signal_count":len(results),"auto_published":0,
            "removals_verified":False,"source_facts_verified":False}


def main():
    p=argparse.ArgumentParser(description="Compare saved official court HTML contacts, private review only")
    sub=p.add_subparsers(dest="action",required=True)
    inspect=sub.add_parser("inspect")
    inspect.add_argument("file",type=Path)
    inspect.add_argument("--source-url",required=True)
    diff=sub.add_parser("compare")
    diff.add_argument("older",type=Path)
    diff.add_argument("newer",type=Path)
    diff.add_argument("--source-url",required=True)
    args=p.parse_args()
    try:
        official_hours_url(args.source_url)
        paths=[args.file] if args.action=="inspect" else [args.older,args.newer]
        reports=[]
        for path in paths:
            if not path.is_file() or path.is_symlink() or path.stat().st_size>MAX_HTML_BYTES:
                raise ImportValidationError("Missing, symlinked or oversized saved HTML page")
            reports.append(extract(path.read_bytes()))
        result=reports[0] if args.action=="inspect" else compare(*reports)
        result["source_url"]=args.source_url
    except (ImportValidationError,OSError) as exc:
        p.exit(2,"Validation error: "+str(exc)+"\n")
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
