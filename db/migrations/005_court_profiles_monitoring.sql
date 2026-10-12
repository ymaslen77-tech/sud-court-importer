-- 005: Verified, field-level court profiles and change-monitoring.
-- Approved current values and untrusted proposals are STRICTLY separate.
CREATE TABLE IF NOT EXISTS court_profile_fields (
  court_id BIGINT NOT NULL REFERENCES courts(id),
  field_name TEXT NOT NULL CHECK (field_name IN (
   'reception_hours','office_hours','filing_instructions_url','jurisdiction_url',
   'bank_details_url','accessibility','transport','coordinates')),
  value TEXT NOT NULL,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  verified_at TIMESTAMPTZ NOT NULL,
  reviewed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(court_id,field_name)
);
CREATE TABLE IF NOT EXISTS court_profile_candidates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  field_name TEXT NOT NULL CHECK (field_name IN (
   'name','address','phone','email','official_url','reception_hours',
   'office_hours','filing_instructions_url','jurisdiction_url','bank_details_url',
   'accessibility','transport','coordinates')),
  proposed_value TEXT NOT NULL,
  value_sha256 CHAR(64) NOT NULL,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  observed_at TIMESTAMPTZ NOT NULL,
  proposed_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  UNIQUE(court_id,field_name,value_sha256,source_id)
);
CREATE INDEX IF NOT EXISTS court_profile_candidates_review_idx
  ON court_profile_candidates(status,observed_at);

CREATE TABLE IF NOT EXISTS court_facade_media (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  image_path TEXT NOT NULL CHECK(image_path ~ '^/court-media/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp)$'),
  source_url TEXT NOT NULL CHECK(source_url ~ '^https://'),
  author TEXT NOT NULL,
  license_name TEXT NOT NULL,
  license_url TEXT NOT NULL CHECK(license_url ~ '^https://'),
  source_id BIGINT NOT NULL REFERENCES sources(id),
  verified_at TIMESTAMPTZ NOT NULL,
  reviewed_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('approved','retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(court_id,image_path)
);
CREATE INDEX IF NOT EXISTS court_facade_media_idx ON court_facade_media(court_id,status);

CREATE TABLE IF NOT EXISTS court_source_watch (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  source_id BIGINT NOT NULL REFERENCES sources(id),
  watch_url TEXT NOT NULL,
  scope TEXT NOT NULL CHECK(scope IN('contacts','judges','hours','documents','general')),
  cadence_hours INTEGER NOT NULL DEFAULT 48 CHECK(cadence_hours BETWEEN 24 AND 720),
  permission_confirmed_by TEXT NOT NULL,
  permission_confirmed_at TIMESTAMPTZ NOT NULL,
  checked_at TIMESTAMPTZ,
  next_check_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sha256 CHAR(64),
  etag TEXT,
  last_modified TEXT,
  last_http_status INTEGER,
  last_error TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(court_id,watch_url,scope)
);
CREATE INDEX IF NOT EXISTS court_source_watch_due_idx
  ON court_source_watch(next_check_at) WHERE enabled=true;
CREATE TABLE IF NOT EXISTS court_source_watch_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  watch_id BIGINT NOT NULL REFERENCES court_source_watch(id),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_sha256 CHAR(64),
  new_sha256 CHAR(64) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN('pending','reviewed','ignored')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(watch_id,new_sha256)
);
