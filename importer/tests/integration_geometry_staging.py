"""Standalone integration smoke against a disposable PostGIS test DB.

Never run against production; requires JURISDICTION_INTEGRATION_TEST=1, and
DATABASE_URL pointing to a dedicated test database.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
from jurisdiction_geometry import inspect,stage,audit,BoundaryValidationError

if os.getenv("JURISDICTION_INTEGRATION_TEST")!="1":
    raise SystemExit("Refusing integration staging without dedicated test marker")
dsn=os.getenv("DATABASE_URL","")
if not any(x in dsn for x in ("127.0.0.1","localhost")):
    raise SystemExit("Integration must use local test DB only")
from cli import database_connect

with database_connect() as conn:
    conn.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    with conn.transaction():
        for path in ("017_jurisdiction_annex_manifest.sql","018_court_boundary_geometry_staging.sql"):
            conn.execute((ROOT/"db/migrations"/path).read_text(encoding="utf8"))
        conn.execute("""
           INSERT INTO court_jurisdiction_normative_acts
            (region_code,act_code,act_date,official_document_url,subject,expected_annex_count,review_notes)
           VALUES ('54','Новосибирская область: 149-ОЗ от 01.10.2026','2026-10-01',
            'https://publication.pravo.gov.ru/document/5400202610010007',
            'TEST ACT / NOT AUTHENTIC ANNEX',138,'Synthetic integration test only')
        """)
        conn.execute("""
          INSERT INTO court_jurisdiction_annex_backlog(act_id,annex_no)
          SELECT id,1 FROM court_jurisdiction_normative_acts
        """)
fixture=ROOT/"importer/tests/fixtures"
manifest,geo,hash=inspect(fixture/"synthetic_boundary_manifest.json",fixture/"synthetic_boundaries.geojson")
first=stage(manifest,geo,hash)
assert first["created"] is True and first["polygons"]==2 and first["published"]==0,first
second=stage(manifest,geo,hash)
assert second["created"] is False and second["batch_id"]==first["batch_id"],second
report=audit("54")
assert report["staged_polygons"]==2,report
assert len(report["overlap_pairs_first_200"])==1,report
assert report["overlap_pairs_first_200"][0]["area_sq_m"]>0,report
with database_connect() as conn:
    p=conn.execute("SELECT COUNT(*) FROM court_boundary_research_polygons WHERE permitted_for_routing").fetchone()[0]
    s=conn.execute("SELECT COUNT(*) FROM court_boundary_import_batches WHERE source_digest_attested").fetchone()[0]
    assert p==s==0,(p,s)
    try:
        with conn.transaction():
            conn.execute("UPDATE court_boundary_research_polygons SET permitted_for_routing=TRUE")
    except Exception as exc:
        assert "check" in str(exc).lower(),exc
    else:
        raise AssertionError("Postgres allowed unreviewed geometry to be routed")
print(json.dumps({"staged":first["polygons"],"repeat_idempotent":not second["created"],
                  "overlap_pairs":len(report["overlap_pairs_first_200"]),
                  "routing_permitted":0,"official_source_attested":0},ensure_ascii=False))
