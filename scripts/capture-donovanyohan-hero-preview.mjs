import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = resolve(repoRoot, "public/img/work");
const baseUrl = process.env.PORTFOLIO_PREVIEW_URL ?? "http://127.0.0.1:3113/";
const settleMs = Number.parseInt(process.env.HERO_SETTLE_MS ?? "5200", 10);

const chromiumCandidates = [
  process.env.CHROMIUM_BIN,
  "chromium",
  "chromium-browser",
  "google-chrome",
  "google-chrome-stable",
].filter(Boolean);

const chromiumExecutable = (() => {
  for (const candidate of chromiumCandidates) {
    const result = spawnSync("bash", ["-lc", `command -v ${candidate}`], { encoding: "utf8" });
    if (result.status === 0) return result.stdout.trim();
  }
  return undefined;
})();

if (!chromiumExecutable) {
  throw new Error(
    "No Chromium binary found. Set CHROMIUM_BIN or install chromium to capture the hero preview."
  );
}

mkdirSync(publicDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromiumExecutable,
  args: ["--no-sandbox"],
});

for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({
    viewport: { width: 1536, height: 912 },
    deviceScaleFactor: 1,
    colorScheme: theme,
  });
  await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(settleMs);

  const box = await page.locator(".heroFrame").boundingBox();
  if (!box) throw new Error("Could not find .heroFrame on the portfolio homepage.");

  const png = resolve(process.env.TMPDIR ?? "/tmp", `donovanyohan-hero-${theme}.png`);
  await page.screenshot({
    path: png,
    clip: {
      x: Math.max(0, Math.floor(box.x)),
      y: Math.max(0, Math.floor(box.y)),
      width: Math.floor(box.width),
      height: Math.floor(box.height),
    },
    animations: "allow",
  });

  await sharp(png)
    .resize(1536, 864, { fit: "cover", position: "center" })
    .webp({ quality: 92 })
    .toFile(resolve(publicDir, `donovanyohan-preview-${theme}.webp`));

  await context.close();
}

await browser.close();

await sharp(resolve(publicDir, "donovanyohan-preview-dark.webp"))
  .resize(1536, 864, { fit: "cover", position: "center" })
  .webp({ quality: 92 })
  .toFile(resolve(publicDir, "donovanyohan-preview.webp"));

if (!existsSync(resolve(publicDir, "donovanyohan-preview.webp"))) {
  throw new Error("Hero preview capture did not write the fallback WebP.");
}

console.log(`captured donovanyohan hero previews from ${baseUrl} after ${settleMs}ms settle`);
