-- 014: Provenance-rich, nonpublishing research evidence attached to import candidates.
-- NEVER infer human review from search cache or a matching case UID.
CREATE TABLE IF NOT EXISTS court_import_evidence (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  import_row_id BIGINT NOT NULL REFERENCES court_import_rows(id),
  field_name TEXT NOT NULL CHECK(field_name IN
    ('court_name','address','phone','email','classification_code')),
  observed_value TEXT NOT NULL
    CHECK(length(trim(observed_value)) BETWEEN 1 AND 500),
  evidence_url TEXT NOT NULL CHECK(
    length(evidence_url) <= 1500
    AND evidence_url ~ '^https://[A-Za-z0-9.-]+\.sudrf\.ru(/|$)'
  ),
  observation_channel TEXT NOT NULL CHECK(observation_channel IN
    ('cached_official_page','cached_official_case_uid','editor_direct_visit')),
  researched_on DATE NOT NULL,
  source_freshness_attested BOOLEAN NOT NULL DEFAULT false,
  review_status TEXT NOT NULL DEFAULT 'research_only'
    CHECK(review_status IN ('research_only','approved','rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (review_status <> 'approved' OR (
    source_freshness_attested = true
    AND reviewed_at IS NOT NULL
    AND reviewed_by IS NOT NULL
    AND length(trim(reviewed_by)) BETWEEN 2 AND 120
  )),
  UNIQUE(import_row_id,field_name,observation_channel,evidence_url,observed_value)
);
CREATE INDEX IF NOT EXISTS court_import_evidence_review_idx
  ON court_import_evidence(import_row_id,review_status,field_name);
-- All insertions default to research_only, never write public courts or verified facts.
