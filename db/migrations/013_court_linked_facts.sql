-- 013: independently reviewed related facts for verified courts.
-- No backfill, staging promotion, or automatic approval is performed here.
-- Only approved rows may be served publicly; 'draft' is the safe default.
CREATE TABLE IF NOT EXISTS court_buildings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  building_role TEXT NOT NULL CHECK(building_role IN ('primary','additional','reception','archive','other')),
  label TEXT NOT NULL CHECK(length(trim(label)) BETWEEN 2 AND 200),
  address TEXT NOT NULL CHECK(length(trim(address)) BETWEEN 5 AND 500),
  access_notes TEXT,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK(review_status IN ('draft','approved','retired')),
  reviewed_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(review_status <> 'approved' OR
    (reviewed_by IS NOT NULL AND length(trim(reviewed_by)) BETWEEN 2 AND 120
     AND verified_at IS NOT NULL AND verified_at <= now())),
  UNIQUE(court_id,building_role,address)
);
CREATE UNIQUE INDEX IF NOT EXISTS court_buildings_one_approved_primary
  ON court_buildings(court_id) WHERE building_role='primary' AND review_status='approved';
CREATE INDEX IF NOT EXISTS court_buildings_review_idx
  ON court_buildings(court_id,review_status);

CREATE TABLE IF NOT EXISTS court_contact_points (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  building_id BIGINT REFERENCES court_buildings(id),
  department TEXT NOT NULL CHECK(length(trim(department)) BETWEEN 2 AND 200),
  channel TEXT NOT NULL CHECK(channel IN ('phone','email','fax')),
  contact_value TEXT NOT NULL CHECK(length(trim(contact_value)) BETWEEN 4 AND 320),
  source_id BIGINT NOT NULL REFERENCES sources(id),
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK(review_status IN ('draft','approved','retired')),
  reviewed_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(review_status <> 'approved' OR
    (reviewed_by IS NOT NULL AND length(trim(reviewed_by)) BETWEEN 2 AND 120
     AND verified_at IS NOT NULL AND verified_at <= now())),
  UNIQUE(court_id,department,channel,contact_value)
);
CREATE INDEX IF NOT EXISTS court_contact_points_review_idx
  ON court_contact_points(court_id,review_status);

CREATE TABLE IF NOT EXISTS court_jurisdiction_units (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  court_id BIGINT NOT NULL REFERENCES courts(id),
  scope_kind TEXT NOT NULL CHECK(scope_kind IN ('territorial','instance','specialization')),
  description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 10 AND 5000),
  jurisdiction_region_code TEXT,
  precision_level TEXT NOT NULL DEFAULT 'general'
    CHECK(precision_level IN ('general','region','municipality','street','house')),
  source_id BIGINT NOT NULL REFERENCES sources(id),
  rule_url TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK(review_status IN ('draft','approved','retired')),
  reviewed_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(review_status <> 'approved' OR
    (reviewed_by IS NOT NULL AND length(trim(reviewed_by)) BETWEEN 2 AND 120
     AND verified_at IS NOT NULL AND verified_at <= now())),
  CHECK(rule_url IS NULL OR rule_url ~ '^https://'),
  CHECK(jurisdiction_region_code IS NULL OR jurisdiction_region_code ~ '^[0-9]{2}$')
);
CREATE INDEX IF NOT EXISTS court_jurisdiction_units_review_idx
  ON court_jurisdiction_units(court_id,scope_kind,review_status);

-- These are evidence-led reference facts, NOT an address/house-level
-- jurisdiction resolver. No automatic matching from description text.
