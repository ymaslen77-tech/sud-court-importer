#!/usr/bin/env python3
"""Read ONLY the ZIP directory over HTTPS byte ranges, not the case records.

The official registry candidate ZIP may expand beyond the 2 GiB safety limit.
This probe determines the ZIP member size before retrying a large fetch.
Never downloads ZIP bodies, never extracts, never publishes, never prints case data.
"""
import argparse
import io
import json
import re
import shutil
import zipfile
from pathlib import PurePosixPath, Path
from urllib.request import Request, HTTPSHandler, build_opener

from moscow_open_data_acquire import NoRedirect, CIVIL_FIRST, CIVIL_APPEAL, safe_endpoint
from moscow_open_data_registry import BY_ID

MAX_RANGE_BYTES = 2 * 1024 * 1024
MAX_REQUESTS = 12

class RemoteRangeFile(io.RawIOBase):
    """Small, strictly ranged, seekable HTTPS file for ZIP central directory."""
    def __init__(self, url, opener, size):
        self.url = url
        self.opener = opener
        self.size = size
        self.position = 0
        self.requests = 0
        self.transferred = 0

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=0):
        if whence == 0:
            pos = offset
        elif whence == 1:
            pos = self.position + offset
        elif whence == 2:
            pos = self.size + offset
        else:
            raise ValueError("Invalid seek origin")
        if pos < 0 or pos > self.size:
            raise ValueError("ZIP reader seeks outside file")
        self.position = pos
        return self.position

    def read(self, amount=-1):
        if self.position >= self.size:
            return b""
        if amount is None or amount < 0:
            amount = self.size - self.position
        amount = min(amount, self.size - self.position)
        if amount == 0:
            return b""
        if amount > MAX_RANGE_BYTES or self.requests >= MAX_REQUESTS:
            raise ValueError("Remote ZIP directory exceeds bounded range budget")
        start, end = self.position, self.position + amount - 1
        req = Request(self.url, headers={
            "Range": f"bytes={start}-{end}",
            "Accept-Encoding": "identity",
            "User-Agent": "SudyRussia/1.0 official-zip-metadata-probe",
        })
        with self.opener.open(req, timeout=60) as response:
            if response.status != 206 or response.geturl() != self.url:
                raise ValueError("Server did not honor safe HTTPS byte range")
            cr = response.headers.get("Content-Range", "")
            match = re.fullmatch(r"bytes (\d+)-(\d+)/(\d+)", cr)
            if not match or tuple(map(int, match.groups())) != (start, end, self.size):
                raise ValueError("Invalid Content-Range for ZIP metadata")
            data = response.read(amount + 1)
            if len(data) != amount:
                raise ValueError("Truncated or oversized ranged ZIP response")
        self.requests += 1
        self.transferred += len(data)
        self.position += len(data)
        return data


def probe_dataset(dataset, opener):
    url = safe_endpoint(dataset)
    req = Request(url, method="HEAD", headers={
        "Accept-Encoding": "identity",
        "User-Agent": "SudyRussia/1.0 official-zip-metadata-probe",
    })
    with opener.open(req, timeout=60) as response:
        if response.geturl() != url or response.status != 200:
            raise ValueError("Unexpected HEAD response from official endpoint")
        length = response.headers.get("Content-Length")
        content_type = response.headers.get("Content-Type", "").split(";")[0].lower()
    if not length or not length.isdecimal():
        raise ValueError("Official response has no valid Content-Length")
    size = int(length)
    if size < 22 or size > 20 * 1024**3:
        raise ValueError("ZIP size outside probe budget")
    if content_type not in {"application/zip", "application/x-zip-compressed", "application/octet-stream"}:
        raise ValueError("Expected a ZIP response, not JSON/HTML/other content")
    reader = RemoteRangeFile(url, opener, size)
    with zipfile.ZipFile(reader) as archive:
        members = [m for m in archive.infolist() if not m.is_dir()]
        if len(members) != 1:
            raise ValueError("Expected exactly one JSON member")
        item = members[0]
        p = PurePosixPath(item.filename)
        if (item.filename.startswith(("/", "\\")) or "\\" in item.filename
            or ".." in p.parts or p.suffix.lower() != ".json"
            or item.flag_bits & 1 or (item.external_attr >> 16) & 0o170000 == 0o120000):
            raise ValueError("Unsafe ZIP member")
        uncompressed = item.file_size
        if uncompressed < 1 or uncompressed > 30 * 1024**3:
            raise ValueError("Implausible ZIP expansion")
        return {
            "dataset": dataset.identifier,
            "archiveBytes": size,
            "uncompressedJsonBytes": uncompressed,
            "archiveMiB": round(size / 1024**2, 1),
            "uncompressedGiB": round(uncompressed / 1024**3, 2),
            "ratio": round(uncompressed / size, 2),
            "default2GiBCapSufficient": uncompressed <= 2048 * 1024**2,
            "metadataBytesFetched": reader.transferred,
            "published": False,
            "fullDatasetDownloaded": False,
        }


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--only", nargs="+", default=[CIVIL_FIRST, CIVIL_APPEAL])
    p.add_argument("--ack-source-terms", action="store_true")
    args = p.parse_args(argv)
    if not args.ack_source_terms:
        p.error("Review official source terms before network access; use --ack-source-terms")
    allowed = {CIVIL_FIRST, CIVIL_APPEAL}
    if not set(args.only) <= allowed or not args.only:
        p.error("The bounded probe is currently validated for the two civil datasets only")
    opener = build_opener(HTTPSHandler(), NoRedirect())
    results = []
    for ident in args.only:
        item = BY_ID[ident]
        try:
            results.append(probe_dataset(item, opener))
        except (ValueError, OSError, zipfile.BadZipFile, zipfile.LargeZipFile) as exc:
            results.append({"dataset": ident, "status": "blocked_for_review",
                            "errorType": type(exc).__name__, "message": str(exc)[:180]})
            break
    free = shutil.disk_usage("/srv").free if Path("/srv").exists() else None
    print(json.dumps({"datasets": results, "freeDiskGiB": round(free/1024**3, 2) if free else None,
                      "publication": False, "download": False}, ensure_ascii=False, indent=2))
    if any(r.get("status") == "blocked_for_review" for r in results):
        raise SystemExit(2)


if __name__ == "__main__":
    main()
