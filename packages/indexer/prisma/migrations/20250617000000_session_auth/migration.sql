-- Session + approval persistence for wallet authorization UX
CREATE TABLE IF NOT EXISTS siwe_nonces (
  wallet_address VARCHAR(42) PRIMARY KEY,
  nonce VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  agent_address VARCHAR(42),
  permissions JSONB NOT NULL,
  max_spend_wei TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  wallet_address VARCHAR(42) NOT NULL,
  intent_hash VARCHAR(66) NOT NULL,
  verdict VARCHAR(8) NOT NULL,
  preflight_summary JSONB NOT NULL,
  execution_payload JSONB,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  tx_hash VARCHAR(66),
  decision_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS approval_requests_session_id_idx ON approval_requests(session_id);
