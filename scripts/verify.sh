#!/usr/bin/env bash
set -euo pipefail

npm ci --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
npm run build
