-- 008: official court -> case references. No litigant names or case text.
-- Imported links stay private until a reviewer verifies the court code and page.
CREATE TABLE IF NOT EXISTS court_case_candidates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  case_uid TEXT NOT NULL CHECK(case_uid ~ '^[0-9]{2}[A-Z]{2}[0-9]{4}-[0-9]{2}-[0-9]{4}-[0-9]{6}-[0-9]{2}$'),
  case_number TEXT NOT NULL,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  page_url TEXT NOT NULL,
  proposed_by TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(court_id,case_uid,source_id)
);
CREATE INDEX IF NOT EXISTS case_candidates_pending_idx
  ON court_case_candidates(status,observed_at);
CREATE TABLE IF NOT EXISTS court_case_references (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  case_uid TEXT NOT NULL,
  case_number TEXT NOT NULL,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  page_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  reviewed_by TEXT NOT NULL,
  UNIQUE(court_id,case_uid)
);
CREATE INDEX IF NOT EXISTS court_case_references_by_court_idx
  ON court_case_references(court_id,verified_at DESC);
