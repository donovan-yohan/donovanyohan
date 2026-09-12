#!/usr/bin/env bash
#
# TypeScript-only policy: new source files must be .ts/.tsx.
#
# This used to be an ESLint `no-restricted-syntax` rule. oxlint does not
# implement that rule, so the guard lives here instead — otherwise the policy
# would have silently evaporated during the oxlint migration.
#
# Only tracked files are checked, so build output and node_modules are
# irrelevant by construction.
set -euo pipefail

# Grandfathered by exact path, not by directory, so a *new* .js file in an
# allowed directory still fails.
#
#   next.config.js  CommonJS, uses __dirname for turbopack.root
ALLOWED=(
  "next.config.js"
)

mapfile -t found < <(git ls-files '*.js' '*.jsx' | sort)

violations=()
for file in "${found[@]}"; do
  allowed=false
  for ok in "${ALLOWED[@]}"; do
    if [ "$file" = "$ok" ]; then
      allowed=true
      break
    fi
  done
  if [ "$allowed" = false ]; then
    violations+=("$file")
  fi
done

if [ ${#violations[@]} -gt 0 ]; then
  echo "ERROR: JavaScript files found that are not grandfathered:" >&2
  printf '  %s\n' "${violations[@]}" >&2
  echo >&2
  echo "This project is TypeScript-only. Create new files as .ts/.tsx." >&2
  echo "If a file genuinely cannot be TypeScript, add it to ALLOWED in" >&2
  echo "scripts/ci/check-no-new-js.sh with a comment explaining why." >&2
  exit 1
fi

echo "check-no-new-js: OK — ${#found[@]} .js/.jsx file(s), all grandfathered"
