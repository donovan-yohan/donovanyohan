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
