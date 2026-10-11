CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE regions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(8) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);
CREATE TABLE sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  publisher TEXT NOT NULL,
  source_type TEXT NOT NULL,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE courts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES regions(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  court_type TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  official_url TEXT,
  location GEOGRAPHY(POINT,4326),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','verified','retired')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(region_id,slug),
  CHECK (status <> 'verified' OR verified_at IS NOT NULL)
);
CREATE TABLE judges (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE judicial_appointments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  judge_id BIGINT NOT NULL REFERENCES judges(id),
  court_id BIGINT NOT NULL REFERENCES courts(id),
  position TEXT NOT NULL,
  starts_on DATE,
  ends_on DATE,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);
CREATE TABLE court_facts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  field_name TEXT NOT NULL,
  value TEXT NOT NULL,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_from DATE,
  valid_to DATE,
  is_approved BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE change_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  changed_field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  source_id BIGINT REFERENCES sources(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX courts_region_idx ON courts(region_id);
CREATE INDEX courts_verified_idx ON courts(status,region_id);
CREATE INDEX court_facts_court_idx ON court_facts(court_id,field_name);
CREATE INDEX appointments_court_idx ON judicial_appointments(court_id);
