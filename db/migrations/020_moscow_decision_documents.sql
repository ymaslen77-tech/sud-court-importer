-- 020: Decision texts and PDF references: data model only, NOT an import/approval.
-- An official docket result is not a published full text.
CREATE TABLE IF NOT EXISTS moscow_decision_document_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_slug text NOT NULL CHECK (court_slug ~ '^[a-z]+$'),
  case_number text NOT NULL CHECK (length(case_number) BETWEEN 6 AND 80),
  law_topic text NOT NULL CHECK (law_topic IN (
    'family','labor','housing','property','consumer','credit','damage','fraud',
    'other-criminal','bailiffs','kas','social','other')),
  case_subject text NOT NULL CHECK (length(case_subject) BETWEEN 8 AND 1500),
  outcome_first_instance text,
  decision_date date,
  official_docket_url text NOT NULL CHECK (
    official_docket_url LIKE 'https://m.mos-gorsud.ru/rs/%/services/cases/%/details/%'),
  official_document_url text,
  original_source_sha256 char(64),
  file_storage_key text,
  media_type text CHECK (media_type IN ('application/pdf','text/plain')),
  public_case_summary text,
  publication_state text NOT NULL DEFAULT 'metadata_only' CHECK (
    publication_state IN ('metadata_only','document_review','approved_document','rejected')),
  source_reuse_confirmed boolean NOT NULL DEFAULT false,
  verified_redaction boolean NOT NULL DEFAULT false,
  editor_approved boolean NOT NULL DEFAULT false,
  statutory_publication_checked boolean NOT NULL DEFAULT false,
  reviewed_on date,
  source_observed_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (publication_state <> 'approved_document' OR (
    source_reuse_confirmed=true AND verified_redaction=true AND editor_approved=true
    AND statutory_publication_checked=true AND law_topic <> 'family'
    AND original_source_sha256 ~ '^[a-f0-9]{64}$'
    AND file_storage_key IS NOT NULL AND length(file_storage_key)>12
    AND media_type IS NOT NULL AND reviewed_on IS NOT NULL
    AND official_document_url IS NOT NULL)),
  CHECK (official_document_url IS NULL OR official_document_url LIKE 'https://%'),
  UNIQUE(court_slug,case_number,official_docket_url)
);
CREATE INDEX IF NOT EXISTS moscow_decision_document_category
  ON moscow_decision_document_review(court_slug,law_topic,publication_state,decision_date DESC);
-- Report only truly reviewed and stored full acts: a docket with an outcome doesn't count.
CREATE OR REPLACE VIEW moscow_verified_document_coverage AS
SELECT court_slug, law_topic,
       count(*) FILTER (WHERE publication_state='approved_document')::integer AS verified_document_count,
       count(*)::integer AS researched_case_count,
       CASE WHEN law_topic='family' THEN NULL ELSE 50 END::integer AS documents_target,
       CASE WHEN law_topic='family' THEN NULL ELSE greatest(50 - count(*) FILTER (WHERE publication_state='approved_document'),0) END::integer AS documents_remaining
FROM moscow_decision_document_review GROUP BY court_slug,law_topic;
