#!/bin/sh
set -eu

if [ "${1:-}" != "--yes" ]; then
  echo "Usage: ./scripts/init-project.sh --yes" >&2
  echo "This removes template Git history and resets SPEC.md and tasks/." >&2
  exit 2
fi

if [ ! -f AGENTS.md ] || [ ! -d .agents/skills ] || [ ! -d tasks ]; then
  echo "Run this script from the template repository root." >&2
  exit 1
fi

rm -rf .git
git init -b main

cat > SPEC.md <<'EOF'
# SPEC.md

Status: awaiting product spec

Run `$vibe-spec` and describe the product before planning or implementation.
EOF

cat > tasks/plan.md <<'EOF'
# Task Plan

Status: awaiting plan

Run `$vibe-plan` after `SPEC.md` is confirmed.
EOF

cat > tasks/todo.md <<'EOF'
# Todo

No tasks planned. Run `$vibe-plan` after `SPEC.md` is confirmed.
EOF

cat > tasks/test-result.md <<'EOF'
# Test Results

No E2E runs recorded yet.
EOF

echo "Project initialized. Start Codex and run \$vibe-spec."
