"""Bounded single-file download of an original official publication PDF.

Does not discover documents, bypass anti-bot protections, or assert legal
validity. The PDF's SHA-256 is computed from the actual downloaded bytes.

Usage:
  python importer/jurisdiction_pdf_acquire.py 5400202610010007 original-149-oz.pdf
"""
from __future__ import annotations

import argparse
from hashlib import sha256
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import URLError, HTTPError

MAX_BYTES=250_000_000
PUBLICATION_HOST="publication.pravo.gov.ru"


class AcquisitionError(ValueError):
    pass


class OfficialOnlyRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        split=urlsplit(newurl)
        if split.scheme!="https" or split.hostname!=PUBLICATION_HOST or split.port not in (None,443):
            raise AcquisitionError("Redirect outside the HTTPS official publication host")
        return super().redirect_request(req,fp,code,msg,headers,newurl)


def acquire(eo_number:str,destination:Path)->dict:
    if not (isinstance(eo_number,str) and len(eo_number)==16 and eo_number.isdecimal()):
        raise AcquisitionError("Expected exact 16-digit official publication number")
    if destination.exists():
        raise AcquisitionError("Destination already exists: will not overwrite evidence")
    destination.parent.mkdir(parents=True,exist_ok=True)
    url=f"https://{PUBLICATION_HOST}/File/Pdf?eoNumber={eo_number}"
    req=Request(url,headers={"User-Agent":"SudyRossii-LegalSourceAudit/1.0","Accept":"application/pdf"})
    tmp=destination.with_name(destination.name+".partial")
    if tmp.exists():
        raise AcquisitionError("A partial download already exists; inspect it first")
    size=0
    digest=sha256()
    try:
        with build_opener(OfficialOnlyRedirect).open(req,timeout=25) as r:
            if r.status!=200:
                raise AcquisitionError("Official PDF server returned "+str(r.status))
            declared=r.headers.get("content-length")
            if declared and declared.isdigit() and int(declared)>MAX_BYTES:
                raise AcquisitionError("PDF exceeds bounded 250 MB limit")
            content_type=r.headers.get("content-type","").split(";",1)[0].lower()
            if content_type not in ("application/pdf","application/octet-stream"):
                raise AcquisitionError("Unexpected source MIME type: "+content_type)
            with tmp.open("xb") as out:
                first=True
                while True:
                    part=r.read(1024*1024)
                    if not part:break
                    if first:
                        if not part.startswith(b"%PDF-"):
                            raise AcquisitionError("Official endpoint did not return PDF bytes")
                        first=False
                    size+=len(part)
                    if size>MAX_BYTES:
                        raise AcquisitionError("PDF exceeds bounded 250 MB limit")
                    digest.update(part)
                    out.write(part)
                out.flush()
                os.fsync(out.fileno())
        if size<1024:
            raise AcquisitionError("Document was unexpectedly short")
        tmp.replace(destination)
    except Exception:
        if tmp.exists():tmp.unlink()
        raise
    return {
        "publication_number":eo_number,"official_url":url,
        "pdf_sha256":digest.hexdigest(),"bytes":size,
        "saved_to":str(destination),"legal_annexes_verified":0,
        "notes":"Byte integrity recorded; manual source and annex verification required"
    }


def main():
    p=argparse.ArgumentParser(description="Download a single original official PDF with bounds")
    p.add_argument("publication_number")
    p.add_argument("output",type=Path)
    args=p.parse_args()
    try:
        print(json.dumps(acquire(args.publication_number,args.output),ensure_ascii=False,indent=2))
    except (AcquisitionError,OSError,TimeoutError,URLError,HTTPError) as exc:
        p.exit(2,"Official PDF could not be obtained: "+str(exc)+"\n")


if __name__=="__main__":
    main()
