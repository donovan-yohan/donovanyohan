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

## Theme awareness

The site has light + dark modes driven by `data-theme` on `<html>`. State source of truth is the `Context` in `components/context.tsx`, hydrated from `localStorage` (or `prefers-color-scheme`) by the inline `themeBootstrap` script in each page's `<Head>`.

When you add or touch UI on a page, follow these rules so dark mode does not silently break:

- **Prefer CSS variables** (`var(--ink)`, `var(--paper)`, `var(--rule)`, etc.) over hardcoded hex/rgba. CSS vars flip automatically under `[data-theme="dark"]` blocks in each page's `<style jsx global>`.
- **Canvas/WebGL/inline-painted graphics** (`DotGrid`, `HatchScene`, anything Canvas-2D or shader-driven) cannot read CSS vars. They take a `color` (or `inkColor`) prop. **Always pass a theme-conditional value** by reading `theme` from `Context`:
  ```tsx
  const { theme } = useContext(Context);
  <DotGrid color={theme === "dark" ? "rgba(244, 240, 228, 0.12)" : "rgba(40, 38, 32, 0.18)"} />
  ```
  Default props on these components are tuned for light mode only — relying on defaults will produce invisible dots / wrong-tint shading in dark mode.
- **New pages** must include the `themeBootstrap` `<script>` in `<Head>` before any other content, and wrap dynamic-color graphics with the `useContext(Context)` pattern above.
- **SVG strokes** can use `stroke="var(--ink)"` (CSS vars work in inline SVG). External raster images can't — swap them via theme-aware `src` if both variants exist.
- When in doubt, grep `pages/index.tsx` for `theme === "dark"` to find the canonical light/dark color pairs already in use, and reuse them.

## Vault adapter — load-bearing privacy code (forward-looking)

> **Note:** This section describes the vault adapter design that lands across
> stacked PRs in epic #30. As of this commit, only AGENTS.md + API_CONTRACT.md
> exist. The files referenced below (`lib/vault/**`, `test/leak.test.ts`,
> `test/resolveVisibility.test.ts`, `npm run vault-lint`, the
> `import/no-restricted-paths` ESLint config, the `eslint-disable` CI grep) ship
> in tickets #32–#38. This guide is in place first so nightshift sub-agents
> working on those tickets follow the contract from line one.

Files in `lib/vault/**` and the leak test in `test/leak.test.ts` are the privacy
boundary of donovanyohan.com. The vault data source is the private GitHub repo
[`donovan-yohan/dy-journal`](https://github.com/donovan-yohan/dy-journal). See
`API_CONTRACT.md` for the data shape and `VAULT.md` (lands with ticket #38) for
the operator-side contract.

### Hard rules — do NOT modify without reading API_CONTRACT.md and VAULT.md

- **`lib/vault/fail-closed.ts`** — `resolveVisibility()` is the privacy boundary.
  The test table in `test/resolveVisibility.test.ts` is the authoritative spec.
  Any change here MUST extend the table, not relax it.
- **`lib/vault/schema.ts`** — never relax `default('private')`, never remove
  `passthrough()`, never change the `visibility` enum.
- **`lib/vault/walk.ts`** — never weaken the path **ignore-list** — only
  `notes/**/*.md` is eligible content, and directories that MUST be excluded
  from the walk include `.obsidian/`, `.trash/`, `.git/`, `.github/`,
  `node_modules/`, `templates/`. Never change `followSymbolicLinks: false`.
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

### Verification commands (available as tickets land)

Today (post #31):
```bash
npm run check                         # full lint + typecheck + tests + build
npm test                              # vitest smoke tests
```

Available after #32 ships:
```bash
npm test                              # adds resolveVisibility table tests
```

Available after #36 ships:
```bash
npm run vault-lint -- __fixtures__/vault                # fixture sanity check
npm run vault-lint -- --report <vault-path>             # daily debug
```

Replace `<vault-path>` with the absolute path to your Obsidian vault — there's
no canonical sibling layout assumption. Donovan's local layout is
`~/Documents/Programs/personal/dy-journal`; forkers' layouts vary.

Available after #37 ships:
```bash
npm test                              # adds leak test as a CI gate
```

### Worktree etiquette (nightshift orchestration)

- `lib/vault/schema.ts` and `lib/vault/fail-closed.ts` are co-owned by one ticket
  (#32) — never modified across separate worktrees.
- All worktrees clean themselves up on merge or abort.
- PRs are stacked by dependency; each ticket links its base branch in the PR
  description.
