-- Separate untrusted import staging from public verified court records.
-- Apply this file once to existing databases; initial bootstrap applies all migrations.
CREATE TABLE IF NOT EXISTS court_import_batches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  content_sha256 CHAR(64) NOT NULL,
  record_count INTEGER NOT NULL CHECK(record_count > 0),
  staged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'staged' CHECK(status IN ('staged','reviewed')),
  UNIQUE(source_id, content_sha256)
);
CREATE TABLE IF NOT EXISTS court_import_rows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES court_import_batches(id),
  external_code VARCHAR(20) NOT NULL,
  proposed_slug VARCHAR(100) NOT NULL,
  court_name TEXT NOT NULL,
  court_type TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  official_url TEXT NOT NULL,
  raw_record JSONB NOT NULL,
  record_sha256 CHAR(64) NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','approved','rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  verification_url TEXT,
  UNIQUE(batch_id,external_code)
);
CREATE INDEX IF NOT EXISTS court_import_rows_review_idx ON court_import_rows(batch_id,review_status);
CREATE TABLE IF NOT EXISTS court_external_identifiers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  registry TEXT NOT NULL,
  external_code TEXT NOT NULL,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  UNIQUE(registry,external_code),
  UNIQUE(registry,court_id)
);
