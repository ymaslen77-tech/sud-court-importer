-- 018 — Universal source-linked geospatial staging.
-- Requires existing PostGIS extension. No automatic public approval or routing.
CREATE TABLE IF NOT EXISTS court_boundary_import_batches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  region_code CHAR(2) NOT NULL CHECK(region_code ~ '^[0-9]{2}$'),
  source_url TEXT NOT NULL CHECK(source_url ~ '^https://'),
  source_document_sha256 CHAR(64) NOT NULL CHECK(source_document_sha256 ~ '^[0-9a-f]{64}$'),
  source_digest_attested BOOLEAN NOT NULL DEFAULT FALSE CHECK(source_digest_attested=FALSE),
  geometry_file_sha256 CHAR(64) NOT NULL CHECK(geometry_file_sha256 ~ '^[0-9a-f]{64}$'),
  source_act_id BIGINT,
  annex_no INTEGER,
  source_kind TEXT NOT NULL CHECK(source_kind IN ('official_legal_annex','official_court_publication')),
  source_observed_on DATE NOT NULL,
  conversion_method TEXT NOT NULL CHECK(length(btrim(conversion_method)) >= 16),
  research_status TEXT NOT NULL DEFAULT 'research_only' CHECK(research_status='research_only'),
  permitted_for_routing BOOLEAN NOT NULL DEFAULT FALSE CHECK(permitted_for_routing=FALSE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_annex_pair CHECK (
    (source_act_id IS NULL AND annex_no IS NULL AND source_kind='official_court_publication')
    OR (source_act_id IS NOT NULL AND annex_no IS NOT NULL AND source_kind='official_legal_annex')
  ),
  CONSTRAINT court_boundary_act_annex_fkey FOREIGN KEY(source_act_id,annex_no)
    REFERENCES court_jurisdiction_annex_backlog(act_id,annex_no),
  UNIQUE(region_code,source_url,geometry_file_sha256)
);
CREATE TABLE IF NOT EXISTS court_boundary_research_polygons (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  import_batch_id BIGINT NOT NULL REFERENCES court_boundary_import_batches(id) ON DELETE RESTRICT,
  feature_id VARCHAR(100) NOT NULL,
  proposed_court_code VARCHAR(30),
  geom geometry(MultiPolygon,4326) NOT NULL,
  research_status TEXT NOT NULL DEFAULT 'research_only' CHECK(research_status='research_only'),
  permitted_for_routing BOOLEAN NOT NULL DEFAULT FALSE CHECK(permitted_for_routing=FALSE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(import_batch_id,feature_id),
  CHECK(ST_IsValid(geom) AND NOT ST_IsEmpty(geom)),
  CHECK(ST_NPoints(geom) BETWEEN 4 AND 50000),
  CHECK(ST_Area(geom)>0),
  CHECK(ST_XMin(geom)>=-180 AND ST_XMax(geom)<=180),
  CHECK(ST_YMin(geom)>=-90 AND ST_YMax(geom)<=90)
);
CREATE INDEX IF NOT EXISTS court_boundary_research_polygons_gix
  ON court_boundary_research_polygons USING GIST (geom);
CREATE INDEX IF NOT EXISTS court_boundary_import_batches_region_idx
  ON court_boundary_import_batches(region_code,created_at);
-- No update to court_jurisdiction_units or public approvedRules.
