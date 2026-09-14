#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs the dev toolchain (ESLint, http-server, test runner deps) so that
# `npm run lint`, `npm test` and `npm run serve` work in a fresh container.
set -euo pipefail

# Only run in remote (Claude Code on the web) sessions; local checkouts manage
# their own node_modules.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found on PATH; skipping dependency install" >&2
  exit 0
fi

# npm install (not ci) so the cached container layer is reused across sessions.
npm install --no-audit --no-fund

echo "TurboTok dev environment ready: npm run lint | npm test | npm run serve"
