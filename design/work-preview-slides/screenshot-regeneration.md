# Screenshot-based work preview regeneration

The deployed WORK preview graphics are now derived from current live UI screenshots instead of generic Baoyu-style palettes.

## Source screenshots

Captured at 1536 × 864 using headless Chromium:

- `screenshots/typeline-ui.png` — `https://typeline.app`
- `screenshots/lexitiles-ui.png` — `https://lexitiles.donovanyohan.com`
- `screenshots/sample-sound-ui.png` — `https://soundboard.donovanyohan.com`
- `screenshots/donovanyohan-ui.png` — `https://donovanyohan.com`

## Output assets

Final card assets are 1536 × 864 PNGs under `public/img/work/`:

- `typeline-preview.png`
- `lexitiles-preview.png`
- `sample-sound-preview.png`
- `donovanyohan-preview.png`

Editable SVG sources are kept in `generated-svg/`.

## Palette notes

- typeline: near-black UI, muted gray type rows, bright cyan controls/results (`#00e5ef`).
- lexitiles: dark slate panels, pale blue-gray text, periwinkle CTA/tiles (`#5865f2`).
- sample-sound: almost-black neon grid, large rounded sound cards, hot pink stop/accent (`#ff2d70`) plus cyan/lime/orange/purple badges.
- donovanyohan.com: white editorial page, oversized black `dy`, black type, yellow highlight strips (`#ffe600`).

The corresponding WORK card accent colors and image backgrounds in `lib/work-projects.ts` should stay aligned with these palettes.
