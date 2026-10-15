-- 015: public source-labelled court reference records. These are NOT editorially
-- verified courts and never populate the 'courts' or 'court_facts' tables.
CREATE TABLE IF NOT EXISTS court_public_references (
  import_row_id BIGINT PRIMARY KEY REFERENCES court_import_rows(id),
  region_code VARCHAR(8) NOT NULL CHECK(region_code ~ '^[0-9]{2}$'),
  external_code VARCHAR(20) NOT NULL UNIQUE,
  public_slug VARCHAR(100) NOT NULL,
  official_header_name TEXT NOT NULL CHECK(length(trim(official_header_name)) BETWEEN 5 AND 300),
  official_home_url TEXT NOT NULL CHECK(official_home_url ~ '^https://[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.sudrf\.ru/$'),
  source_url TEXT NOT NULL CHECK(source_url ~ '^https://'),
  source_observed_on DATE NOT NULL,
  current_freshness_attested BOOLEAN NOT NULL DEFAULT false,
  publication_class TEXT NOT NULL DEFAULT 'sourced_reference' CHECK(publication_class='sourced_reference'),
  public_since TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(region_code,public_slug),
  CHECK(current_freshness_attested=false)
);
CREATE INDEX IF NOT EXISTS court_public_references_region
  ON court_public_references(region_code,public_slug);
-- The strict verified registry is deliberately untouched.
