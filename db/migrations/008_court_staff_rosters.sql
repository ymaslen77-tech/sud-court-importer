-- 008: Verified-source personnel observations BEFORE mapping them to people or appointments.
-- No roster observation is published through courts API without separate identity/appointment review.
CREATE TABLE IF NOT EXISTS court_staff_roster_batches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  official_court_url TEXT NOT NULL,
  snapshot_sha256 CHAR(64) NOT NULL,
  captured_on DATE NOT NULL,
  source_page_updated_on DATE,
  record_count INTEGER NOT NULL CHECK(record_count BETWEEN 1 AND 300),
  checked_by TEXT NOT NULL,
  staged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id,official_court_url,snapshot_sha256)
);
CREATE TABLE IF NOT EXISTS court_staff_roster_rows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES court_staff_roster_batches(id),
  full_name TEXT NOT NULL,
  stated_position TEXT NOT NULL,
  decree_number TEXT,
  decree_date DATE,
  room TEXT,
  telephone TEXT,
  raw_record JSONB NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(review_status IN('pending','matched','rejected')),
  matched_judge_id BIGINT REFERENCES judges(id),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(batch_id,full_name,stated_position),
  CHECK(review_status<>'matched' OR matched_judge_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS staff_roster_pending_review_idx
  ON court_staff_roster_rows(review_status,batch_id,id);
