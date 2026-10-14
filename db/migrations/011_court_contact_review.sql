-- 011: Review-only semantic changes in saved official court contact pages.
-- These tables do NOT imply that a phone belongs to a specific office or judge.
CREATE TABLE IF NOT EXISTS court_contact_snapshots (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 watch_id BIGINT NOT NULL REFERENCES court_source_watch(id),
 captured_on DATE NOT NULL,
 content_sha256 CHAR(64) NOT NULL,
 source_url TEXT NOT NULL,
 observed_by TEXT NOT NULL,
 observations JSONB NOT NULL,
 ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(watch_id,content_sha256),
 CHECK (length(observed_by) BETWEEN 2 AND 120)
);
CREATE INDEX IF NOT EXISTS court_contact_snapshots_latest
 ON court_contact_snapshots(watch_id,captured_on DESC,id DESC);

CREATE TABLE IF NOT EXISTS court_contact_change_events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 older_snapshot_id BIGINT NOT NULL REFERENCES court_contact_snapshots(id),
 newer_snapshot_id BIGINT NOT NULL REFERENCES court_contact_snapshots(id),
 contact_kind TEXT NOT NULL CHECK(contact_kind IN ('phone','email')),
 contact_key TEXT NOT NULL,
 change_kind TEXT NOT NULL CHECK(change_kind IN ('newly_observed','not_observed_in_new_snapshot')),
 source_context TEXT,
 review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','reviewed','ignored')),
 reviewed_by TEXT,
 reviewed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(older_snapshot_id<>newer_snapshot_id),
 UNIQUE(newer_snapshot_id,contact_kind,contact_key,change_kind)
);
CREATE INDEX IF NOT EXISTS court_contact_changes_queue
 ON court_contact_change_events(review_status,id);
