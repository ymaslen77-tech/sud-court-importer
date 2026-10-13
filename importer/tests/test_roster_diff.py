import copy
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from roster import parse
from roster_diff import compare

FIXTURE=Path(__file__).resolve().parents[1]/"seeds"/"lefortovsky-judges-official-page-unreviewed.json"

class RosterDiffTests(unittest.TestCase):
 def setUp(self):
  self.a=parse(FIXTURE.read_bytes())["judges"]
  self.b=copy.deepcopy(self.a)
 def test_unchanged(self):
  self.assertEqual(compare(self.a,self.b),[])
 def test_phone(self):
  self.b[0]["telephone"]="+7 (000) 000-00-00"
  self.assertEqual([(c.change_kind if hasattr(c,"change_kind") else c.kind,c.field_name) for c in compare(self.a,self.b)],[("field_changed","telephone")])
 def test_first_listed(self):
  self.b.append({"fullName":"Тестов Проверочный","position":"судья"})
  self.assertEqual(compare(self.a,self.b)[0].kind,"first_listed")
 def test_disappeared_does_not_imply_dismissal(self):
  self.b.pop()
  self.assertEqual(compare(self.a,self.b)[0].kind,"no_longer_listed")
 def test_role_change_is_two_observations(self):
  self.b[0]["position"]="председатель суда"
  self.assertEqual({x.kind for x in compare(self.a,self.b)},{"first_listed","no_longer_listed"})
 def test_empty_snapshot_rejected(self):
  with self.assertRaises(ImportValidationError): compare(self.a,[])
 def test_duplicate_rejected(self):
  with self.assertRaises(ImportValidationError): compare(self.a,self.a+[self.a[0]])
