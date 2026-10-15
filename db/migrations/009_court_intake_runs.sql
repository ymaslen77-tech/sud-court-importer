-- 009: Audit each execution of the opt-in, offline court import inbox.
-- Failed parsing never mutates any public court records; incidents remain visible.
CREATE TABLE IF NOT EXISTS court_intake_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  handled INTEGER NOT NULL CHECK(handled>=0),
  failed INTEGER NOT NULL CHECK(failed>=0),
  manifest_count INTEGER NOT NULL CHECK(manifest_count>=0),
  error_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT court_intake_run_valid CHECK(manifest_count=handled+failed)
);
CREATE INDEX IF NOT EXISTS court_intake_runs_started_idx
 ON court_intake_runs(started_at DESC);
