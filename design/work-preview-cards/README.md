# WORK preview cards

Deterministic replacement for generated/AI WORK preview images.

- `index.html` is the reproducible HTML/CSS source for the branded cards.
- `scripts/render-work-preview-cards.mjs` screenshots each card with Chromium and writes WebP assets into `public/img/work/`.
- The script writes light and dark variants as `*-preview-light.webp` / `*-preview-dark.webp`, plus the legacy `*-preview.webp` path as the dark fallback.
- Intermediate Chromium PNG screenshots go to `/tmp/donovanyohan-work-preview-cards` by default, not the repo.
- `typeline-preview.webp` is intentionally not regenerated; it uses the source project branding.
- `donovanyohan-preview.webp` is intentionally captured from the real portfolio hero instead of this generic card renderer.

Run from the repo root:

```bash
node scripts/render-work-preview-cards.mjs
```

This needs a local Chromium binary (`chromium`, `chromium-browser`, `google-chrome`, or `CHROMIUM_BIN`).
