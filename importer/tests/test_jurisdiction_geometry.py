"""Synthetic-only safeguards for one universal boundary importer."""
from copy import deepcopy
from hashlib import sha256
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
from jurisdiction_geometry import (
    inspect,official_source,validate_geojson,validate_manifest,
    BoundaryValidationError
)

FIX=ROOT/"importer/tests/fixtures"
class GeometryIntakeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads((FIX/"synthetic_boundary_manifest.json").read_text())
        cls.geo=json.loads((FIX/"synthetic_boundaries.geojson").read_text())

    def test_accepted_but_never_approved(self):
        m,c,digest=inspect(FIX/"synthetic_boundary_manifest.json",FIX/"synthetic_boundaries.geojson")
        self.assertEqual(m["region_code"],"54")
        self.assertEqual(len(c),2)
        self.assertEqual(len(digest),64)
        self.assertEqual({x.court_code for x in c},{"54MS0001","54MS0002"})
        self.assertTrue(all('"MultiPolygon"' in x.geojson for x in c))
        self.assertEqual(len({x.feature_id for x in c}),2)

    def test_host_authorization(self):
        for url in ["https://publication.pravo.gov.ru/document/example",
                    "https://centralcourt--oms.sudrf.ru/modules.php?name=terr"]:
            self.assertTrue(official_source(url))
        for url in ["http://publication.pravo.gov.ru/example",
                    "https://publication.pravo.gov.ru.evil.org/a",
                    "https://evil.org/a","https://user@publication.pravo.gov.ru/a",
                    "https://publication.pravo.gov.ru:8080/a"]:
            with self.subTest(url=url):self.assertFalse(official_source(url))

    def test_not_accept_wrong_crs_or_fake_manifest(self):
        for bad in [
            {"crs":"EPSG:3857"},{"source_kind":"untrusted"},
            {"source_url":"https://publication.pravo.gov.ru.evil.com"},
            {"source_document_sha256":"aaaa"},{"annex_no":0},
            {"source_observed_on":"2099-01-01"},
            {"conversion_method":"generated"},{"region_code":"54';delete"}
        ]:
            m={**self.manifest,**bad}
            with self.subTest(bad=bad),self.assertRaises(BoundaryValidationError):
                validate_manifest(m)
        m=dict(self.manifest)
        m["unexpected"]=123
        with self.assertRaises(BoundaryValidationError): validate_manifest(m)

    def test_invalid_holes_bowtie_and_missing_polygon(self):
        for geometry in [
            {"type":"Point","coordinates":[82,55]},
            {"type":"Polygon","coordinates":[[[0,0],[1,1],[0,1],[1,0],[0,0]]]},
            {"type":"Polygon","coordinates":[[[82,55],[83,55],[83,56]]]},
            {"type":"Polygon","coordinates":[[[200,55],[201,55],[201,56],[200,55]]]},
            {"type":"Polygon","coordinates":[[[82,55,12],[83,55,12],[83,56,12],[82,55,12]]]},
            {"type":"Polygon","coordinates":[[[82,55],[83,55],[83,56],[82,55]],[[90,55],[91,55],[91,56],[90,55]]]}
        ]:
            geo=deepcopy(self.geo)
            geo["features"][0]["geometry"]=geometry
            with self.subTest(geometry=geometry),self.assertRaises(BoundaryValidationError):
                validate_geojson(geo)

    def test_duplicate_missing_and_untrusted_features(self):
        geo=deepcopy(self.geo)
        geo["features"][1]["properties"]["feature_id"]="TEST-A"
        with self.assertRaises(BoundaryValidationError): validate_geojson(geo)
        geo=deepcopy(self.geo)
        geo["features"][1]["properties"]["court_code"]="arbitrary"
        with self.assertRaises(BoundaryValidationError): validate_geojson(geo)
        geo=deepcopy(self.geo)
        geo["features"]=[]
        with self.assertRaises(BoundaryValidationError): validate_geojson(geo)

    def test_srid_requirement_in_sql(self):
        sql=(ROOT/"db/migrations/018_court_boundary_geometry_staging.sql").read_text()
        self.assertIn("geometry(MultiPolygon,4326)",sql)
        self.assertIn("ST_IsValid(geom)",sql)
        self.assertIn("USING GIST",sql)
        self.assertIn("CHECK(permitted_for_routing=FALSE)",sql)
        self.assertIn("CHECK(research_status='research_only')",sql)
        self.assertNotIn("INSERT INTO court_jurisdiction_units",sql)
        self.assertNotIn("UPDATE court_jurisdiction_units",sql)

    def test_file_json_has_bytes_cap(self):
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/"wrong.geojson"
            p.write_text('{"type":"FeatureCollection","features":[]}')
            with self.assertRaises(BoundaryValidationError):
                inspect(FIX/"synthetic_boundary_manifest.json",p)

if __name__=="__main__":
    unittest.main()
