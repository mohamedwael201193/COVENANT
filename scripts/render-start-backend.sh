#!/usr/bin/env bash
# Single Render service: skill (public PORT, foreground) + indexer (internal 8788).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[render] running prisma migrate deploy..."
(cd packages/indexer && npx prisma migrate deploy)

# Swap primary/fallback RPC on Render so dplabs is tried first when both are set
if [ -n "${PHAROS_RPC_URL_FALLBACK:-}" ]; then
  export PHAROS_RPC_PRIMARY="${PHAROS_RPC_URL}"
  export PHAROS_RPC_URL="${PHAROS_RPC_URL_FALLBACK}"
  export PHAROS_RPC_URL_FALLBACK="${PHAROS_RPC_PRIMARY}"
  unset PHAROS_RPC_PRIMARY
fi

export SKILL_DECISION_WATCHER_ENABLED=false
export PREFLIGHT_LLM_ENABLED=false
export INDEXER_POLL_INTERVAL_MS=${INDEXER_POLL_INTERVAL_MS:-30000}

echo "[render] starting indexer on port 8788..."
(
  export INDEXER_HTTP_PORT=8788
  unset PORT
  node packages/indexer/dist/index.js
) &
INDEXER_PID=$!

shutdown() {
  kill "$INDEXER_PID" 2>/dev/null || true
}
trap shutdown SIGTERM SIGINT EXIT

echo "[render] starting skill on port ${PORT:-8787} (foreground)..."
exec node packages/skill/dist/index.js
