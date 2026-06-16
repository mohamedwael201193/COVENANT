#!/usr/bin/env bash
# Single Render service: skill (public PORT) + indexer (internal 8788).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[render] running prisma migrate deploy..."
(cd packages/indexer && npx prisma migrate deploy)

echo "[render] starting skill on port ${PORT:-8787}..."
node packages/skill/dist/index.js &
SKILL_PID=$!

sleep 2

echo "[render] starting indexer on port 8788..."
(
  export INDEXER_HTTP_PORT=8788
  unset PORT
  node packages/indexer/dist/index.js
) &
INDEXER_PID=$!

shutdown() {
  kill "$SKILL_PID" "$INDEXER_PID" 2>/dev/null || true
}
trap shutdown SIGTERM SIGINT EXIT

wait -n "$SKILL_PID" "$INDEXER_PID"
exit $?
