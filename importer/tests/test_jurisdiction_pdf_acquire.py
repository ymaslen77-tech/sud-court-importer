"""Bounded original PDF acquisition uses official host only and verifies bytes."""
import io
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryDirectory
import sys
import unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
import jurisdiction_pdf_acquire as a

class FakePDF:
    status=200
    headers={"content-type":"application/pdf","content-length":"2048"}
    def __init__(self,data):self.source=io.BytesIO(data)
    def __enter__(self):return self
    def __exit__(self,*args):return None
    def read(self,n):return self.source.read(n)
class FakeOpener:
    def __init__(self,data):self.data=data
    def open(self,request,timeout):
        assert request.full_url=="https://publication.pravo.gov.ru/File/Pdf?eoNumber=5400202610010007"
        assert timeout<=30
        return FakePDF(self.data)

class AcquisitionTests(unittest.TestCase):
    def test_bounded_download_and_hash(self):
        raw=b"%PDF-1.7\n"+b"a"*3000
        with TemporaryDirectory() as d,patch.object(a,"build_opener",return_value=FakeOpener(raw)):
            output=Path(d)/"official.pdf"
            result=a.acquire("5400202610010007",output)
            self.assertEqual(result["pdf_sha256"],sha256(raw).hexdigest())
            self.assertEqual(output.read_bytes(),raw)
            self.assertEqual(result["legal_annexes_verified"],0)
            with self.assertRaises(a.AcquisitionError):a.acquire("5400202610010007",output)
    def test_block_wrong_number_and_cleanup_failed_document(self):
        with TemporaryDirectory() as d,patch.object(a,"build_opener",return_value=FakeOpener(b"<html>not a pdf</html>")):
            output=Path(d)/"original.pdf"
            with self.assertRaises(a.AcquisitionError):a.acquire("5400202610010007",output)
            self.assertFalse(output.exists())
            self.assertFalse((Path(d)/"original.pdf.partial").exists())
            with self.assertRaises(a.AcquisitionError):a.acquire("149-ОЗ",output)
    def test_redirect_rejects_external_or_unencrypted_host(self):
        from urllib.request import Request
        handler=a.OfficialOnlyRedirect()
        req=Request("https://publication.pravo.gov.ru/File/Pdf?eoNumber=5400202610010007")
        for url in ("https://attacker.example.org/law.pdf",
                    "https://publication.pravo.gov.ru.evil.example/File/Pdf",
                    "http://publication.pravo.gov.ru/File/Pdf"):
            with self.subTest(url=url),self.assertRaises(a.AcquisitionError):
                handler.redirect_request(req,None,302,"",{},url)

if __name__=="__main__":
    unittest.main()
