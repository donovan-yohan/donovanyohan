/**
 * fetch-share-previews.ts — operator-side share-card preview image resolver.
 *
 * Reshare cards on /blog fall back to a letter monogram when the note has no
 * `preview.image`. This script resolves a real preview image for each public
 * reshare and writes it into the vault, so the card renders the linked page's
 * own artwork instead.
 *
 * Usage:
 *   npm run share-previews -- <vault-path>
 *   npm run share-previews -- --force <vault-path>
 *   npm run share-previews -- --dry-run --only pi-mono <vault-path>
 *
 * Flags:
 *   --force         re-fetch notes that already have `preview.image`
 *   --dry-run       resolve + report, write nothing
 *   --only <match>  restrict to notes whose slug or path contains <match>
 *                   (repeatable)
 *   --timeout <ms>  per-request timeout (default 15000)
 *
 * Exit codes:
 *   0 — ran to completion (per-note failures are reported, not fatal)
 *   1 — bad arguments or an unreadable vault
 *
 * Design decisions:
 *   - Operator-side only. The site build stays deterministic: nothing here
 *     runs in `getStaticProps` or at render time. The vault is the source of
 *     truth, exactly as it is for hand-authored article images.
 *   - Images land at `<note-dir>/imgs/<slug>-preview.webp` and are referenced
 *     as `preview.image: imgs/<slug>-preview.webp`, which is the same
 *     convention `lib/vault/assets.ts` already publishes to
 *     `/vault-assets/<slug>/…`.
 *   - Output is a 1376x768 canvas (`fit: contain`, transparent padding) to
 *     match `knownImageAspectRatio()` in lib/vault/to-notebook.ts and the
 *     existing hand-authored article images. Card covers use
 *     `object-fit: contain`, so nothing is ever cropped away — wide
 *     open-graph cards (GitHub's 2:1 repo cards, for example) keep their
 *     text legible instead of losing their edges to a 16:9 crop.
 *   - Frontmatter is edited surgically (one inserted/replaced line) rather
 *     than re-serialised, so hand-formatted block scalars survive untouched.
 *   - Idempotent: a note that already has `preview.image` is skipped unless
 *     `--force`.
 *   - Failures are per-note and non-fatal — the card simply keeps its
 *     monogram fallback.
 *   - No I/O at module init; all side effects live inside main().
 *   - No eslint-disable directives anywhere.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { load as yamlLoad } from "js-yaml";

import { walkVault } from "../lib/vault/walk.js";
import { deriveSlug } from "../lib/vault/slug.js";
import { resolveVisibility } from "../lib/vault/fail-closed.js";
import { resolveVaultAssetRef } from "../lib/vault/assets.js";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Card cover canvas. Mirrors the hand-authored article images (1376x768). */
export const CARD_IMAGE_WIDTH = 1376;
export const CARD_IMAGE_HEIGHT = 768;

const DEFAULT_TIMEOUT_MS = 15_000;
/** Only the document head is interesting; cap the HTML we keep in memory. */
const MAX_HTML_BYTES = 2_000_000;
/** Refuse absurd source images before handing them to the encoder. */
const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
/** YouTube serves a 120x90 grey placeholder for some missing thumbnails. */
const MIN_SOURCE_IMAGE_WIDTH = 200;

const USER_AGENT =
  "Mozilla/5.0 (compatible; donovanyohan-share-previews/1.0; +https://donovanyohan.com)";

// ── Types ─────────────────────────────────────────────────────────────────────

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

export interface ScriptOptions {
  vaultPath: string;
  force: boolean;
  dryRun: boolean;
  only: string[];
  timeoutMs: number;
}

export type ParsedArgs = { ok: true; options: ScriptOptions } | { ok: false; message: string };

type OutcomeStatus = "resolved" | "skipped" | "failed";

interface NoteOutcome {
  status: OutcomeStatus;
  slug: string;
  relPath: string;
  detail: string;
}

/** Where a preview image came from — surfaced in the per-note log line. */
type ImageOrigin = "youtube" | "og:image" | "twitter:image";

interface ResolvedSource {
  url: string;
  origin: ImageOrigin;
}

// ── Argument parsing ──────────────────────────────────────────────────────────

/**
 * Parses CLI args. Pure over its input — returns a tagged result rather than
 * calling process.exit, so tests can assert on it directly.
 */
export function parseArgs(args: string[]): ParsedArgs {
  let vaultPath: string | null = null;
  let force = false;
  let dryRun = false;
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  const only: string[] = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--force") {
      force = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--only") {
      const value = args[i + 1];
      if (value === undefined || value.startsWith("--")) {
        return { ok: false, message: "--only requires a value" };
      }
      only.push(value);
      i += 1;
    } else if (arg === "--timeout") {
      const value = args[i + 1];
      const parsed = value === undefined ? NaN : Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return { ok: false, message: "--timeout requires a positive number of milliseconds" };
      }
      timeoutMs = parsed;
      i += 1;
    } else if (arg.startsWith("--")) {
      return { ok: false, message: `unknown flag: ${arg}` };
    } else if (vaultPath === null) {
      vaultPath = arg;
    } else {
      return { ok: false, message: `unexpected extra argument: ${arg}` };
    }
  }

  if (vaultPath === null) {
    return { ok: false, message: "missing <vault-path>" };
  }

  return { ok: true, options: { vaultPath, force, dryRun, only, timeoutMs } };
}

// ── URL helpers ───────────────────────────────────────────────────────────────

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
]);
const YOUTUBE_PATH_PREFIXES = new Set(["embed", "shorts", "live", "v"]);

/**
 * Extracts an 11-character YouTube video id from any of the shapes a shared
 * link takes: youtu.be/<id>, /watch?v=<id>, /embed/<id>, /shorts/<id>,
 * /live/<id>. Returns null for anything that isn't a YouTube video URL.
 */
export function youtubeVideoId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    const id = segments[0];
    return id !== undefined && YOUTUBE_ID_RE.test(id) ? id : null;
  }

  if (!YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  const queryId = url.searchParams.get("v");
  if (queryId !== null && YOUTUBE_ID_RE.test(queryId)) {
    return queryId;
  }

  if (segments.length >= 2 && YOUTUBE_PATH_PREFIXES.has(segments[0])) {
    return YOUTUBE_ID_RE.test(segments[1]) ? segments[1] : null;
  }

  return null;
}

/**
 * Thumbnail URLs for a video id, best quality first. `maxresdefault` is
 * missing for plenty of videos and 404s; the rest are progressively smaller
 * fallbacks, and `hqdefault` effectively always exists.
 */
export function youtubeThumbnailCandidates(videoId: string): string[] {
  return ["maxresdefault", "hq720", "sddefault", "hqdefault"].map(
    (name) => `https://i.ytimg.com/vi/${videoId}/${name}.jpg`
  );
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
  "#x27": "'",
  nbsp: " ",
};

/**
 * Decodes the handful of HTML entities that realistically show up inside a
 * `content="…"` attribute. Numeric references are handled generically;
 * anything unrecognised is left alone rather than mangled.
 */
export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    const named = NAMED_ENTITIES[entity.toLowerCase()] ?? NAMED_ENTITIES[entity];
    if (named !== undefined) return named;

    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return match;
  });
}

const META_TAG_RE = /<meta\b[^>]*>/gi;
const ATTRIBUTE_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/g;

/**
 * Ordered preference for the meta key that carries the share image. Open
 * Graph first (it is what every other reshare surface reads), Twitter's
 * variants as the fallback.
 */
const IMAGE_META_KEYS: Array<{ key: string; origin: ImageOrigin }> = [
  { key: "og:image:secure_url", origin: "og:image" },
  { key: "og:image:url", origin: "og:image" },
  { key: "og:image", origin: "og:image" },
  { key: "twitter:image", origin: "twitter:image" },
  { key: "twitter:image:src", origin: "twitter:image" },
];

/**
 * Pulls the best share image out of a page's `<meta>` tags.
 *
 * Deliberately regex-based rather than DOM-based: we only need attribute
 * pairs off self-closing tags in the head, and the vault script should not
 * drag a parser dependency in for it.
 */
export function extractMetaImage(html: string): { url: string; origin: ImageOrigin } | null {
  const head = html.slice(0, MAX_HTML_BYTES);
  const found = new Map<string, string>();

  for (const tagMatch of head.matchAll(META_TAG_RE)) {
    const tag = tagMatch[0];
    let key: string | null = null;
    let content: string | null = null;

    for (const attrMatch of tag.matchAll(ATTRIBUTE_RE)) {
      const name = attrMatch[1].toLowerCase();
      const value = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";
      if (name === "property" || name === "name" || name === "itemprop") {
        key = value.trim().toLowerCase();
      } else if (name === "content" || name === "value") {
        content = value;
      }
    }

    if (key !== null && content !== null && content.trim() !== "" && !found.has(key)) {
      found.set(key, content.trim());
    }
  }

  for (const { key, origin } of IMAGE_META_KEYS) {
    const raw = found.get(key);
    if (raw !== undefined) {
      return { url: decodeHtmlEntities(raw), origin };
    }
  }

  return null;
}

/**
 * Resolves a possibly-relative image reference against the page it came from
 * and rejects anything that isn't plain http(s).
 */
export function absolutizeUrl(candidate: string, baseUrl: string): string | null {
  try {
    const url = new URL(candidate, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

// ── Frontmatter helpers ───────────────────────────────────────────────────────

export interface FrontmatterBlock {
  /** The YAML text between the `---` fences. */
  yaml: string;
  /** Index in the file where the YAML text starts. */
  start: number;
  /** Index in the file where the YAML text ends (exclusive). */
  end: number;
}

/**
 * Locates the frontmatter fence. Mirrors scripts/vault-lint.ts: an opening
 * fence with no closing fence is malformed, not "no frontmatter", so it
 * returns null and the note is left untouched.
 */
export function readFrontmatterBlock(content: string): FrontmatterBlock | null {
  if (!content.startsWith("---")) return null;

  const rest = content.slice(3);
  const closeIdx = rest.search(/\n---(\n|$)/);
  if (closeIdx === -1) return null;

  return { yaml: rest.slice(0, closeIdx), start: 3, end: 3 + closeIdx };
}

const indentWidth = (line: string): number => /^[ \t]*/.exec(line)?.[0].length ?? 0;

/** `excerpt: |`, `quote: >-`, etc. — a key whose value is a block scalar. */
const BLOCK_SCALAR_KEY_RE = /^[ \t]*[^:\s#][^:]*:[ \t]*[|>][-+0-9]*[ \t]*$/;

/**
 * Inserts or replaces `preview.image` inside a frontmatter YAML block,
 * touching exactly one line.
 *
 * Re-serialising with a YAML writer would reflow every hand-formatted block
 * scalar in the note (the `excerpt: |` and `quote: |` bodies), so this walks
 * the raw lines instead. Only lines at the preview block's own key indent are
 * treated as keys, which keeps block-scalar content from being mistaken for
 * an `image:` key.
 */
export function withPreviewImage(yamlBlock: string, imageRef: string): string {
  const lines = yamlBlock.split("\n");
  const previewIdx = lines.findIndex((line) => /^preview:[ \t]*$/.test(line));

  if (previewIdx === -1) {
    return `${yamlBlock}\npreview:\n  image: ${imageRef}`;
  }

  // The preview block runs until the next line at column 0 (a sibling key).
  let blockEnd = lines.length;
  for (let i = previewIdx + 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "") continue;
    if (indentWidth(lines[i]) === 0) {
      blockEnd = i;
      break;
    }
  }

  // Child key indent = indent of the block's first non-empty line.
  let childIndent = "  ";
  for (let i = previewIdx + 1; i < blockEnd; i += 1) {
    if (lines[i].trim() === "") continue;
    childIndent = /^[ \t]*/.exec(lines[i])?.[0] ?? "  ";
    break;
  }

  // Walk the block's own keys. An existing `image:` is replaced in place;
  // otherwise the new key goes after the last scalar key but before the first
  // block scalar (`excerpt: |`), which is where a human would have put it.
  let insertAt = previewIdx + 1;

  for (let i = previewIdx + 1; i < blockEnd; i += 1) {
    const line = lines[i];
    if (line.trim() === "" || indentWidth(line) !== childIndent.length) continue;

    if (/^[ \t]*image[ \t]*:/.test(line)) {
      const replaced = lines.slice();
      replaced[i] = `${childIndent}image: ${imageRef}`;
      return replaced.join("\n");
    }

    if (BLOCK_SCALAR_KEY_RE.test(line)) {
      insertAt = i;
      break;
    }

    insertAt = i + 1;
  }

  const next = lines.slice();
  next.splice(insertAt, 0, `${childIndent}image: ${imageRef}`);
  return next.join("\n");
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringField = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

/**
 * Resolves the outbound link for a reshare. Mirrors `externalHrefForNote()`
 * in pages/blog/index.tsx so the script targets exactly the notes whose cards
 * render an outbound link.
 */
export function shareLinkUrl(frontmatter: Record<string, unknown>): string | undefined {
  const nested = isRecord(frontmatter.external)
    ? frontmatter.external
    : isRecord(frontmatter.url)
      ? frontmatter.url
      : isRecord(frontmatter.link)
        ? frontmatter.link
        : undefined;

  return (
    stringField(nested?.url) ??
    stringField(frontmatter.sourceUrl) ??
    stringField(frontmatter.externalUrl) ??
    stringField(frontmatter.canonicalUrl) ??
    stringField(frontmatter.url) ??
    stringField(frontmatter.href) ??
    stringField(frontmatter.link)
  );
}

/** Existing `preview.image`, if the note already has a usable one. */
export function existingPreviewImage(frontmatter: Record<string, unknown>): string | undefined {
  const preview = frontmatter.preview;
  return isRecord(preview) ? stringField(preview.image) : undefined;
}

// ── Network ───────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number, accept: string): Promise<Response> {
  return fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": USER_AGENT,
      accept,
      "accept-language": "en-US,en;q=0.9",
    },
  });
}

/**
 * Fetches a page and reads its share image meta tag. Returns null when the
 * page is unreachable, is not HTML, or advertises no image.
 */
async function resolvePageImage(
  pageUrl: string,
  timeoutMs: number
): Promise<ResolvedSource | { error: string }> {
  let response: Response;
  try {
    response = await fetchWithTimeout(
      pageUrl,
      timeoutMs,
      "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"
    );
  } catch (err) {
    return { error: `page fetch failed (${errorMessage(err)})` };
  }

  if (!response.ok) {
    return { error: `page fetch returned HTTP ${response.status}` };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType !== "" && !/html|xml/i.test(contentType)) {
    return { error: `page is not HTML (content-type: ${contentType})` };
  }

  let html: string;
  try {
    html = await response.text();
  } catch (err) {
    return { error: `page body read failed (${errorMessage(err)})` };
  }

  const meta = extractMetaImage(html);
  if (meta === null) {
    return { error: "no og:image or twitter:image on the page" };
  }

  const absolute = absolutizeUrl(meta.url, response.url || pageUrl);
  if (absolute === null) {
    return { error: `unusable image URL: ${meta.url}` };
  }

  return { url: absolute, origin: meta.origin };
}

type DownloadResult = { ok: true; buffer: Buffer } | { ok: false; error: string };

/** Downloads an image, enforcing the size cap. */
async function downloadImage(url: string, timeoutMs: number): Promise<DownloadResult> {
  let response: Response;
  try {
    response = await fetchWithTimeout(url, timeoutMs, "image/avif,image/webp,image/*,*/*;q=0.8");
  } catch (err) {
    return { ok: false, error: `image fetch failed (${errorMessage(err)})` };
  }

  if (!response.ok) {
    return { ok: false, error: `image fetch returned HTTP ${response.status}` };
  }

  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_IMAGE_BYTES) {
    return { ok: false, error: `image too large (${declaredLength} bytes)` };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await response.arrayBuffer());
  } catch (err) {
    return { ok: false, error: `image body read failed (${errorMessage(err)})` };
  }

  if (buffer.byteLength === 0) {
    return { ok: false, error: "image body was empty" };
  }
  if (buffer.byteLength > MAX_SOURCE_IMAGE_BYTES) {
    return { ok: false, error: `image too large (${buffer.byteLength} bytes)` };
  }

  return { ok: true, buffer };
}

// ── Image conversion ──────────────────────────────────────────────────────────

interface ConvertedImage {
  buffer: Buffer;
  sourceWidth: number;
  sourceHeight: number;
}

/**
 * Normalises a downloaded image onto the card canvas.
 *
 * `fit: contain` with transparent padding rather than a crop: card covers use
 * `object-fit: contain` against the paper background, so padding is invisible
 * in both themes and no part of a wide open-graph card is thrown away.
 *
 * sharp is imported dynamically so this module stays importable (and
 * testable) without loading a native binding.
 */
async function convertToCardImage(source: Buffer): Promise<ConvertedImage | { error: string }> {
  let sharp: typeof import("sharp").default;
  try {
    sharp = (await import("sharp")).default;
  } catch (err) {
    return { error: `sharp is unavailable (${errorMessage(err)})` };
  }

  try {
    const metadata = await sharp(source).metadata();
    const sourceWidth = metadata.width ?? 0;
    const sourceHeight = metadata.height ?? 0;

    if (sourceWidth < MIN_SOURCE_IMAGE_WIDTH) {
      return { error: `image too small to be a real preview (${sourceWidth}x${sourceHeight})` };
    }

    const buffer = await sharp(source)
      .resize(CARD_IMAGE_WIDTH, CARD_IMAGE_HEIGHT, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 82, effort: 5 })
      .toBuffer();

    return { buffer, sourceWidth, sourceHeight };
  } catch (err) {
    return { error: `image conversion failed (${errorMessage(err)})` };
  }
}

// ── Per-note pipeline ─────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

async function processNote(
  vaultRoot: string,
  relPath: string,
  options: ScriptOptions
): Promise<NoteOutcome | null> {
  const absPath = path.join(vaultRoot, relPath);

  let content: string;
  try {
    content = await readFile(absPath, "utf-8");
  } catch (err) {
    return { status: "failed", slug: relPath, relPath, detail: `read error: ${errorMessage(err)}` };
  }

  const block = readFrontmatterBlock(content);
  if (block === null) return null;

  let frontmatter: unknown;
  try {
    frontmatter = yamlLoad(block.yaml);
  } catch {
    return null;
  }
  if (!isRecord(frontmatter)) return null;
  if (frontmatter.type !== "reshare") return null;

  const slug = deriveSlug(path.basename(relPath), stringField(frontmatter.slug));

  if (
    options.only.length > 0 &&
    !options.only.some((match) => slug.includes(match) || relPath.includes(match))
  ) {
    return null;
  }

  // Same eligibility gate the site uses. A private reshare has no public card
  // to fix, and fetching for it would leak the fact that it exists.
  if (resolveVisibility(frontmatter) !== "public") {
    return { status: "skipped", slug, relPath, detail: "not public" };
  }

  const linkUrl = shareLinkUrl(frontmatter);
  if (linkUrl === undefined) {
    return { status: "skipped", slug, relPath, detail: "no link.url" };
  }

  const existing = existingPreviewImage(frontmatter);
  if (existing !== undefined && !options.force) {
    return {
      status: "skipped",
      slug,
      relPath,
      detail: `already has preview.image (${existing}) — use --force to refetch`,
    };
  }

  // Resolve a source image URL and its bytes.
  let source: ResolvedSource;
  let downloaded: Buffer;
  const videoId = youtubeVideoId(linkUrl);

  if (videoId !== null) {
    // YouTube exposes no useful og:image on the watch page for our purposes;
    // derive the thumbnail from the video id and walk down the quality
    // ladder until one of them exists.
    let found: { url: string; buffer: Buffer } | null = null;
    let lastError = "no candidates";

    for (const candidate of youtubeThumbnailCandidates(videoId)) {
      const probe = await downloadImage(candidate, options.timeoutMs);
      if (!probe.ok) {
        lastError = probe.error;
        continue;
      }
      found = { url: candidate, buffer: probe.buffer };
      break;
    }

    if (found === null) {
      return {
        status: "failed",
        slug,
        relPath,
        detail: `no YouTube thumbnail for ${videoId} (${lastError})`,
      };
    }

    source = { url: found.url, origin: "youtube" };
    downloaded = found.buffer;
  } else {
    const page = await resolvePageImage(linkUrl, options.timeoutMs);
    if ("error" in page) {
      return { status: "failed", slug, relPath, detail: page.error };
    }

    const bytes = await downloadImage(page.url, options.timeoutMs);
    if (!bytes.ok) {
      return { status: "failed", slug, relPath, detail: bytes.error };
    }

    source = page;
    downloaded = bytes.buffer;
  }

  const converted = await convertToCardImage(downloaded);
  if ("error" in converted) {
    return { status: "failed", slug, relPath, detail: converted.error };
  }

  const imageRef = `imgs/${slug}-preview.webp`;

  // Belt-and-braces: confirm the reference the note will carry is one the
  // published asset pipeline actually accepts before writing anything.
  const asset = resolveVaultAssetRef(relPath, slug, imageRef);
  if (asset === null) {
    return {
      status: "failed",
      slug,
      relPath,
      detail: `refusing to write an asset reference the vault pipeline rejects: ${imageRef}`,
    };
  }

  const sizeLabel = formatBytes(converted.buffer.byteLength);
  const detail =
    `${source.origin} ${source.url} → ${imageRef} ` +
    `(${converted.sourceWidth}x${converted.sourceHeight} → ` +
    `${CARD_IMAGE_WIDTH}x${CARD_IMAGE_HEIGHT}, ${sizeLabel})`;

  if (options.dryRun) {
    return { status: "resolved", slug, relPath, detail: `[dry-run] ${detail}` };
  }

  const imageAbsPath = path.join(vaultRoot, asset.sourceRelPath);
  try {
    await mkdir(path.dirname(imageAbsPath), { recursive: true });
    await writeFile(imageAbsPath, converted.buffer);
  } catch (err) {
    return { status: "failed", slug, relPath, detail: `image write failed: ${errorMessage(err)}` };
  }

  const updatedYaml = withPreviewImage(block.yaml, imageRef);
  const updatedContent = `${content.slice(0, block.start)}${updatedYaml}${content.slice(block.end)}`;
  try {
    await writeFile(absPath, updatedContent, "utf-8");
  } catch (err) {
    return {
      status: "failed",
      slug,
      relPath,
      detail: `frontmatter write failed: ${errorMessage(err)}`,
    };
  }

  return { status: "resolved", slug, relPath, detail };
}

// ── Entry point ───────────────────────────────────────────────────────────────

const STATUS_TAG: Record<OutcomeStatus, string> = {
  resolved: "resolved",
  skipped: "skipped ",
  failed: "failed  ",
};

export async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv.slice(2));
  if (!parsed.ok) {
    process.stderr.write(`share-previews: ${parsed.message}\n`);
    process.stderr.write("usage: npm run share-previews -- [--force] [--dry-run] <vault-path>\n");
    return 1;
  }

  const options = parsed.options;
  const vaultRoot = path.resolve(options.vaultPath);

  let relPaths: string[];
  try {
    relPaths = await walkVault(vaultRoot);
  } catch (err) {
    process.stderr.write(
      `share-previews: cannot walk vault at ${vaultRoot}: ${errorMessage(err)}\n`
    );
    return 1;
  }

  process.stderr.write(
    `share-previews: ${relPaths.length} notes walked in ${vaultRoot}` +
      `${options.dryRun ? " (dry run)" : ""}\n`
  );

  const outcomes: NoteOutcome[] = [];
  for (const relPath of relPaths.slice().sort()) {
    const outcome = await processNote(vaultRoot, relPath, options);
    if (outcome === null) continue;
    outcomes.push(outcome);
    process.stderr.write(`  ${STATUS_TAG[outcome.status]}  ${outcome.slug} — ${outcome.detail}\n`);
  }

  const counts = outcomes.reduce<Record<OutcomeStatus, number>>(
    (acc, outcome) => ({ ...acc, [outcome.status]: acc[outcome.status] + 1 }),
    { resolved: 0, skipped: 0, failed: 0 }
  );

  process.stderr.write(
    `share-previews: ${counts.resolved} resolved, ${counts.skipped} skipped, ` +
      `${counts.failed} failed\n`
  );

  // Per-note failures leave the card on its monogram fallback — that is a
  // degraded result, not a broken build, so the run still exits 0.
  return 0;
}

// Run when invoked directly (not imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv).then(
    (code) => {
      process.exitCode = code;
    },
    (err: unknown) => {
      process.stderr.write(`share-previews: unexpected failure: ${errorMessage(err)}\n`);
      process.exitCode = 1;
    }
  );
}
