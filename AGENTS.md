# Agent Guide

## Project

This is Donovan Yohan's portfolio site. It uses Next.js Pages Router, React, styled-jsx, and TypeScript. Do not migrate to App Router unless explicitly asked.

## Commands

- `npm run dev` — start local development server.
- `npm run lint` — ESLint flat config over the repo.
- `npm run typecheck` — TypeScript typecheck.
- `npm run test:run` — Vitest/jsdom smoke tests.
- `npm run build` — production Next.js build.
- `npm run check` — lint + typecheck + tests + build; run before opening PRs.

## Constraints

- Keep visual behavior stable unless the task is explicitly a redesign.
- Use the existing Pages Router and component structure.
- Keep generated folders (`.next`, `out`, `coverage`, `node_modules`) out of edits.
- Future design-system work should align content and layout to the dot-grid/sketchbook direction in `DESIGN.md`.

## Vault adapter — load-bearing privacy code

Files in `lib/vault/**` and the leak test in `test/leak.test.ts` are the privacy
boundary of donovanyohan.com. The vault data source is the private GitHub repo
[`donovan-yohan/dy-journal`](https://github.com/donovan-yohan/dy-journal). See
`API_CONTRACT.md` for the data shape and `VAULT.md` (in this repo, ships with
ticket #38) for the operator-side contract.

### Hard rules — do NOT modify without reading API_CONTRACT.md and VAULT.md

- **`lib/vault/fail-closed.ts`** — `resolveVisibility()` is the privacy boundary.
  The test table in `test/resolveVisibility.test.ts` is the authoritative spec.
  Any change here MUST extend the table, not relax it.
- **`lib/vault/schema.ts`** — never relax `default('private')`, never remove
  `passthrough()`, never change the `visibility` enum.
- **`lib/vault/walk.ts`** — never weaken the allowlist
  (`.obsidian/`, `.trash/`, `.git/`, `.github/`, `node_modules/`, `templates/`),
  never change `followSymbolicLinks: false`.
- **`schema.ts` and `fail-closed.ts` are co-owned**. Do not split them across
  parallel worktrees. They must change atomically.
- **Public route imports MUST come from `lib/vault/index.ts`**. Never import
  `adapter-local`, `adapter-github` directly from pages. ESLint
  `import/no-restricted-paths` enforces this.
- **No `eslint-disable` allowed in `lib/vault/**`**. CI greps for it and fails.
- **The leak test in CI must pass before any merge**. If it fails, the right
  response is to fix the leak — not silence the test.
- **No module-init side effects** in `lib/vault/*`. No I/O, no env validation,
  no throws at import time. Pure imports only.

### Verification commands

```bash
npm test                              # vitest suite incl. leak test + resolveVisibility table
npm run vault-lint __fixtures__/vault # checks fixture vault
npm run vault-lint -- --report ../dy-journal  # Donovan's daily check
npm run check                         # full lint + typecheck + tests + build
```

### Worktree etiquette (nightshift orchestration)

- `lib/vault/schema.ts` and `lib/vault/fail-closed.ts` are co-owned by one ticket
  (#32) — never modified across separate worktrees.
- All worktrees clean themselves up on merge or abort.
- PRs are stacked by dependency; each ticket links its base branch in the PR
  description.
