#!/usr/bin/env bash
# Canonical Render build — works with dashboard or render.yaml.
set -euo pipefail
cd "$(dirname "$0")/.."

corepack enable
pnpm install --frozen-lockfile
pnpm generate:abis
pnpm --filter covenant-shared build
pnpm --filter covenant-skill build
pnpm --filter @covenant/indexer build

echo "[render-build] OK"
