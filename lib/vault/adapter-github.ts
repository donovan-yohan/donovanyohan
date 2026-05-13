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
 *   - Only process *.md files
 *   - 1MB size cap per entry
 *   - Token never appears in thrown error messages
 *
 * Per P25: No I/O, no env access at module init.
 */

import * as tar from "tar";
import { Readable } from "node:stream";
import { resolveVisibility } from "./fail-closed";
import { VaultFrontmatterSchema } from "./schema";
import type { VaultNote, VaultAdapter } from "./schema";
import { deriveSlug } from "./slug";
import { applyPreviewDefaults } from "./preview-defaults";
import { remarkStripWikilinks, stripWikilinks } from "./wikilinks";
import { VaultParseError } from "./errors";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
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
  // Reject unsafe entry types
  if (UNSAFE_ENTRY_TYPES.has(entryType)) return false;
  // Reject absolute paths
  if (rawPath.startsWith("/")) return false;
  // Reject traversal
  if (rawPath.includes("..")) return false;
  return true;
}

/**
 * Extracts the first non-empty paragraph of plain text from markdown.
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

  // P18: strip [[wikilinks]] from the fallback excerpt too, so raw Obsidian
  // syntax never leaks into card previews.
  const joined = paragraphLines.join(" ");
  return stripWikilinks(joined)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

/**
 * Process a single tarball entry's content through the vault pipeline.
 * Returns a VaultNote if public, null otherwise.
 * Throws VaultParseError if the note is public-but-schema-invalid.
 */
async function processTarEntry(
  relPath: string,
  content: string,
): Promise<VaultNote | null> {
  let rawFrontmatter: unknown;
  let bodyMarkdown: string;

  try {
    const parsed = matter(content);
    rawFrontmatter = parsed.data;
    bodyMarkdown = parsed.content;
  } catch {
    // Malformed YAML → private
    return null;
  }

  const visibility = resolveVisibility(rawFrontmatter);
  if (visibility !== "public") {
    return null;
  }

  const parseResult = VaultFrontmatterSchema.safeParse(rawFrontmatter);
  if (!parseResult.success) {
    throw new VaultParseError(
      relPath,
      "schema",
      parseResult.error.issues[0]?.message,
    );
  }

  const frontmatter = parseResult.data as import("./schema").VaultFrontmatter;
  const filename = path.basename(relPath);
  const slug = deriveSlug(filename, frontmatter.slug);

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStripWikilinks)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify);

  const bodyHtml = String(await processor.process(bodyMarkdown));
  const firstParagraph = extractFirstParagraph(bodyMarkdown);

  const preview = applyPreviewDefaults(frontmatter.preview, {
    title: frontmatter.title,
    firstParagraph,
  });

  return {
    slug,
    path: relPath,
    frontmatter,
    body: bodyHtml,
    bodyMarkdown,
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

  constructor(params: {
    owner: string;
    repo: string;
    ref?: string;
    token: string;
  }) {
    this.owner = params.owner;
    this.repo = params.repo;
    this.ref = params.ref ?? "HEAD";
    this.token = params.token;
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
      // Redact token from error message
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `GitHub tarball fetch failed: ${msg.replaceAll(token, "[REDACTED]")}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `GitHub tarball fetch returned HTTP ${response.status} for ${this.owner}/${this.repo}@${this.ref}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse entries in-memory — collect file contents before async processing
    const entries: Array<{ relPath: string; content: string }> = [];

    // Detect gzip from magic bytes (0x1f 0x8b)
    const isGzip =
      buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;

    await new Promise<void>((resolve, reject) => {
      const readable = Readable.from(buffer);
      // Pass explicit compression flags to avoid brotli/zstd sniff ambiguity
      // that can block the parser if buffers are small.
      // Note: tar v7 uses `onReadEntry`, not `onentry`.
      const parser = new tar.Parser({
        strict: true,
        gzip: isGzip,
        brotli: false,
        onReadEntry: (entry) => {
          const rawPath = entry.path;
          const entryType = entry.type ?? "File";

          // Security checks on raw path
          if (!isEntryPathSafe(rawPath, entryType)) {
            entry.resume(); // drain the entry stream
            return;
          }

          const relPath = stripTarballPrefix(rawPath);

          // Must be a .md file
          if (!relPath.endsWith(".md")) {
            entry.resume();
            return;
          }

          // Apply ignore-list
          if (isIgnoredPath(relPath)) {
            entry.resume();
            return;
          }

          // Collect file content with size cap
          const chunks: Buffer[] = [];
          let totalSize = 0;

          entry.on("data", (chunk: Buffer) => {
            totalSize += chunk.length;
            if (totalSize > MAX_FILE_BYTES) {
              entry.destroy(
                new Error(
                  `File too large: ${relPath} (>${MAX_FILE_BYTES} bytes)`,
                ),
              );
              return;
            }
            chunks.push(chunk);
          });

          entry.on("end", () => {
            const content = Buffer.concat(chunks).toString("utf8");
            entries.push({ relPath, content });
          });

          entry.on("error", () => {
            // Skip entries that error (e.g. size-capped)
          });
        },
      });

      parser.on("finish", resolve);
      parser.on("end", resolve);
      parser.on("error", reject);

      // tar.Parser extends EventEmitter (not stream.Writable), so use pipe
      // via the EventEmitter-compatible write() interface
      readable.on("data", (chunk: Buffer) => {
        parser.write(chunk);
      });
      readable.on("end", () => {
        parser.end();
      });
      readable.on("error", reject);
    });

    // Process entries asynchronously (after tar parsing is complete)
    const publicNotes: VaultNote[] = [];

    for (const { relPath, content } of entries) {
      let note: VaultNote | null;
      try {
        note = await processTarEntry(relPath, content);
      } catch (err) {
        if (err instanceof VaultParseError) {
          throw err;
        }
        console.error(`[vault/github] Error processing ${relPath}:`, err);
        continue;
      }

      if (note !== null) {
        publicNotes.push(note);
      }
    }

    return publicNotes;
  }
}
