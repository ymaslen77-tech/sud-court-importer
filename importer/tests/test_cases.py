import sys
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from cases import validate,official_case_page

UID="77RS0014-02-2026-011129-45"
URL="https://m.mos-gorsud.ru/rs/lefortovskij/services/cases/civil/details/fef64000-869b-11f1-ade9-3f611993f6c1"


class CasesTests(unittest.TestCase):
    def test_real_moscow_official_case_reference(self):
        uid,number,url=validate(UID,"02-7949/2026",URL)
        self.assertEqual(uid[:8],"77RS0014")
        self.assertEqual(number,"02-7949/2026")
        self.assertEqual(url,URL)
        self.assertTrue(official_case_page(URL))

    def test_no_unofficial_or_redirecting_pages(self):
        for changed in [
            URL.replace("https://","http://"),
            URL.replace("m.mos-gorsud.ru","m.mos-gorsud.ru.attacker.invalid"),
            URL.replace("m.mos-gorsud.ru","m.mos-gorsud.ru@evil.invalid"),
            "https://mos-gorsud.ru/rs/lefortovskij",
            URL+"?url=https://bad.example",
            "https://example.com/services/cases/civil/details/fef64000-869b-11f1-ade9-3f611993f6c1",
        ]:
            with self.subTest(url=changed),self.assertRaises(ImportValidationError):
                validate(UID,"02-7949/2026",changed)

    def test_reject_unknown_case_identifier_and_party_data(self):
        for uid in ["", "77RS0014", "77RS0014-abc", UID+"-extra"]:
            with self.subTest(uid=uid),self.assertRaises(ImportValidationError):
                validate(uid,"02-7949/2026",URL)
        with self.assertRaises(ImportValidationError):
            validate(UID,"02-7949/2026; ФИО истца",URL)


if __name__=="__main__":
    unittest.main()
