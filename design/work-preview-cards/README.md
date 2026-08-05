# WORK preview cards

Deterministic replacement for generated/AI WORK preview images.

- `index.html` is the reproducible HTML/CSS source for the branded cards.
- `scripts/render-work-preview-cards.mjs` screenshots each card with Chromium and writes WebP assets into `public/img/work/`.
- The script writes light and dark variants as `*-preview-light.webp` / `*-preview-dark.webp`, plus the legacy `*-preview.webp` path as the dark fallback.
- Intermediate Chromium PNG screenshots go to `/tmp/donovanyohan-work-preview-cards` by default, not the repo.
- `typeline-preview.webp` is intentionally not regenerated; it uses the source project branding.
- `donovanyohan-preview.webp` is intentionally captured from the real portfolio hero instead of this generic card renderer. Use `scripts/capture-donovanyohan-hero-preview.mjs` against a running local server; it uses `playwright-core` to drive your local Chromium binary and crops `.heroFrame` after the intro animations settle, rather than screenshotting the whole browser viewport.

Run from the repo root:

```bash
node scripts/render-work-preview-cards.mjs
PORTFOLIO_PREVIEW_URL=http://127.0.0.1:3113/ node scripts/capture-donovanyohan-hero-preview.mjs
```

Render one generic card while iterating:

```bash
node scripts/render-work-preview-cards.mjs belayer
```

The portfolio's own preview still uses the separate live-hero capture command above.

This needs the committed `playwright-core` devDependency plus a local Chromium binary (`chromium`, `chromium-browser`, `google-chrome`, or `CHROMIUM_BIN`).
