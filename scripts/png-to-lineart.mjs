#!/usr/bin/env node
/**
 * scripts/png-to-lineart.mjs — turn a generated image (or any photo /
 * illustration) into a two-layer manga-style SVG: solid ink shadows
 * beneath, fine edge-traced line art on top.
 *
 * Pipeline:
 *   1. ImageMagick downsamples + grayscales the input. Two threshold
 *      passes:
 *        a. A high-contrast threshold pass yields the solid shadow
 *           silhouettes (the bold black blobs in a manga panel).
 *        b. Canny edge detection + slight pre-blur yields the fine line
 *           art (silhouettes, fabric folds, hair strands, etc.).
 *   2. potrace vectorises both bitmaps into SVG path data.
 *   3. The two layers are stacked into one SVG: shadows below, lines on
 *      top. Both layers share the input's pixel viewBox so they stay
 *      pixel-aligned.
 *
 * Usage:
 *   node scripts/png-to-lineart.mjs <input.png> <output.svg>
 *
 * Requires:
 *   - magick (`brew install imagemagick`)
 *   - potrace (`brew install potrace`)
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("usage: node png-to-lineart.mjs <input> <output.svg>");
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), "lineart-"));
const linesPbm = join(tmp, "lines.pbm");
const shadowsPbm = join(tmp, "shadows.pbm");
const linesSvg = join(tmp, "lines.svg");
const shadowsSvg = join(tmp, "shadows.svg");

// Line art: values tuned via /lab/lineart on the codex dy-studies.png.
// Bigger working resolution (3600x) preserves fine fabric + foliage.
// A very gentle sigmoidal contrast + a 1px pre-blur smooth out skin
// gradients before Canny, so the neck/forehead stop generating spurious
// lines while hair strands + cloth folds survive.
execFileSync("magick", [
  inputPath,
  "-resize", "3600x",
  "-colorspace", "Gray",
  "-sigmoidal-contrast", "1x55%",
  "-blur", "0x1",
  "-canny", "0x1+4%+25%",
  "-negate",
  linesPbm,
]);
execFileSync("potrace", [
  "--backend", "svg",
  "--svg",
  "--turdsize", "4",
  "--alphamax", "0.9",
  "--opttolerance", "0.15",
  "--output", linesSvg,
  linesPbm,
]);

// Solid shadows: capture more mid-tones as filled ink. Higher cutoff
// + level rescale brings clothing folds + face shadows into the
// black-fill layer, matching the ink-and-screentone manga look.
// NOTE: no `-negate` here. potrace traces black pixels in the bitmap, and
// `-threshold 40%` already maps dark source regions (hair, deep shadows,
// inky clothing) to black. Negating would invert the polarity and pull
// the SKIN + paper into the shadow layer instead of the actual shadows.
execFileSync("magick", [
  inputPath,
  "-resize", "3600x",
  "-colorspace", "Gray",
  "-level", "10%,100%",
  "-threshold", "11%",
  shadowsPbm,
]);
execFileSync("potrace", [
  "--backend", "svg",
  "--svg",
  "--turdsize", "20",
  "--alphamax", "1.0",
  "--opttolerance", "0.3",
  "--output", shadowsSvg,
  shadowsPbm,
]);

const extractGroup = (svgText) => {
  const transformMatch = svgText.match(/<g transform="([^"]+)"[^>]*>/);
  const innerMatch = svgText.match(
    /<g transform="[^"]+"[^>]*>([\s\S]+?)<\/g>/,
  );
  if (!transformMatch || !innerMatch) {
    throw new Error("could not parse potrace output");
  }
  return { transform: transformMatch[1], paths: innerMatch[1] };
};

const linesRaw = readFileSync(linesSvg, "utf8");
const shadowsRaw = readFileSync(shadowsSvg, "utf8");
const lines = extractGroup(linesRaw);
const shadows = extractGroup(shadowsRaw);

const vbMatch = linesRaw.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
if (!vbMatch) throw new Error("no viewBox in line-art svg");
const [, vbW, vbH] = vbMatch;

const combined = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet">
  <g transform="${shadows.transform}" fill="black" stroke="none">${shadows.paths}</g>
  <g transform="${lines.transform}" fill="black" stroke="none">${lines.paths}</g>
</svg>
`;

writeFileSync(outputPath, combined);
console.error(
  `wrote ${outputPath} (${combined.length} bytes, ${lines.paths.split("<path").length - 1} line paths, ${shadows.paths.split("<path").length - 1} shadow paths)`,
);
