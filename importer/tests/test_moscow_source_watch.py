"""Source watch only reads HEAD metadata and marks changes for review."""
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
import moscow_source_watch as watch
from moscow_open_data_registry import BY_ID
from moscow_open_data_acquire import CIVIL_FIRST

class Response:
 def __init__(self,url,headers,status=200):
  self.url=url
  self.headers=headers
  self.status=status
 def __enter__(self): return self
 def __exit__(self,*args): return None
 def geturl(self): return self.url
class MockOpener:
 def __init__(self,headers,status=200):
  self.headers=headers
  self.status=status
  self.calls=[]
 def open(self,req,timeout):
  self.calls.append((req.get_method(),req.full_url))
  return Response(req.full_url,self.headers,self.status)

class SourceWatchTests(unittest.TestCase):
 def test_head_only_never_downloads_case_body(self):
  item=BY_ID[CIVIL_FIRST]
  opener=MockOpener({"Content-Length":"667506029","Content-Type":"application/zip","ETag":"SECRET"})
  results=watch.observe([item],opener,{})
  self.assertEqual(opener.calls,[("HEAD",item.download_url)])
  self.assertEqual(results[item.identifier]["reviewState"],"first_observation")
  self.assertEqual(results[item.identifier]["metadata"]["bytes"],667506029)
  self.assertNotIn("SECRET",str(results))
 def test_changed_headers_require_review_not_auto_accept(self):
  source={"bytes":10,"contentType":"application/zip","etagSha256":"a","lastModifiedSha256":None}
  self.assertEqual(watch.compare(source,dict(source)),"metadata_unchanged_not_content_verified")
  self.assertEqual(watch.compare(source,dict(source,bytes=11)),"metadata_changed_review_needed")
  self.assertEqual(watch.compare({"bytes":10,"contentType":"application/zip"},dict(source)),
                   "metadata_changed_review_needed")
  self.assertEqual(watch.compare({"bytes":10,"contentType":"application/zip"},
                                 {"bytes":10,"contentType":"application/zip"}),
                   "insufficient_change_signal")
 def test_reject_nonzip_html_and_http_error(self):
  item=BY_ID[CIVIL_FIRST]
  with self.assertRaises(ValueError):
   watch.fetch_headers(item,MockOpener({"Content-Length":"1","Content-Type":"text/html"}))
  with self.assertRaises(ValueError):
   watch.fetch_headers(item,MockOpener({"Content-Length":"1","Content-Type":"application/zip"},status=302))
 def test_explicit_terms_ack_required(self):
  with self.assertRaises(SystemExit):
   watch.main(["--scope","case"])

if __name__=="__main__":
 unittest.main()
