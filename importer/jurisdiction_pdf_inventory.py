"""Inventory annex headings in a law PDF without inventing coordinates.

This is deliberately read-only: it never writes to Neon or approves boundaries.
It does NOT run OCR. Image-only pages must be flagged for separate review.

Usage:
  python importer/jurisdiction_pdf_inventory.py original.pdf --expected-annexes 138 --output inventory.json
"""
from __future__ import annotations

import argparse
from datetime import date
from hashlib import sha256
import json
from pathlib import Path
import re

MAX_DOCUMENT_BYTES = 250_000_000
MAX_PAGES = 5_000
HEADING = re.compile(r"(?im)^\s*приложени[ея]\s*(?:№|N|No\.?|номер)?\s*(\d{1,4})(?!\d)")
COORDINATES = re.compile(r"(?i)координат|система\s+координат|[XYХУ]\s*[,;]\s*[XYХУ]")
LEGAL_ACT = re.compile(r"(?i)149\s*[-–‑]?\s*ОЗ")


class PdfIntakeError(ValueError):
    pass


def pdf_inventory(path: Path, expected: int = 138) -> dict:
    if not 1 <= expected <= 500:
        raise PdfIntakeError("expected must be between 1 and 500")
    if not path.is_file() or path.stat().st_size > MAX_DOCUMENT_BYTES:
        raise PdfIntakeError("PDF missing or exceeds 250 MB intake cap")
    if path.suffix.lower() != ".pdf":
        raise PdfIntakeError("Expected a PDF file")
    digest = sha256()
    with path.open("rb") as handle:
        if handle.read(5) != b"%PDF-":
            raise PdfIntakeError("Invalid PDF file signature")
        handle.seek(0)
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    try:
        import fitz
    except ImportError as exc:
        raise PdfIntakeError("Install PyMuPDF>=1.24,<2 to inspect an original PDF") from exc

    headings: dict[int, list[int]] = {}
    pages_with_text = 0
    pages_with_coordinate_indicators = []
    page_text_counts = []
    try:
        with fitz.open(path) as doc:
            if doc.is_encrypted:
                raise PdfIntakeError("Encrypted PDF cannot be processed")
            total = len(doc)
            if not 1 <= total <= MAX_PAGES:
                raise PdfIntakeError("Page count outside safety limit")
            for i in range(total):
                page_text = doc[i].get_text("text",sort=True) or ""
                if len(page_text.strip()) >= 25:
                    pages_with_text += 1
                page_text_counts.append(len(page_text.strip()))
                # A candidate heading alone is insufficient to establish a genuine
                # annex: manual cross-check of surrounding page is mandatory.
                lead = page_text[:1200]
                for match in HEADING.finditer(lead):
                    n = int(match.group(1))
                    if 1 <= n <= expected:
                        headings.setdefault(n,[]).append(i+1)
                if COORDINATES.search(page_text):
                    pages_with_coordinate_indicators.append(i+1)
    except PdfIntakeError:
        raise
    except Exception as exc:
        raise PdfIntakeError("PDF parser could not open or inspect the document") from exc

    missed = [i for i in range(1,expected+1) if i not in headings]
    repeats = {str(i):pages for i,pages in headings.items() if len(pages)>1}
    return {
        "document_sha256":digest.hexdigest(),
        "size_bytes":path.stat().st_size,
        "page_count":total,
        "pages_with_extractable_text":pages_with_text,
        "text_extraction_coverage":round(pages_with_text/total,4),
        "pages_with_coordinate_indicators":len(pages_with_coordinate_indicators),
        "possible_annex_start_pages":{str(k):v for k,v in sorted(headings.items())},
        "missing_annex_headings":missed,
        "duplicate_heading_candidates":repeats,
        "expected_annexes":expected,
        "verified_source_origin":False,
        "verified_crs":False,
        "accepted_geometries":0,
        "approved_for_jurisdiction":0,
        "manual_page_review_required":True,
        "warnings":[
            "PDF content does not prove this file came from the official portal: capture the HTTPS source URL and response provenance separately.",
            "Heading detection is heuristic. Verify each annex number against the rendered official page.",
            "Coordinate indicators are not usable GIS points. Never infer projection or auto-publish geometries.",
            *(
                ["Some pages contain no extractable text; inspect originals visually before deciding whether OCR is needed."]
                if pages_with_text < total else []
            ),
        ],
    }


def main() -> None:
    parser=argparse.ArgumentParser(description="Read-only official law PDF annex inventory")
    parser.add_argument("pdf",type=Path)
    parser.add_argument("--expected-annexes",type=int,default=138)
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    try:
        result=pdf_inventory(args.pdf,args.expected_annexes)
        if args.output.exists():
            raise PdfIntakeError("Output already exists: refusing overwrite")
        args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print(json.dumps({k:result[k] for k in (
            "page_count","document_sha256","pages_with_extractable_text",
            "expected_annexes","missing_annex_headings","approved_for_jurisdiction"
        )},ensure_ascii=False))
    except (PdfIntakeError, OSError) as exc:
        parser.exit(2,"PDF inventory rejected: "+str(exc)+"\n")


if __name__=="__main__":
    main()
