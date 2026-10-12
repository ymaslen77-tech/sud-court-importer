-- 004: Verified category of a court. Never infer from website name or region.
-- Only editor-approved/known source codes populate court_kind.
ALTER TABLE courts ADD COLUMN IF NOT EXISTS court_kind TEXT NOT NULL DEFAULT 'unclassified';
ALTER TABLE courts DROP CONSTRAINT IF EXISTS courts_court_kind_check;
ALTER TABLE courts ADD CONSTRAINT courts_court_kind_check CHECK(court_kind IN (
 'unclassified','constitutional','supreme','general-magistrate','general-district',
 'general-regional','general-appeal','general-cassation','military-garrison',
 'military-district','military-appeal','military-cassation',
 'arbitration-subject','arbitration-appeal','arbitration-district','arbitration-ip'
));
CREATE INDEX IF NOT EXISTS courts_kind_verified_idx ON courts(court_kind, status, region_id);
