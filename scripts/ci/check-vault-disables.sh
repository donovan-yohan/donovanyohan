#!/usr/bin/env bash
#
# AGENTS.md: "No `eslint-disable` allowed in lib/vault/**. CI greps for it and
# fails." This script is that grep. It was documented long before it existed.
#
# lib/vault/** is the privacy boundary. Silencing the linter there is how a leak
# gets shipped, so the directive is banned outright rather than reviewed
# case-by-case. Both eslint- and oxlint- prefixes are checked: the repo migrated
# to oxlint, and a stale eslint-disable would otherwise slip through unnoticed.
set -euo pipefail

TARGET="lib/vault"

if [ ! -d "$TARGET" ]; then
  echo "check-vault-disables: '$TARGET' not found — run from the repo root." >&2
  exit 2
fi

# -r recursive, -n line numbers, -E extended regex. Deliberately not anchored to
# comment syntax: the point is that the string must not appear at all.
if matches=$(grep -rnE '(eslint|oxlint)-disable' "$TARGET" 2>/dev/null); then
  echo "ERROR: lint-disable directive found in $TARGET/ — this is the privacy boundary." >&2
  echo >&2
  echo "$matches" >&2
  echo >&2
  echo "Per AGENTS.md, lint rules must not be silenced in $TARGET/." >&2
  echo "If a rule is firing here, fix the code — do not disable the rule." >&2
  exit 1
fi

echo "check-vault-disables: OK — no lint-disable directives in $TARGET/"
