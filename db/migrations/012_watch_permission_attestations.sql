-- 012: Immutable operator declarations authorizing monitored source access.
-- Attestations record what a human reported; they do NOT legally certify reuse.
CREATE TABLE IF NOT EXISTS court_watch_permission_attestations (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 watch_id BIGINT NOT NULL REFERENCES court_source_watch(id),
 reviewer TEXT NOT NULL CHECK(length(reviewer) BETWEEN 2 AND 120),
 terms_url TEXT NOT NULL CHECK(terms_url ~ '^https://'),
 permission_basis TEXT NOT NULL CHECK(length(permission_basis) BETWEEN 20 AND 2000),
 attested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS court_watch_permissions_recent ON
 court_watch_permission_attestations(watch_id,attested_at DESC);
