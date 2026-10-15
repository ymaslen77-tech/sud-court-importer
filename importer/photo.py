"""Publish a personally reviewed, licensed court facade into first-party media.

Reads an explicitly supplied local file, strips EXIF, stores a clean WebP.
No crawling and no inferred court/facade matching. Court must be verified.
"""
from __future__ import annotations
import argparse
from hashlib import sha256
import io
import json
import os
from pathlib import Path
from urllib.parse import urlsplit

from contacts import ImportValidationError
from cli import database_connect

MAX_BYTES=10_000_000
MAX_PIXELS=15_000_000
ALLOWED_SOURCES=("commons.wikimedia.org","mos-gorsud.ru","sudrf.ru","arbitr.ru")
ALLOWED_LICENSES=("creativecommons.org","commons.wikimedia.org")


def valid_https(value,hosts):
    try:
        url=urlsplit(value)
        host=(url.hostname or "").lower()
        return (url.scheme=="https" and not url.username and not url.password and
                url.port in (None,443) and not url.fragment and
                any(host==h or host.endswith("."+h) for h in hosts))
    except ValueError:
        return False


def sanitized_image(data):
    try:
        from PIL import Image,ImageOps,UnidentifiedImageError
    except ImportError as exc:
        raise ImportValidationError("Install Pillow before processing facade images") from exc
    if not 0<len(data)<=MAX_BYTES:
        raise ImportValidationError("Image size exceeds 10 MB")
    try:
        Image.MAX_IMAGE_PIXELS=MAX_PIXELS
        with Image.open(io.BytesIO(data)) as im:
            if im.format not in ("JPEG","PNG","WEBP"):
                raise ImportValidationError("Unsupported image format")
            if im.width<400 or im.height<300 or im.width*im.height>MAX_PIXELS:
                raise ImportValidationError("Image dimensions out of supported range")
            clean=ImageOps.exif_transpose(im).convert("RGB")
            buf=io.BytesIO()
            clean.save(buf,format="WEBP",quality=83,method=4)
            return buf.getvalue()
    except (ValueError,OSError,UnidentifiedImageError) as exc:
        raise ImportValidationError("Cannot decode facade image") from exc


def publish(court_id,filename,source_url,license_url,license_name,author,reviewer,rights,identity):
    if not (rights and identity):
        raise ImportValidationError("Rights and facade identity must be personally confirmed")
    if not valid_https(source_url,ALLOWED_SOURCES):
        raise ImportValidationError("Source must be approved official or Wikimedia Commons HTTPS")
    if not valid_https(license_url,ALLOWED_LICENSES):
        raise ImportValidationError("License must have a verifiable HTTPS URL")
    for name,value in (("author",author),("license",license_name),("reviewer",reviewer)):
        if not 2<=len(value.strip())<=200:
            raise ImportValidationError(name+" name required")
    input_file=Path(filename).resolve()
    if not input_file.is_file() or input_file.stat().st_size>MAX_BYTES:
        raise ImportValidationError("Input file missing or too large")
    # Only files deliberately mounted in importer's read-only input directory.
    if not input_file.is_relative_to(Path("/input").resolve()):
        raise ImportValidationError("Image must be under /input")
    cleaned=sanitized_image(input_file.read_bytes())
    digest=sha256(cleaned).hexdigest()
    relative=f"/court-media/{court_id}-{digest[:20]}.webp"
    destination=Path("/published-media")/relative.removeprefix("/court-media/")
    if not Path("/published-media").is_dir():
        raise ImportValidationError("Published media directory not mounted")
    with database_connect() as conn:
        with conn.transaction():
            court=conn.execute(
                "SELECT id FROM courts WHERE id=%s AND status='verified'",(court_id,)
            ).fetchone()
            if not court:
                raise ImportValidationError("Court not verified")
            src=conn.execute("""INSERT INTO sources(url,publisher,source_type)
                VALUES(%s,%s,%s) ON CONFLICT(url) DO UPDATE
                SET publisher=excluded.publisher RETURNING id""",
                (source_url,"Правообладатель или официальное фото","facade-photo")).fetchone()
            assert src
            newly_written=False
            if not destination.exists():
                temp=destination.with_suffix(".tmp")
                try:
                    with open(temp,"xb") as fp:
                        fp.write(cleaned)
                    os.replace(temp,destination)
                    newly_written=True
                finally:
                    if temp.exists():temp.unlink()
            try:
                conn.execute("""INSERT INTO court_facade_media
                    (court_id,image_path,source_url,author,license_name,license_url,
                    source_id,verified_at,reviewed_by,status)
                    VALUES(%s,%s,%s,%s,%s,%s,%s,now(),%s,'approved')
                    ON CONFLICT(court_id,image_path) DO NOTHING""",
                    (court_id,relative,source_url,author.strip(),license_name.strip(),
                     license_url,src[0],reviewer.strip()))
            except Exception:
                if newly_written and destination.exists():destination.unlink()
                raise
    return {"court_id":court_id,"image_path":relative,"license":license_name,
            "published_media":True,"requires_web_rebuild":True}


def main():
    p=argparse.ArgumentParser(description="Review and sanitize licensed court facade")
    p.add_argument("--court-id",type=int,required=True)
    p.add_argument("--file",required=True)
    p.add_argument("--source-url",required=True)
    p.add_argument("--license-url",required=True)
    p.add_argument("--license-name",required=True)
    p.add_argument("--author",required=True)
    p.add_argument("--reviewer",required=True)
    p.add_argument("--attest-rights",action="store_true")
    p.add_argument("--attest-facade-identity",action="store_true")
    a=p.parse_args()
    try:
        out=publish(a.court_id,a.file,a.source_url,a.license_url,a.license_name,
                    a.author,a.reviewer,a.attest_rights,a.attest_facade_identity)
    except ImportValidationError as exc:
        p.exit(2,str(exc)+"\n")
    print(json.dumps(out,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
