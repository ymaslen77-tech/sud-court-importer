-- 007: Reconciliation between two independently staged, official registry snapshots.
-- A missing or changed record NEVER mutates the public court record automatically.
CREATE TABLE IF NOT EXISTS court_registry_diff_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  older_batch_id BIGINT NOT NULL REFERENCES court_import_batches(id),
  newer_batch_id BIGINT NOT NULL REFERENCES court_import_batches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (older_batch_id<>newer_batch_id),
  UNIQUE(older_batch_id,newer_batch_id)
);
CREATE TABLE IF NOT EXISTS court_registry_diff_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES court_registry_diff_runs(id),
  external_code TEXT NOT NULL,
  field_name TEXT NOT NULL,
  change_kind TEXT NOT NULL CHECK(change_kind IN('new','missing','changed')),
  old_value TEXT,
  new_value TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(review_status IN('pending','reviewed','ignored')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(run_id,external_code,field_name)
);
CREATE INDEX IF NOT EXISTS court_registry_diff_items_queue_idx
  ON court_registry_diff_items(review_status,run_id,id);
