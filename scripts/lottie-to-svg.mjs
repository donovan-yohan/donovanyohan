#!/usr/bin/env node
/**
 * Convert the dy Lottie animation into a static SVG of the final frame.
 * Walks each layer/group/shape, applies transforms, emits cubic-bezier paths.
 * Stroke width and joins/caps are read from the Lottie 'st' shape.
 * Output: public/img/dy.svg
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const inputPath = path.join(root, "public/img/animations/dy.json");
const outputPath = path.join(root, "public/img/dy.svg");

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const W = data.w;
const H = data.h;

const fmt = (n) => Math.round(n * 100) / 100;

const buildPath = (shape, layerTransform, groupTransform) => {
  const { i, o, v, c } = shape.ks.k;
  if (!v || v.length === 0) return "";

  const transform = (p) => {
    const lx = p[0] + groupTransform.p[0] - layerTransform.a[0];
    const ly = p[1] + groupTransform.p[1] - layerTransform.a[1];
    const sx = lx * (layerTransform.s[0] / 100);
    const sy = ly * (layerTransform.s[1] / 100);
    return [sx + layerTransform.p[0], sy + layerTransform.p[1]];
  };

  const segments = [];
  const start = transform(v[0]);
  segments.push(`M ${fmt(start[0])} ${fmt(start[1])}`);

  const lastIndex = v.length - 1;
  for (let n = 0; n < lastIndex; n++) {
    const next = n + 1;
    const v0 = v[n];
    const v1 = v[next];
    const o0 = o[n];
    const i1 = i[next];

    const isLine =
      o0[0] === 0 && o0[1] === 0 && i1[0] === 0 && i1[1] === 0;
    const p1 = transform(v1);

    if (isLine) {
      segments.push(`L ${fmt(p1[0])} ${fmt(p1[1])}`);
    } else {
      const c1 = transform([v0[0] + o0[0], v0[1] + o0[1]]);
      const c2 = transform([v1[0] + i1[0], v1[1] + i1[1]]);
      segments.push(
        `C ${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p1[0])} ${fmt(p1[1])}`
      );
    }
  }

  if (c) segments.push("Z");
  return segments.join(" ");
};

const paths = [];

for (const layer of data.layers) {
  if (layer.ty !== 4) continue;

  const layerTransform = {
    p: layer.ks.p.k,
    a: layer.ks.a.k,
    s: layer.ks.s.k,
  };

  for (const shapeOrGroup of layer.shapes) {
    if (shapeOrGroup.ty !== "gr") continue;

    const items = shapeOrGroup.it;
    const groupTransform = items.find((x) => x.ty === "tr");
    const stroke = items.find((x) => x.ty === "st");
    const shapeItems = items.filter((x) => x.ty === "sh");

    const groupT = {
      p: groupTransform?.p?.k ?? [0, 0],
    };

    const strokeWidth = stroke?.w?.k ?? 20;
    const strokeColor = stroke?.c?.k ?? [0, 0, 0, 1];
    const lineCap = stroke?.lc === 2 ? "round" : "butt";
    const lineJoin = stroke?.lj === 2 ? "round" : "miter";

    for (const shape of shapeItems) {
      const d = buildPath(shape, layerTransform, groupT);
      if (!d) continue;
      paths.push({
        d,
        strokeWidth: strokeWidth * (layerTransform.s[0] / 100),
        strokeColor,
        lineCap,
        lineJoin,
      });
    }
  }
}

const colorToHex = (rgba) => {
  const r = Math.round(rgba[0] * 255);
  const g = Math.round(rgba[1] * 255);
  const b = Math.round(rgba[2] * 255);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};

const pathEls = paths
  .map(
    (p) =>
      `  <path d="${p.d}" fill="none" stroke="${colorToHex(p.strokeColor)}" stroke-width="${fmt(p.strokeWidth)}" stroke-linecap="${p.lineCap}" stroke-linejoin="${p.lineJoin}" />`
  )
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${pathEls}
</svg>
`;

fs.writeFileSync(outputPath, svg);
console.log(`Wrote ${outputPath}`);
console.log(`viewBox 0 0 ${W} ${H}`);
console.log(`paths: ${paths.length}`);
