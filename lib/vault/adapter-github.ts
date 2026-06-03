/**
 * adapter-github.ts — read-only GitHub Tarball adapter (P28).
 *
 * Single fetch to:
 *   GET https://api.github.com/repos/{owner}/{repo}/tarball/{ref}
 * with Authorization: Bearer ${token}.
 *
 * In-memory tar parse via the `tar` npm package (node-tar).
 * No caching in Slice 0 — full re-fetch per call.
 *
 * Security properties (P17 applied to tarball entries):
 *   - Reject absolute paths (starts with /)
 *   - Reject path traversal (contains ../)
 *   - Reject hardlinks (type === 'Link')
 *   - Reject device entries (BlockDevice, CharacterDevice, etc.)
 *   - Reject symlinks (SymbolicLink)
 *   - Apply same ignore-list as walk.ts (.obsidian, .trash, .git, etc.)
 *   - Only process *.md files under notes/
 *   - 1MB size cap per entry
 *   - Token never appears in thrown error messages
 *
 * Render flow mirrors the local adapter (P22 + P31): a two-pass walk where
 * pass 1 resolves visibility + slug for every tarball entry, and pass 2
 * renders public bodies via `renderMarkdown()` with the full slug map so
 * wikilinks resolve to anchors / private targets throw / unknown targets
 * fall back to plain text.
 *
 * Per P25: No I/O, no env access at module init.
 */

import * as tar from "tar";
import { Readable } from "node:stream";
import { resolveVisibility } from "./fail-closed";
import { VaultFrontmatterSchema } from "./schema";
import type { VaultNote, VaultAdapter, VaultFrontmatter } from "./schema";
import { deriveSlug } from "./slug";
import { applyPreviewDefaults } from "./preview-defaults";
import { stripWikilinks } from "./wikilinks";
import { renderMarkdown } from "./render";
import { VaultParseError } from "./errors";
import {
  isVaultAssetFile,
  rewriteMarkdownVaultImageRefs,
  rewritePreviewVaultImage,
  writeBufferedVaultAsset,
  MAX_VAULT_ASSET_BYTES,
} from "./assets";
import matter from "gray-matter";
import path from "node:path";

/** Glob ignore prefixes for tarball entries (mirrors walk.ts IGNORE_PATTERNS). */
const IGNORE_PREFIXES = [
  ".obsidian/",
  ".trash/",
  ".git/",
  ".github/",
  "node_modules/",
  "templates/",
];

const CONTENT_PREFIX = "notes/";

/** 1MB size cap on individual vault files. */
const MAX_FILE_BYTES = 1024 * 1024;

/** Tarball entry types that are not regular files. */
const UNSAFE_ENTRY_TYPES = new Set([
  "Link",
  "SymbolicLink",
  "BlockDevice",
  "CharacterDevice",
  "FIFO",
]);

/**
 * Pass-1 output. Same shape as the local adapter's `ResolvedFile` — public
 * resolutions carry the parsed frontmatter + raw body for pass 2, private
 * resolutions carry only the slug so they feed the leak gate.
 */
type ResolvedFile =
  | {
      visibility: "public" | "preview";
      relPath: string;
      slug: string;
      frontmatter: VaultFrontmatter;
      bodyMarkdown: string;
    }
  | { visibility: "private"; relPath: string; slug: string | null };

/**
 * Strips the leading tarball prefix (e.g. "owner-repo-sha123/") from an
 * entry path, leaving only the vault-relative portion.
 */
function stripTarballPrefix(entryPath: string): string {
  const slashIdx = entryPath.indexOf("/");
  if (slashIdx === -1) return entryPath;
  return entryPath.slice(slashIdx + 1);
}

/**
 * Returns true if a vault-relative path should be ignored.
 */
function isIgnoredPath(relPath: string): boolean {
  for (const prefix of IGNORE_PREFIXES) {
    if (relPath.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * Returns true if the tarball entry path is safe to process.
 * Rejects: absolute paths, traversal, unsafe types.
 */
function isEntryPathSafe(rawPath: string, entryType: string): boolean {
  if (UNSAFE_ENTRY_TYPES.has(entryType)) return false;
  if (rawPath.startsWith("/")) return false;
  if (rawPath.includes("..")) return false;
  return true;
}

/**
 * Extracts the first non-empty paragraph of plain text from markdown.
 * Wikilinks are stripped so the fallback excerpt never leaks raw `[[...]]`.
 */
function extractFirstParagraph(markdown: string): string {
  const lines = markdown.split("\n");
  const paragraphLines: string[] = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (inParagraph) break;
      continue;
    }
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("```") ||
      trimmed.startsWith("---") ||
      trimmed.startsWith("===")
    ) {
      if (inParagraph) break;
      continue;
    }
    inParagraph = true;
    paragraphLines.push(trimmed);
  }

  const joined = paragraphLines.join(" ");
  return stripWikilinks(joined)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

/**
 * Pass 1 (tarball-entry variant): parse frontmatter, resolve visibility, and
 * derive the slug. Returns a private resolution for malformed YAML so the
 * slug still feeds the leak gate. Public-but-schema-invalid throws
 * `VaultParseError`.
 */
function resolveTarEntry(
  relPath: string,
  content: string,
  includePreview: boolean,
): ResolvedFile {
  const filename = path.basename(relPath);

  let rawFrontmatter: unknown;
  let bodyMarkdown: string;
  try {
    const parsed = matter(content);
    rawFrontmatter = parsed.data;
    bodyMarkdown = parsed.content;
  } catch {
    return {
      visibility: "private",
      relPath,
      slug: deriveSlug(filename) || null,
    };
  }

  const visibility = resolveVisibility(rawFrontmatter, { includePreview });

  if (visibility === "private") {
    const fmSlug =
      typeof rawFrontmatter === "object" &&
      rawFrontmatter !== null &&
      typeof (rawFrontmatter as Record<string, unknown>)["slug"] === "string"
        ? ((rawFrontmatter as Record<string, unknown>)["slug"] as string)
        : undefined;
    return {
      visibility: "private",
      relPath,
      slug: deriveSlug(filename, fmSlug) || null,
    };
  }

  const parseResult = VaultFrontmatterSchema.safeParse(rawFrontmatter);
  if (!parseResult.success) {
    throw new VaultParseError(relPath, "schema", parseResult.error.issues[0]?.message);
  }

  const frontmatter = parseResult.data as VaultFrontmatter;
  const slug = deriveSlug(filename, frontmatter.slug);

  return {
    visibility,
    relPath,
    slug,
    frontmatter,
    bodyMarkdown,
  };
}

/**
 * Pass 2 (tarball variant): render the public body with slug-map context.
 */
async function renderPublicNote(
  resolved: Extract<ResolvedFile, { visibility: "public" | "preview" }>,
  publicSlugs: ReadonlySet<string>,
  privateSlugs: ReadonlySet<string>,
  assets: ReadonlyMap<string, Buffer>
): Promise<VaultNote> {
  const bodyMarkdownForRender = await rewriteMarkdownVaultImageRefs(
    resolved.bodyMarkdown,
    resolved.relPath,
    resolved.slug,
    (asset) => writeBufferedVaultAsset(resolved.relPath, asset, assets.get(asset.sourceRelPath))
  );

  const body = await renderMarkdown(bodyMarkdownForRender, {
    publicSlugs,
    privateSlugs,
    sourcePath: resolved.relPath,
  });

  const firstParagraph = extractFirstParagraph(resolved.bodyMarkdown);
  const previewInput = await rewritePreviewVaultImage(
    resolved.frontmatter.preview,
    resolved.relPath,
    resolved.slug,
    (asset) => writeBufferedVaultAsset(resolved.relPath, asset, assets.get(asset.sourceRelPath))
  );
  const preview = applyPreviewDefaults(previewInput, {
    title: resolved.frontmatter.title,
    firstParagraph,
  });

  return {
    slug: resolved.slug,
    path: resolved.relPath,
    frontmatter: resolved.frontmatter,
    body,
    bodyMarkdown: resolved.bodyMarkdown,
    preview,
  };
}

/**
 * GitHubVaultAdapter — fetches and parses a vault from a GitHub tarball.
 *
 * Parses the tarball entirely in memory; never writes to disk.
 * Token is never exposed in error messages (redacted).
 */
export class GitHubVaultAdapter implements VaultAdapter {
  private readonly owner: string;
  private readonly repo: string;
  private readonly ref: string;
  private readonly token: string;
  private readonly includePreview: boolean;

  constructor(params: {
    owner: string;
    repo: string;
    ref?: string;
    token: string;
    includePreview?: boolean;
  }) {
    this.owner = params.owner;
    this.repo = params.repo;
    this.ref = params.ref ?? "HEAD";
    this.token = params.token;
    this.includePreview = params.includePreview === true;
  }

  async getPublicNotes(): Promise<VaultNote[]> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/tarball/${this.ref}`;
    const token = this.token;

    // Fetch the tarball
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "donovanyohan-portfolio",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        redirect: "follow",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`GitHub tarball fetch failed: ${msg.replaceAll(token, "[REDACTED]")}`);
    }

    if (!response.ok) {
      throw new Error(
        `GitHub tarball fetch returned HTTP ${response.status} for ${this.owner}/${this.repo}@${this.ref}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse entries in-memory — collect file contents before async processing
    const entries: Array<{ relPath: string; content: string }> = [];
    const assets = new Map<string, Buffer>();

    // Detect gzip from magic bytes (0x1f 0x8b)
    const isGzip = buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;

    await new Promise<void>((resolve, reject) => {
      const readable = Readable.from(buffer);
      const parser = new tar.Parser({
        strict: true,
        gzip: isGzip,
        brotli: false,
        onReadEntry: (entry) => {
          const rawPath = entry.path;
          const entryType = entry.type ?? "File";

          if (!isEntryPathSafe(rawPath, entryType)) {
            entry.resume();
            return;
          }

          const relPath = stripTarballPrefix(rawPath);

          const isMarkdown = relPath.startsWith(CONTENT_PREFIX) && relPath.endsWith(".md");
          const isAsset = isVaultAssetFile(relPath);

          if (!isMarkdown && !isAsset) {
            entry.resume();
            return;
          }

          if (isIgnoredPath(relPath)) {
            entry.resume();
            return;
          }

          const chunks: Buffer[] = [];
          let totalSize = 0;

          entry.on("data", (chunk: Buffer) => {
            totalSize += chunk.length;
            if (totalSize > (isAsset ? MAX_VAULT_ASSET_BYTES : MAX_FILE_BYTES)) {
              entry.destroy(
                new Error(
                  `File too large: ${relPath} (>${isAsset ? MAX_VAULT_ASSET_BYTES : MAX_FILE_BYTES} bytes)`
                )
              );
              return;
            }
            chunks.push(chunk);
          });

          entry.on("end", () => {
            const buffer = Buffer.concat(chunks);
            if (isAsset) {
              assets.set(relPath, buffer);
            } else {
              const content = buffer.toString("utf8");
              entries.push({ relPath, content });
            }
          });

          entry.on("error", () => {
            // Skip entries that error (e.g. size-capped)
          });
        },
      });

      parser.on("finish", resolve);
      parser.on("end", resolve);
      parser.on("error", reject);

      readable.on("data", (chunk: Buffer) => {
        parser.write(chunk);
      });
      readable.on("end", () => {
        parser.end();
      });
      readable.on("error", reject);
    });

    // Pass 1: resolve every entry (visibility + slug; body not yet rendered)
    const resolved: ResolvedFile[] = [];
    for (const { relPath, content } of entries) {
      try {
        resolved.push(resolveTarEntry(relPath, content, this.includePreview));
      } catch (err) {
        if (err instanceof VaultParseError) throw err;
        console.error(`[vault/github] Error resolving ${relPath}:`, err);
      }
    }

    // Build slug sets for the leak gate
    const publicSlugs = new Set<string>();
    const privateSlugs = new Set<string>();
    for (const r of resolved) {
      if (r.slug === null) continue;
      if (r.visibility !== "private") {
        publicSlugs.add(r.slug);
      } else {
        privateSlugs.add(r.slug);
      }
    }

    // Pass 2: render public bodies with slug-map context
    const publicNotes = await Promise.all(
      resolved
        .filter(
          (r): r is Extract<ResolvedFile, { visibility: "public" | "preview" }> =>
            r.visibility !== "private",
        )
        .map((r) => renderPublicNote(r, publicSlugs, privateSlugs, assets))
    );

    return publicNotes;
  }
}
