#!/usr/bin/env bash
# Single Render service: indexer (background) + skill (public PORT).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[render] running prisma migrate deploy..."
(cd packages/indexer && npx prisma migrate deploy)

echo "[render] starting indexer on port 8788..."
INDEXER_HTTP_PORT=8788 node packages/indexer/dist/index.js &
INDEXER_PID=$!

echo "[render] starting skill on port ${PORT:-8787}..."
node packages/skill/dist/index.js &
SKILL_PID=$!

shutdown() {
  kill "$INDEXER_PID" "$SKILL_PID" 2>/dev/null || true
}
trap shutdown SIGTERM SIGINT EXIT

wait -n "$INDEXER_PID" "$SKILL_PID"
exit $?
