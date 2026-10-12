-- 003: A discovery registry for official list entries with incomplete metadata.
-- Separate from court_import_rows: no assumed codes, addresses or identifiers.
-- These rows are NEVER returned by the public courts API.
CREATE TABLE IF NOT EXISTS court_discovery_batches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  registry TEXT NOT NULL CHECK (registry IN ('sudrf-federal','sudrf-magistrate','arbitr-courts')),
  content_sha256 CHAR(64) NOT NULL,
  captured_on DATE NOT NULL,
  record_count INTEGER NOT NULL CHECK(record_count BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, registry, content_sha256)
);

CREATE TABLE IF NOT EXISTS court_discovery_rows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES court_discovery_batches(id) ON DELETE RESTRICT,
  row_key CHAR(64) NOT NULL,
  court_name TEXT NOT NULL,
  court_kind TEXT NOT NULL,
  region_code VARCHAR(2),
  region_name TEXT,
  external_code TEXT,
  official_court_url TEXT,
  source_record_url TEXT NOT NULL,
  address TEXT,
  raw_record JSONB NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(review_status IN ('pending','matched','rejected')),
  matched_court_id BIGINT REFERENCES courts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(batch_id, row_key),
  CHECK(region_code IS NULL OR region_code ~ '^[0-9]{2}$'),
  CHECK((review_status = 'matched' AND matched_court_id IS NOT NULL)
    OR (review_status <> 'matched' AND matched_court_id IS NULL))
);
CREATE INDEX IF NOT EXISTS discovery_batch_review_idx
  ON court_discovery_rows(batch_id, review_status);
CREATE INDEX IF NOT EXISTS discovery_region_idx
  ON court_discovery_rows(region_code, court_kind);
