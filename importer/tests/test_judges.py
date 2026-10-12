import sys
import unittest
from datetime import date,timedelta
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from judges import cleaned_person,valid_date

class JudgesTests(unittest.TestCase):
    def test_full_name(self):
        self.assertEqual(cleaned_person("Антипова  Анна   Вячеславовна","Judge"),
                         "Антипова Анна Вячеславовна")
        self.assertEqual(cleaned_person("председатель суда","Position"),"председатель суда")

    def test_prohibits_bad_names(self):
        for value in ("", "A", "https://bad.invalid/", "123", "<script>alert(1)</script>"):
            with self.subTest(value=value), self.assertRaises(ImportValidationError):
                cleaned_person(value,"Judge")

    def test_start_dates_optional_and_not_future(self):
        self.assertIsNone(valid_date(None))
        self.assertEqual(valid_date("2024-10-12"),date(2024,10,12))
        with self.assertRaises(ImportValidationError):
            valid_date(str(date.today()+timedelta(days=1)))

if __name__=="__main__":
    unittest.main()
