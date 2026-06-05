---
illustration_type: screenshot-inspired-product-preview
style: product-ui-schematic
image_count: 4
---

# Work project preview slides

Screenshot-inspired preview graphics for deployed WORK cards. These are not title slides; the card title lives in UI text outside the image. The goal is to make each cover inherit the live app's palette, density, and UI motifs instead of forcing every project into the same generic Baoyu/paper style.

## Shared visual system

- landscape 16:9 card covers, final PNG size 1536 × 864
- generated from editable SVG sources under `generated-svg/`
- use live-site screenshots under `screenshots/` as palette/layout references
- match the deployed app vibe first; portfolio card consistency comes from the surrounding card chrome
- keep text decorative/minimal enough that minor rasterization is not content-critical

## 01 — typeline

**Purpose**: show the dark typing-test surface: logo bar, cyan controls, monospaced typing rows, timer/progress line, and WPM/accuracy rhythm chart.
**Filename**: typeline-preview.png
**Source screenshot**: screenshots/typeline-ui.png
**Accent**: cyan `#00e5ef`
**Background**: near-black `#0d0d0d`

## 02 — lexitiles

**Purpose**: show the dark slate word-puzzle dashboard: periwinkle CTA, puzzle history rows, and fragment tiles.
**Filename**: lexitiles-preview.png
**Source screenshot**: screenshots/lexitiles-ui.png
**Accent**: periwinkle `#5865f2`
**Background**: slate `#11151d`

## 03 — sample-sound

**Purpose**: show the neon meme soundboard: top filter/volume bar, large rounded sound pads, category badges, and colored orb accents.
**Filename**: sample-sound-preview.png
**Source screenshot**: screenshots/sample-sound-ui.png
**Accent**: hot pink `#ff2d70`
**Background**: near-black purple `#08060d`

## 04 — donovanyohan.com

**Purpose**: show the portfolio's current white editorial surface: oversized black `dy`, clean nav, large type, yellow highlight strips, and rounded work card.
**Filename**: donovanyohan-preview.png
**Source screenshot**: screenshots/donovanyohan-ui.png
**Accent**: yellow `#ffe600`
**Background**: white `#ffffff`
