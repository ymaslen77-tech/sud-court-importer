import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from court_kind import infer_verified_kind
from federation import parse_export
from sudrf_listing import extract

SOURCE="https://sudrf.ru/index.php?act=go_search&court_subj=54&id=300&searchtype=fs"
FILE=Path(__file__).parent/"fixtures"/"official_sudrf_novosibirsk_excerpt.txt"


class SudrfListingTests(unittest.TestCase):
    def sample(self):
        return FILE.read_bytes()

    def test_official_excerpt_four_distinct_courts(self):
        raw,records=extract(self.sample(),"54","Новосибирская область",SOURCE)
        self.assertEqual(len(records),4)
        self.assertEqual([x["courtCode"] for x in records],
                         ["54AJ0005","54GV0001","54OS0000","54RS0012"])
        self.assertEqual(len(parse_export(raw,"sudrf-federal")),4)
        kinds=[infer_verified_kind("sudrf-federal",c["courtCode"],c["courtName"])
               for c in records]
        self.assertEqual(kinds,["general-appeal","military-garrison",
                               "general-regional","general-district"])
        self.assertEqual(records[-1]["courtEmail"],"barabinsky.nsk@sudrf.ru")
        self.assertEqual(records[0]["courtSiteUrl"],"http://5ap.sudrf.ru")

    def test_html_list_rows(self):
        # DOM approximation only; no guarantee the upstream HTML has this form.
        sample=self.sample().decode("utf-8")
        cards=[x.strip() for x in sample.split("\n* ") if "Классификационный код" in x]
        cards=["* "+x.lstrip("* ").strip() for x in cards]
        html="<html><body><ul>"+ "".join(
            "<li>"+card.replace("\n","<br>")+"</li>" for card in cards
        )+"</ul></body></html>"
        _,records=extract(html.encode(),"54","Новосибирская область",SOURCE)
        self.assertEqual(len(records),4)

    def test_wrong_region_and_listing_rejected(self):
        for url in (
            "https://sudrf.ru/index.php?act=go_search&court_subj=77&id=300&searchtype=fs",
            "https://sudrf.ru/index.php?act=go_ms_search&court_subj=54&id=300&searchtype=ms",
            "https://sudrf.ru.evil.example/index.php?act=go_search&court_subj=54&id=300&searchtype=fs",
            "http://sudrf.ru/index.php?act=go_search&court_subj=54&id=300&searchtype=fs",
        ):
            with self.subTest(url=url),self.assertRaises(ImportValidationError):
                extract(self.sample(),"54","Новосибирская область",url)

    def test_fail_closed_on_partial_copy(self):
        partial=self.sample().decode().replace("http://gvs.nsk.sudrf.ru","")
        with self.assertRaises(ImportValidationError):
            extract(partial.encode(),"54","Новосибирская область",SOURCE)

    def test_duplicate_classification_code_rejected(self):
        text=self.sample()+self.sample()
        with self.assertRaises(ImportValidationError):
            extract(text,"54","Новосибирская область",SOURCE)

    def test_reject_wrong_court_official_host(self):
        swapped=self.sample().replace(b"http://barabinsky.nsk.sudrf.ru",
                                      b"https://barabinsky.nsk.sudrf.ru.evil.invalid")
        with self.assertRaises(ImportValidationError):
            extract(swapped,"54","Новосибирская область",SOURCE)


if __name__=="__main__":
    unittest.main()
