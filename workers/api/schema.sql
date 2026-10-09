PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  password_hash TEXT,
  password_salt TEXT,
  password_iterations INTEGER,
  auth_provider TEXT NOT NULL,
  auth_subject TEXT,
  phone_verified INTEGER NOT NULL DEFAULT 0 CHECK (phone_verified IN (0, 1)),
  identity_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (identity_status IN ('unverified', 'requires_input', 'processing', 'verified', 'failed')),
  created_at INTEGER NOT NULL,
  UNIQUE (auth_provider, auth_subject)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS email_verifications (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS email_verifications_user_idx ON email_verifications(user_id);

CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple')),
  nonce TEXT NOT NULL,
  code_verifier TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS oauth_states_expiry_idx ON oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS phone_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS phone_challenges_user_idx ON phone_challenges(user_id, created_at);

CREATE TABLE IF NOT EXISTS identity_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_session_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL
    CHECK (status IN ('requires_input', 'processing', 'verified', 'failed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_event_created_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS identity_sessions_user_idx ON identity_sessions(user_id, created_at);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_created_at INTEGER NOT NULL,
  received_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS stripe_webhook_events_received_idx ON stripe_webhook_events(received_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  key_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_hash, window_start)
);
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits(window_start);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS audit_events_user_idx ON audit_events(user_id, created_at);
