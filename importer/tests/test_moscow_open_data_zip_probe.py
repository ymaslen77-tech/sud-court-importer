"""Range-based ZIP metadata probing; synthetic ZIP in-memory, zero network."""
import io
import json
import sys
import unittest
import zipfile
from pathlib import Path
from urllib.request import Request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "importer"))
import moscow_open_data_zip_probe as probe
from moscow_open_data_registry import BY_ID
from moscow_open_data_acquire import CIVIL_FIRST


class Response(io.BytesIO):
    def __init__(self, data, status, url, headers):
        super().__init__(data)
        self.status = status
        self.url = url
        self.headers = headers
    def geturl(self):
        return self.url
    def __enter__(self):
        return self
    def __exit__(self, *args):
        self.close()


class FakeOpener:
    def __init__(self, raw, ignore_range=False):
        self.raw = raw
        self.ignore_range = ignore_range
        self.url = BY_ID[CIVIL_FIRST].download_url
    def open(self, req, timeout=30):
        if req.get_method() == "HEAD":
            return Response(b"", 200, self.url, {
                "Content-Type": "application/zip", "Content-Length": str(len(self.raw))})
        start, end = map(int, req.headers["Range"].split("=")[1].split("-"))
        if self.ignore_range:
            return Response(self.raw, 200, self.url, {})
        return Response(self.raw[start:end+1], 206, self.url, {
            "Content-Range": f"bytes {start}-{end}/{len(self.raw)}"})


def zip_bytes(entries):
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in entries:
            archive.writestr(name, content)
    return out.getvalue()


class OfficialZipProbeTests(unittest.TestCase):
    def test_uses_only_range_metadata_and_reports_uncompressed_size(self):
        raw = zip_bytes([("data.json", b'[{"secret":"DO-NOT-OUTPUT"}]')])
        d = probe.probe_dataset(BY_ID[CIVIL_FIRST], FakeOpener(raw))
        self.assertEqual(d["uncompressedJsonBytes"], 28)
        self.assertLess(d["metadataBytesFetched"], 1024*1024)
        self.assertNotIn("DO-NOT-OUTPUT", json.dumps(d))
        self.assertFalse(d["published"])
        self.assertFalse(d["fullDatasetDownloaded"])
    def test_requires_http_206_not_full_download(self):
        raw = zip_bytes([("data.json", b"[]")])
        with self.assertRaises(ValueError):
            probe.probe_dataset(BY_ID[CIVIL_FIRST], FakeOpener(raw, ignore_range=True))
    def test_rejects_unexpected_members(self):
        for names in ([("../evil.json", b"[]")],
                      [("data.json", b"[]"), ("a.json", b"[]")],
                      [("data.txt", b"not JSON")]):
            with self.subTest(names=names), self.assertRaises(ValueError):
                probe.probe_dataset(BY_ID[CIVIL_FIRST], FakeOpener(zip_bytes(names)))


if __name__ == "__main__":
    unittest.main()
