-- 006: judge appointment change proposals require independent editorial review.
-- Names alone cannot identify a judge; reviewers resolve judge_id explicitly.
CREATE TABLE IF NOT EXISTS judicial_appointment_candidates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  judge_id BIGINT REFERENCES judges(id),
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  starts_on DATE,
  proposed_action TEXT NOT NULL CHECK(proposed_action IN ('appoint')),
  source_id BIGINT NOT NULL REFERENCES sources(id),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  proposal_sha256 CHAR(64) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewer TEXT,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(court_id,proposal_sha256,source_id)
);
CREATE INDEX IF NOT EXISTS appointments_pending_review
  ON judicial_appointment_candidates(status,observed_at);
