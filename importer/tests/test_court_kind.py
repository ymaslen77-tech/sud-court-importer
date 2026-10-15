import sys
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from court_kind import infer_verified_kind, KNOWN

class CourtKindsTests(unittest.TestCase):
    def test_known_moscow_codes(self):
        self.assertEqual(infer_verified_kind("mos-gorsud-courts","77RS0001","Любой районный суд"),"general-district")
        self.assertEqual(infer_verified_kind("mos-gorsud-courts","77OS0000","Московский городской суд"),"general-regional")

    def test_moscow_city_mismatch_never_assumed(self):
        self.assertEqual(infer_verified_kind("mos-gorsud-courts","77OS0000","Чужое название"),"unclassified")
        self.assertEqual(infer_verified_kind("mos-gorsud-courts","77ZZ0001","Тест"),"unclassified")

    def test_verified_federal_codes(self):
        self.assertEqual(infer_verified_kind("sudrf-federal","54RS0012","Барабинский районный суд"),"general-district")
        self.assertEqual(infer_verified_kind("sudrf-federal","54OS0000","Новосибирский областной суд"),"general-regional")
        self.assertEqual(infer_verified_kind("sudrf-federal","54KV0000","Кассационный военный суд"),"military-cassation")

    def test_unknown_court_kind_remains_unclassified(self):
        for registry in ("arbitr-courts","sudrf-magistrate","unknown"):
            self.assertEqual(infer_verified_kind(registry,"77AA0001","Пример"),"unclassified")
        self.assertEqual(infer_verified_kind("sudrf-federal","77GV0001","Пример"),"unclassified")

    def test_kinds_match_published_canonical_values(self):
        for registry,code,name in (
            ("sudrf-federal","54RS0012","Районный суд"),
            ("sudrf-federal","54OS0000","Областной суд"),
            ("sudrf-federal","54KV0000","Кассационный военный суд"),
        ):
            self.assertIn(infer_verified_kind(registry,code,name),KNOWN)

if __name__=="__main__":
    unittest.main()
