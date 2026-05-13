#!/usr/bin/env node
/**
 * scripts/text-to-outline.mjs — convert a text string to a unioned SVG
 * outline path using opentype.js + Geist Mono Black.
 *
 * Algorithm:
 *   1. Load the bundled Geist Mono Black ttf.
 *   2. For each character, look up its glyph + extract the path commands.
 *   3. Split the glyph into contours (each contour starts at M and ends at
 *      Z). Compute the signed area of each contour.
 *   4. Keep only the outer contours (sign matching the font's outer
 *      winding convention — in TTF/OTF, outer contours wind in one
 *      direction and counters in the opposite). Drop counter contours so
 *      the resulting silhouette has no internal rings (A, N, R, Q, O, ?
 *      all render as solid filled shapes when filled, or as a single
 *      perimeter when stroked).
 *   5. Translate each glyph by the running x advance + kerning offset.
 *   6. Concatenate into one path. Output JSON with `d`, `viewBox`, etc.
 *
 * Usage:
 *   node scripts/text-to-outline.mjs "WANNA" > lib/text-outlines/wanna.json
 *
 * Requires:
 *   - opentype.js
 *   - tools/GeistMono-Black.ttf
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import opentype from "opentype.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FONT_PATH = join(__dirname, "..", "tools", "GeistMono-Black.ttf");

const text = process.argv[2];
if (!text) {
  console.error("usage: node text-to-outline.mjs <text>");
  process.exit(1);
}

const fontBuffer = readFileSync(FONT_PATH);
const font = opentype.parse(fontBuffer.buffer.slice(
  fontBuffer.byteOffset,
  fontBuffer.byteOffset + fontBuffer.byteLength,
));

const fontSize = 1000;
const path = font.getPath(text, 0, fontSize, fontSize, {
  kerning: true,
});

// `path.commands` is a flat list. Split into contours: each contour is
// the run of commands from one M up to (and including) the following Z.
const contours = [];
let current = null;
for (const cmd of path.commands) {
  if (cmd.type === "M") {
    if (current) contours.push(current);
    current = [cmd];
  } else if (current) {
    current.push(cmd);
  }
}
if (current) contours.push(current);

/**
 * Shoelace signed area for a polygonal approximation of the contour.
 * Curves contribute as straight segments between their endpoints — good
 * enough to determine winding direction. In opentype.js space (y-axis
 * inverted relative to font units; opentype emits SVG-style y-down), the
 * outer contours wind CLOCKWISE → positive signed area, and inner
 * counters wind COUNTER-CLOCKWISE → negative signed area. We keep the
 * positive (outer) contours and drop the rest.
 */
const signedArea = (contour) => {
  const pts = [];
  for (const c of contour) {
    if (c.type === "Z") continue;
    pts.push([c.x, c.y]);
  }
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
};

// Keep ALL contours — outer perimeters AND inner counter rings. Stroking
// the result traces each glyph's true silhouette including the cutouts
// (A's triangle, R's hole, ?'s ring, etc.). The earlier outer-only pass
// was too aggressive — the cutouts are part of the glyph's read.
const outers = contours;

// Compute the bounding box of the kept contours to derive the viewBox.
let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;
for (const c of outers) {
  for (const cmd of c) {
    const xs = [cmd.x, cmd.x1, cmd.x2].filter((v) => typeof v === "number");
    const ys = [cmd.y, cmd.y1, cmd.y2].filter((v) => typeof v === "number");
    for (const x of xs) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    for (const y of ys) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const pad = 40;
const vbX = minX - pad;
const vbY = minY - pad;
const vbW = maxX - minX + pad * 2;
const vbH = maxY - minY + pad * 2;

const round = (n) => Math.round(n * 100) / 100;

// Serialize contours back to SVG path data, shifting so the contents
// align to a 0,0-origin viewBox.
const toD = () => {
  const parts = [];
  for (const c of outers) {
    for (const cmd of c) {
      const sx = (n) => round(n - vbX);
      const sy = (n) => round(n - vbY);
      switch (cmd.type) {
        case "M":
          parts.push(`M ${sx(cmd.x)} ${sy(cmd.y)}`);
          break;
        case "L":
          parts.push(`L ${sx(cmd.x)} ${sy(cmd.y)}`);
          break;
        case "Q":
          parts.push(
            `Q ${sx(cmd.x1)} ${sy(cmd.y1)} ${sx(cmd.x)} ${sy(cmd.y)}`,
          );
          break;
        case "C":
          parts.push(
            `C ${sx(cmd.x1)} ${sy(cmd.y1)} ${sx(cmd.x2)} ${sy(cmd.y2)} ${sx(
              cmd.x,
            )} ${sy(cmd.y)}`,
          );
          break;
        case "Z":
          parts.push("Z");
          break;
      }
    }
  }
  return parts.join(" ");
};

const dStr = toD();
const viewBox = `0 0 ${round(vbW)} ${round(vbH)}`;

const result = {
  text,
  viewBox,
  width: round(vbW),
  height: round(vbH),
  d: dStr,
};

console.log(JSON.stringify(result, null, 2));

// Optional companion: when MASK_OUT env var is set, write a filled
// silhouette SVG to disk too. HatchScene with `mask: { kind: "svg", src }`
// consumes this to align its hatching to the exact same geometry as the
// outline-stroke path, so the cross-hatch fades in perfectly over the
// pre-drawn outline (no buildTextCanvas/Geist-Mono drift).
if (process.env.MASK_OUT) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${round(vbW)}" height="${round(vbH)}"><path fill="#000" stroke="none" fill-rule="evenodd" d="${dStr}"/></svg>\n`;
  const out = process.env.MASK_OUT;
  const dir = out.split("/").slice(0, -1).join("/");
  if (dir) mkdirSync(dir, { recursive: true });
  writeFileSync(out, svg);
}
