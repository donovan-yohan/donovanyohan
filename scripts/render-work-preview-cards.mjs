import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceHtml = resolve(repoRoot, "design/work-preview-cards/index.html");
const renderedDir = resolve(process.env.TMPDIR ?? "/tmp", "donovanyohan-work-preview-cards");
const publicDir = resolve(repoRoot, "public/img/work");

const cards = [
  "relay-ide",
  "dynamic-workflows",
  "remote-hosts",
  "carabiner",
  "comfyui-image-backend",
  "talent-roster",
  "lexitiles",
  "sample-sound",
  "dicesuki",
  "open-music-player",
  "belayer",
];

const selectedCards = process.argv.slice(2);
const unknownCards = selectedCards.filter((slug) => !cards.includes(slug));
if (unknownCards.length > 0) {
  throw new Error(`Unknown WORK preview card slug(s): ${unknownCards.join(", ")}`);
}
const cardsToRender = selectedCards.length > 0 ? selectedCards : cards;

const chromiumCandidates = [
  process.env.CHROMIUM_BIN,
  "chromium",
  "chromium-browser",
  "google-chrome",
  "google-chrome-stable",
].filter(Boolean);

const chromium = chromiumCandidates.find((candidate) => {
  const result = spawnSync("bash", ["-lc", `command -v ${candidate}`], { encoding: "utf8" });
  return result.status === 0;
});

if (!chromium) {
  throw new Error(
    "No Chromium binary found. Set CHROMIUM_BIN or install chromium to render WORK preview screenshots."
  );
}

mkdirSync(renderedDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

const renderPng = (slug, theme) => {
  const output = resolve(renderedDir, `${slug}-${theme}.png`);
  const url = `file://${sourceHtml}?slug=${slug}&theme=${theme}`;
  const result = spawnSync(
    chromium,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1536,864",
      `--screenshot=${output}`,
      url,
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0 || !existsSync(output)) {
    throw new Error(`Chromium failed for ${slug}/${theme}:\n${result.stdout}\n${result.stderr}`);
  }
  return output;
};

for (const slug of cardsToRender) {
  for (const theme of ["light", "dark"]) {
    const png = renderPng(slug, theme);
    const webp = resolve(publicDir, `${slug}-preview-${theme}.webp`);
    await sharp(png).resize(1536, 864, { fit: "cover" }).webp({ quality: 92 }).toFile(webp);
  }

  // Keep the legacy single-image path as the dark variant for non-theme-aware consumers.
  await sharp(resolve(publicDir, `${slug}-preview-dark.webp`))
    .resize(1536, 864, { fit: "cover" })
    .webp({ quality: 92 })
    .toFile(resolve(publicDir, `${slug}-preview.webp`));
}

console.log(`rendered ${cardsToRender.length} deterministic WORK preview cards using ${chromium}`);
