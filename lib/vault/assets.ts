/**
 * assets.ts — note-local vault asset resolution.
 *
 * Public notes may reference article-owned images with relative markdown paths
 * such as `![alt](imgs/diagram.png)`. The vault remains the source of truth,
 * while the portfolio serves a generated public copy at:
 *
 *   /vault-assets/<note-slug>/<path-under-imgs>
 *
 * Per P25: no I/O at module init. Copying happens only from adapter calls.
 */

import { copyFile, lstat, mkdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { VaultParseError } from "./errors";
import type { PreviewConfigPartial } from "./schema";

const ALLOWED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

/** 10MB cap per generated/public vault image. */
export const MAX_VAULT_ASSET_BYTES = 10 * 1024 * 1024;

export interface ResolvedVaultAsset {
  /** Vault-relative source path, e.g. notes/writing/imgs/foo.png. */
  sourceRelPath: string;
  /** Path under public/vault-assets/<slug>/, e.g. diagrams/foo.png. */
  publicRelPath: string;
  /** Browser path, e.g. /vault-assets/my-note/diagrams/foo.png. */
  publicPath: string;
}

type EnsureAsset = (asset: ResolvedVaultAsset) => Promise<void>;

function isExternalOrAbsoluteRef(src: string): boolean {
  return src.startsWith("/") || src.startsWith("#") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(src);
}

function splitMarkdownDestination(raw: string): { src: string; suffix: string } {
  const trimmed = raw.trim();
  const wrapped = trimmed.match(/^<([^>]+)>(.*)$/);
  if (wrapped) {
    return { src: wrapped[1] ?? "", suffix: wrapped[2] ?? "" };
  }

  const titleStart = trimmed.search(/\s+["'(]/);
  if (titleStart === -1) {
    return { src: trimmed, suffix: "" };
  }
  return {
    src: trimmed.slice(0, titleStart),
    suffix: trimmed.slice(titleStart),
  };
}

function hasAllowedImageExtension(relPath: string): boolean {
  return ALLOWED_IMAGE_EXTENSIONS.has(path.posix.extname(relPath).toLowerCase());
}

export function isVaultAssetFile(relPath: string): boolean {
  const normalized = path.posix.normalize(relPath);
  return normalized.includes("/imgs/") && hasAllowedImageExtension(normalized);
}

export function resolveVaultAssetRef(
  noteRelPath: string,
  slug: string,
  src: string
): ResolvedVaultAsset | null {
  const cleanSrc = src.trim();
  if (!cleanSrc || isExternalOrAbsoluteRef(cleanSrc)) {
    return null;
  }

  const noteDir = path.posix.dirname(noteRelPath);
  const sourceRelPath = path.posix.normalize(path.posix.join(noteDir, cleanSrc));

  if (
    sourceRelPath.startsWith("../") ||
    sourceRelPath === ".." ||
    path.posix.isAbsolute(sourceRelPath)
  ) {
    return null;
  }

  const imgsToken = "/imgs/";
  const imgsIndex = sourceRelPath.indexOf(imgsToken);
  if (imgsIndex === -1 || !hasAllowedImageExtension(sourceRelPath)) {
    return null;
  }

  const publicRelPath = sourceRelPath.slice(imgsIndex + imgsToken.length);
  if (
    !publicRelPath ||
    publicRelPath.startsWith("../") ||
    publicRelPath.includes("/../") ||
    path.posix.isAbsolute(publicRelPath)
  ) {
    return null;
  }

  const encodedParts = publicRelPath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part));

  return {
    sourceRelPath,
    publicRelPath,
    publicPath: `/vault-assets/${encodeURIComponent(slug)}/${encodedParts.join("/")}`,
  };
}

export async function rewriteMarkdownVaultImageRefs(
  markdown: string,
  noteRelPath: string,
  slug: string,
  ensureAsset: EnsureAsset
): Promise<string> {
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let rewritten = "";
  let lastIndex = 0;

  for (const match of markdown.matchAll(imagePattern)) {
    const [full, alt, rawDest] = match;
    const index = match.index ?? 0;
    rewritten += markdown.slice(lastIndex, index);

    const { src, suffix } = splitMarkdownDestination(rawDest ?? "");
    const asset = resolveVaultAssetRef(noteRelPath, slug, src);
    if (asset) {
      await ensureAsset(asset);
      rewritten += `![${alt ?? ""}](${asset.publicPath}${suffix})`;
    } else {
      rewritten += full;
    }

    lastIndex = index + full.length;
  }

  rewritten += markdown.slice(lastIndex);
  return rewritten;
}

export async function rewritePreviewVaultImage(
  preview: PreviewConfigPartial | undefined,
  noteRelPath: string,
  slug: string,
  ensureAsset: EnsureAsset
): Promise<PreviewConfigPartial | undefined> {
  if (!preview?.image) {
    return preview;
  }

  const asset = resolveVaultAssetRef(noteRelPath, slug, preview.image);
  if (!asset) {
    return preview;
  }

  await ensureAsset(asset);
  return {
    ...preview,
    image: asset.publicPath,
  };
}

function vaultAssetOutputRoot(): string {
  return path.join(process.cwd(), "public", "vault-assets");
}

function vaultAssetDestination(asset: ResolvedVaultAsset): string {
  return path.join(vaultAssetOutputRoot(), asset.publicPath.replace(/^\/vault-assets\//, ""));
}

export async function copyLocalVaultAsset(
  vaultRoot: string,
  noteRelPath: string,
  asset: ResolvedVaultAsset
): Promise<void> {
  const rootReal = await realpath(vaultRoot);
  const sourceAbs = path.join(rootReal, asset.sourceRelPath);
  const sourceStat = await lstat(sourceAbs).catch(() => null);

  if (!sourceStat) {
    throw new VaultParseError(noteRelPath, "asset", `missing image asset "${asset.sourceRelPath}"`);
  }
  if (sourceStat.isSymbolicLink() || !sourceStat.isFile()) {
    throw new VaultParseError(
      noteRelPath,
      "asset",
      `image asset must be a regular file: "${asset.sourceRelPath}"`
    );
  }
  if (sourceStat.size > MAX_VAULT_ASSET_BYTES) {
    throw new VaultParseError(
      noteRelPath,
      "asset",
      `image asset too large: "${asset.sourceRelPath}" (${sourceStat.size} bytes)`
    );
  }

  const sourceReal = await realpath(sourceAbs);
  const normalizedRoot = rootReal.endsWith(path.sep) ? rootReal : rootReal + path.sep;
  if (sourceReal !== rootReal && !sourceReal.startsWith(normalizedRoot)) {
    throw new VaultParseError(
      noteRelPath,
      "asset",
      `image asset escapes vault root: "${asset.sourceRelPath}"`
    );
  }

  const destAbs = vaultAssetDestination(asset);
  await mkdir(path.dirname(destAbs), { recursive: true });
  await copyFile(sourceAbs, destAbs);
}

export async function writeBufferedVaultAsset(
  noteRelPath: string,
  asset: ResolvedVaultAsset,
  buffer: Buffer | undefined
): Promise<void> {
  if (!buffer) {
    throw new VaultParseError(noteRelPath, "asset", `missing image asset "${asset.sourceRelPath}"`);
  }
  if (buffer.byteLength > MAX_VAULT_ASSET_BYTES) {
    throw new VaultParseError(
      noteRelPath,
      "asset",
      `image asset too large: "${asset.sourceRelPath}" (${buffer.byteLength} bytes)`
    );
  }

  const destAbs = vaultAssetDestination(asset);
  await mkdir(path.dirname(destAbs), { recursive: true });
  await writeFile(destAbs, buffer);
}
