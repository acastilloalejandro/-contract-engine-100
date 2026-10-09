-- Apply this file only to a D1 database initialized from an older schema.sql
-- that does not yet contain identity_sessions.last_event_created_at or
-- stripe_webhook_events. Fresh databases should use the current schema.sql instead.
ALTER TABLE identity_sessions
  ADD COLUMN last_event_created_at INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_created_at INTEGER NOT NULL,
  received_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_received_idx
  ON stripe_webhook_events(received_at);
