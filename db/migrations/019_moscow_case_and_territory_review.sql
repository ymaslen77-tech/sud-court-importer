-- 019: Moscow case/territorial evidence staging only. NOT a production publish operation.
-- Apply after operational and source-permission review; no court records are declared verified by this migration.
CREATE TABLE IF NOT EXISTS moscow_case_source_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_slug text NOT NULL CHECK (court_slug ~ '^[a-z]+$'),
  case_number text NOT NULL,
  topic_id text NOT NULL,
  case_subject text NOT NULL,
  source_url text NOT NULL CHECK (source_url LIKE 'https://mos-gorsud.ru/rs/%' OR source_url LIKE 'https://www.mos-gorsud.ru/rs/%'),
  source_observed_on date NOT NULL,
  reuse_permission_confirmed boolean NOT NULL DEFAULT false,
  review_status text NOT NULL DEFAULT 'research_only'
    CHECK (review_status IN ('research_only','pending_review','approved_for_display','rejected')),
  -- Restrict direct publish until review and reuse authorization.
  CHECK (review_status <> 'approved_for_display' OR reuse_permission_confirmed = true),
  source_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(court_slug,case_number,source_url,source_observed_on)
);
CREATE INDEX IF NOT EXISTS moscow_cases_by_court_topic
 ON moscow_case_source_review(court_slug,topic_id,source_observed_on DESC);
CREATE TABLE IF NOT EXISTS moscow_territorial_address_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_slug text NOT NULL CHECK (court_slug ~ '^[a-z]+$'),
  normalized_street text NOT NULL,
  normalized_house text NOT NULL,
  normalized_building text NOT NULL DEFAULT '',
  source_url text NOT NULL CHECK (source_url LIKE 'https://mos-gorsud.ru/%' OR source_url LIKE 'https://www.mos-gorsud.ru/%'),
  source_observed_on date NOT NULL,
  reuse_permission_confirmed boolean NOT NULL DEFAULT false,
  review_status text NOT NULL DEFAULT 'research_only'
    CHECK (review_status IN ('research_only','pending_review','approved_for_display','rejected')),
  CHECK (review_status <> 'approved_for_display' OR reuse_permission_confirmed = true),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(court_slug,normalized_street,normalized_house,normalized_building,source_url)
);
CREATE INDEX IF NOT EXISTS moscow_territorial_lookup_review
 ON moscow_territorial_address_review(normalized_street,normalized_house,normalized_building,review_status);
-- Absence or conflicting active reviewed matches must fail closed in application logic.
-- No data are imported or promoted to "approved_for_display" here.
