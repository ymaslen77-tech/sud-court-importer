"""Transcription adapter must reject open rings, duplicate IDs and invalid coordinates."""
from pathlib import Path
import sys
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
from jurisdiction_coordinates_csv import convert_csv
from jurisdiction_geometry import BoundaryValidationError

FIX=ROOT/"importer/tests/fixtures/synthetic_boundary_coordinates.csv"

class CoordinateCsvTests(unittest.TestCase):
    def test_two_synthetic_polygons(self):
        result=convert_csv(FIX)
        self.assertEqual(len(result["features"]),2)
        self.assertEqual(result["features"][0]["geometry"]["type"],"MultiPolygon")

    def test_invalid_coordinate_table_refused(self):
        raw=FIX.read_text()
        samples=[raw.replace("82.90,55.00","900,55.00"),
                 raw.replace("TEST-A,0,0,4,82.90,55.00,54MS0001",""),
                 raw.replace("TEST-A,0,0,4,82.90,55.00,54MS0001","TEST-A,0,0,3,82.90,55.00,54MS0001"),
                 raw.replace("54MS0001","54MS0002",1)]
        for content in samples:
            with tempfile.TemporaryDirectory() as tmp:
                p=Path(tmp)/"x.csv"
                p.write_text(content)
                with self.assertRaises(BoundaryValidationError):
                    convert_csv(p)
if __name__=="__main__":
    unittest.main()
