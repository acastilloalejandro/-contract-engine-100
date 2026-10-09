-- Apply after workers/api/schema.sql on an existing D1 deployment.
-- This migration is additive and stores only non-sensitive per-user case metadata.
CREATE TABLE IF NOT EXISTS real_estate_cases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_type TEXT NOT NULL CHECK (property_type IN ('segunda_mano','obra_nueva')),
  phase INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 5),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS real_estate_cases_owner_idx ON real_estate_cases(user_id, created_at DESC);
