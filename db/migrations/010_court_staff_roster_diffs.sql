-- Comparison signals only; never mutate judicial appointments automatically.
CREATE TABLE IF NOT EXISTS court_staff_roster_diff_runs (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 older_batch_id BIGINT NOT NULL REFERENCES court_staff_roster_batches(id),
 newer_batch_id BIGINT NOT NULL REFERENCES court_staff_roster_batches(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (older_batch_id <> newer_batch_id),
 UNIQUE(older_batch_id,newer_batch_id)
);
CREATE TABLE IF NOT EXISTS court_staff_roster_diff_items (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 run_id BIGINT NOT NULL REFERENCES court_staff_roster_diff_runs(id),
 subject_key TEXT NOT NULL,
 full_name TEXT NOT NULL,
 field_name TEXT NOT NULL,
 change_kind TEXT NOT NULL CHECK(change_kind IN('first_listed','no_longer_listed','field_changed')),
 old_value TEXT,
 new_value TEXT,
 review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN('pending','reviewed','ignored')),
 reviewed_by TEXT,
 reviewed_at TIMESTAMPTZ,
 UNIQUE(run_id,subject_key,field_name,change_kind)
);
CREATE INDEX IF NOT EXISTS staff_roster_diff_pending ON court_staff_roster_diff_items(review_status,id);
