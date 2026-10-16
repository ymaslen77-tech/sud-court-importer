-- 017: Novosibirsk 149-OZ (2026): 138 legal boundary annexes require official originals.
-- Placeholder slots are NOT territories, maps, approved courts or point-in-polygon inputs.
CREATE TABLE IF NOT EXISTS court_jurisdiction_normative_acts (
 id BIGSERIAL PRIMARY KEY,
 region_code CHAR(2) NOT NULL CHECK(region_code ~ '^[0-9]{2}$'),
 act_code VARCHAR(80) NOT NULL UNIQUE,
 act_date DATE NOT NULL,
 official_document_url TEXT NOT NULL CHECK(official_document_url LIKE 'https://%'),
 subject TEXT NOT NULL,
 expected_annex_count INT NOT NULL CHECK(expected_annex_count>=0),
 review_status TEXT NOT NULL DEFAULT 'research_only' CHECK(review_status='research_only'),
 effective_date_verified BOOLEAN NOT NULL DEFAULT false CHECK(effective_date_verified=false),
 permitted_for_jurisdiction BOOLEAN NOT NULL DEFAULT false CHECK(permitted_for_jurisdiction=false),
 review_notes TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS court_jurisdiction_annex_backlog (
 act_id BIGINT NOT NULL REFERENCES court_jurisdiction_normative_acts(id),
 annex_no INT NOT NULL CHECK(annex_no>0),
 attachment_status TEXT NOT NULL DEFAULT 'awaiting_official_attachment' CHECK(attachment_status='awaiting_official_attachment'),
 original_document_url TEXT,
 court_code VARCHAR(20),
 boundary_geometry JSONB,
 allowed_for_routing BOOLEAN NOT NULL DEFAULT false CHECK(allowed_for_routing=false),
 PRIMARY KEY(act_id,annex_no),
 CHECK(original_document_url IS NULL AND court_code IS NULL AND boundary_geometry IS NULL)
);
-- The existing approvedRules file and verified court_jurisdiction_units table remain unchanged.
