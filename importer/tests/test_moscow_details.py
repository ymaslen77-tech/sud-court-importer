import copy
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from moscow_details import extract, REVIEW_FIELDS

class MoscowDetailsTests(unittest.TestCase):
    def test_work_hours_are_editor_only_evidence(self):
        source={"courtWorkHours":" Пн – чт   9:00–18:00 ", "courtChairperson":"Тестовый гражданин",
                "courtWorkHoursReception":"с 9:00 до 17:00"}
        details=extract(source)
        self.assertEqual(details["office_hours_observed"],"Пн – чт 9:00–18:00")
        self.assertEqual(details["chairperson_as_listed"],"Тестовый гражданин")
        self.assertIn("reception_hours_observed",REVIEW_FIELDS)
        self.assertNotIn("judicial_appointments",details)

    def test_canonical_nested_detail(self):
        first={"courtWorkHours":[{"day":"Пн","hours":{"end":"18","start":"09"}}]}
        second={"courtWorkHours":[{"hours":{"start":"09","end":"18"},"day":"Пн"}]}
        self.assertEqual(extract(first),extract(second))

    def test_null_missing_does_not_generate_details(self):
        self.assertEqual(extract({}),{})
        self.assertEqual(extract({"courtFax":None}),{"fax":None})
        self.assertEqual(extract({"_registry":"sudrf-federal","courtWorkHours":"ignored"}),{})

    def test_reject_overlong_and_unsafe_values(self):
        for value in ("x"*20001,object(),float('nan'),{"x":["q"]*201}):
            with self.subTest(value_type=type(value)),self.assertRaises(ImportValidationError):
                extract({"courtWorkHours":value})
