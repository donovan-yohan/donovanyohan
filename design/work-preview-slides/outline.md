---
illustration_type: full-baoyu-infographic-title-slides
style: text-free generated project visuals
image_count: 12
---

# Work project preview slides

Full Baoyu workflow project preview graphics for WORK cards. These are **not** HTML/SVG mockups and not screenshots; each final card asset is generated image-model output, then cropped to the 16:9 card format.

The actual card title/blurb/tags live in the website UI outside the image. Therefore the generated image itself must contain no readable words, letters, numerals, logos, fake code, or UI labels.

## Shared visual system

- final card covers: 1536 × 864 WebP under `public/img/work/`
- full workflow provenance per project under `full-flow/<slug>/`:
  - `source-*.md`
  - `analysis.md`
  - `structured-content.md`
  - `prompts/infographic.md`
  - final generated image is installed under `public/img/work/<slug>-preview.webp`
- for projects with deployed pages, use the actual page only for palette and theme style guidance
- typeline is the exception: use the updated TypelineLogo SVG from the typeline repo as the final card art instead of AI-generated artwork
- for GitHub-only repos, create a Baoyu title-slide visual metaphor from repo metadata
- no deterministic SVG/HTML substitutions

## Deployed page cards

| Project          | Source style                           | Final asset                 |
| ---------------- | -------------------------------------- | --------------------------- |
| typeline         | near-black/cyan typing game            | `typeline-preview.webp`     |
| lexitiles        | dark slate/periwinkle puzzle app       | `lexitiles-preview.webp`    |
| sample-sound     | dark neon soundboard                   | `sample-sound-preview.webp` |
| donovanyohan.com | white/black/yellow editorial portfolio | `donovanyohan-preview.webp` |

## GitHub-only cards

| Project           | Visual metaphor                          | Final asset                          |
| ----------------- | ---------------------------------------- | ------------------------------------ |
| Relay IDE         | remote browser-to-terminal agent control | `relay-ide-preview.webp`             |
| Dynamic Workflows | executable workflow graph/machine        | `dynamic-workflows-preview.webp`     |
| Remote Hosts      | secure SSH host constellation            | `remote-hosts-preview.webp`          |
| Carabiner Memory  | collaboration memory carabiner graph     | `carabiner-preview.webp`             |
| ComfyUI Backend   | node-based image generation pipeline     | `comfyui-image-backend-preview.webp` |
| Talent Roster     | agent roster routing + Kanban assignment | `talent-roster-preview.webp`         |
| Open Music Player | waveform-heavy DJ queue                  | `open-music-player-preview.webp`     |
| Belayer           | supervised multi-repo agent belay system | `belayer-preview.webp`               |
