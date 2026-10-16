-- 016: official territorial publications, staged WITHOUT production jurisdiction approval.
-- These tables are distinct from court_jurisdiction_units (the verified registry).
CREATE TABLE IF NOT EXISTS court_jurisdiction_research_sources (
  id BIGSERIAL PRIMARY KEY,
  external_code VARCHAR(20) NOT NULL,
  region_code CHAR(2) NOT NULL CHECK (region_code ~ '^[0-9]{2}$'),
  source_url TEXT NOT NULL CHECK (source_url LIKE 'https://%'),
  source_status TEXT NOT NULL CHECK (source_status IN ('territory_published','page_unfilled','not_checked','inaccessible')),
  last_official_update DATE,
  researched_on DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  review_status TEXT NOT NULL DEFAULT 'research_only' CHECK(review_status='research_only'),
  allowed_for_routing BOOLEAN NOT NULL DEFAULT false CHECK(allowed_for_routing=false),
  UNIQUE(external_code,source_url)
);
CREATE TABLE IF NOT EXISTS court_jurisdiction_research_excerpts (
  id BIGSERIAL PRIMARY KEY,
  research_source_id BIGINT NOT NULL REFERENCES court_jurisdiction_research_sources(id),
  source_item_no INTEGER NOT NULL CHECK(source_item_no>=1 AND source_item_no<=10000),
  description TEXT NOT NULL CHECK(length(btrim(description))>=3),
  review_status TEXT NOT NULL DEFAULT 'research_only' CHECK(review_status='research_only'),
  allowed_for_routing BOOLEAN NOT NULL DEFAULT false CHECK(allowed_for_routing=false),
  UNIQUE(research_source_id,source_item_no)
);
CREATE INDEX IF NOT EXISTS court_jurisdiction_research_sources_region_idx
  ON court_jurisdiction_research_sources(region_code,external_code);
-- No new records are inserted into courts, court_jurisdiction_units, or approvedRules.
