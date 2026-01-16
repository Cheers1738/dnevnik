#!/usr/bin/env bash
set -euo pipefail

npm ci --workspaces --include-workspace-root --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
npm run build
