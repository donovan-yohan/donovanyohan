/**
 * pages/api/lineart.ts — dev-only endpoint that runs the manga line-art
 * pipeline (magick + potrace) against a hardcoded source image with
 * caller-tunable params. Returns SVG inline.
 *
 * Used by the /lab/lineart tuner page so the operator can dial in good
 * thresholds for a given source image before committing them to the
 * static `scripts/png-to-lineart.mjs` bake script.
 *
 * Production safety: the route spawns `magick` + `potrace` binaries from
 * the host. Vercel/serverless deploys don't ship those, so we gate this
 * to NODE_ENV !== 'production'.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DEFAULT_INPUT = join(process.cwd(), "public/img/manga/dy-studies.png");

const num = (
  v: string | string[] | undefined,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (Array.isArray(v)) v = v[0];
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (process.env.NODE_ENV === "production") {
    res.status(403).send("lineart tuner is dev-only");
    return;
  }

  const q = req.query;
  const resize = num(q.resize, 2200, 600, 4000);
  const contrastK = num(q.contrastK, 6, 0, 20);
  const contrastM = num(q.contrastM, 55, 0, 100);
  const blur = num(q.blur, 0.4, 0, 4);
  const cannyLow = num(q.cannyLow, 4, 0, 30);
  const cannyHigh = num(q.cannyHigh, 18, 0, 80);
  const lineTurd = num(q.lineTurd, 4, 1, 80);
  const shadowThreshold = num(q.shadowThreshold, 18, 0, 80);
  const shadowLevelLow = num(q.shadowLevelLow, 10, 0, 50);
  const shadowLevelHigh = num(q.shadowLevelHigh, 92, 40, 100);
  const shadowTurd = num(q.shadowTurd, 20, 1, 200);

  const tmp = mkdtempSync(join(tmpdir(), "lineart-api-"));
  const linesPbm = join(tmp, "lines.pbm");
  const shadowsPbm = join(tmp, "shadows.pbm");
  const linesSvg = join(tmp, "lines.svg");
  const shadowsSvg = join(tmp, "shadows.svg");

  try {
    execFileSync("magick", [
      DEFAULT_INPUT,
      "-resize",
      `${resize}x`,
      "-colorspace",
      "Gray",
      "-sigmoidal-contrast",
      `${contrastK}x${contrastM}%`,
      "-blur",
      `0x${blur}`,
      "-canny",
      `0x1+${cannyLow}%+${cannyHigh}%`,
      "-negate",
      linesPbm,
    ]);
    execFileSync("potrace", [
      "--backend",
      "svg",
      "--svg",
      "--turdsize",
      String(lineTurd),
      "--alphamax",
      "0.9",
      "--opttolerance",
      "0.15",
      "--output",
      linesSvg,
      linesPbm,
    ]);

    execFileSync("magick", [
      DEFAULT_INPUT,
      "-resize",
      `${resize}x`,
      "-colorspace",
      "Gray",
      "-level",
      `${shadowLevelLow}%,${shadowLevelHigh}%`,
      "-threshold",
      `${shadowThreshold}%`,
      shadowsPbm,
    ]);
    execFileSync("potrace", [
      "--backend",
      "svg",
      "--svg",
      "--turdsize",
      String(shadowTurd),
      "--alphamax",
      "1.0",
      "--opttolerance",
      "0.3",
      "--output",
      shadowsSvg,
      shadowsPbm,
    ]);

    const linesRaw = readFileSync(linesSvg, "utf8");
    const shadowsRaw = readFileSync(shadowsSvg, "utf8");

    const extract = (svg: string) => {
      const t = svg.match(/<g transform="([^"]+)"[^>]*>/);
      const inner = svg.match(/<g transform="[^"]+"[^>]*>([\s\S]+?)<\/g>/);
      return t && inner
        ? { transform: t[1], paths: inner[1] }
        : { transform: "", paths: "" };
    };
    const lines = extract(linesRaw);
    const shadows = extract(shadowsRaw);
    const vb = linesRaw.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    const vbW = vb?.[1] ?? "1000";
    const vbH = vb?.[2] ?? "1000";

    const combined = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet"><g transform="${shadows.transform}" fill="black" stroke="none">${shadows.paths}</g><g transform="${lines.transform}" fill="black" stroke="none">${lines.paths}</g></svg>`;

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(combined);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
