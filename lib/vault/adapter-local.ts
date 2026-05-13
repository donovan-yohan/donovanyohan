/**
 * adapter-local.ts — local filesystem vault adapter.
 *
 * Implements the walk-then-stop-if-private order per P22:
 *   1. Walk candidate .md files (P17 allowlist via walkVault)
 *   2. Read file with 1MB size cap
 *   3. Parse frontmatter via gray-matter (per-file try/catch)
 *   4. resolveVisibility() from raw frontmatter
 *   5. STOP if private — return { status: 'private', path }
 *   6. For public: full schema validate, derive slug, build VaultNote
 *   7. Public-but-malformed-schema → throw VaultParseError
 *   8. Private-but-malformed → silently skip (returns error result)
 *
 * Per-file errors are isolated; one bad file does NOT reject the whole adapter.
 *
 * NOTE: Body HTML rendering (remark → rehype-sanitize → rehype-stringify)
 * lives here for Slice 0. Slice 1 can factor it out to render.ts.
 *
 * Per P25: No I/O, no env access at module init.
 */

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { walkVault } from "./walk";
import { resolveVisibility } from "./fail-closed";
import { VaultFrontmatterSchema } from "./schema";
import type { VaultNote, VaultAdapter, AdapterFileResult } from "./schema";
import { deriveSlug } from "./slug";
import { applyPreviewDefaults } from "./preview-defaults";
import { remarkStripWikilinks, stripWikilinks } from "./wikilinks";
import { VaultParseError } from "./errors";

/** 1MB size cap on individual vault files. */
const MAX_FILE_BYTES = 1024 * 1024;

/**
 * Processes a single markdown file through the vault pipeline.
 * Returns an AdapterFileResult — never throws for private/malformed cases.
 */
async function processFile(
  vaultRoot: string,
  relPath: string,
): Promise<AdapterFileResult> {
  const absPath = path.join(vaultRoot, relPath);

  // ── Step 2: Read with size cap ─────────────────────────────────────────────
  let content: string;
  try {
    const s = await stat(absPath);
    if (s.size > MAX_FILE_BYTES) {
      return {
        status: "error",
        path: relPath,
        reason: `File too large: ${s.size} bytes (max ${MAX_FILE_BYTES})`,
      };
    }
    content = await readFile(absPath, "utf8");
  } catch (err) {
    return {
      status: "error",
      path: relPath,
      reason: `Read error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // ── Step 3: Parse frontmatter (per-file try/catch) ─────────────────────────
  let rawFrontmatter: unknown;
  let bodyMarkdown: string;
  try {
    const parsed = matter(content);
    rawFrontmatter = parsed.data;
    bodyMarkdown = parsed.content;
  } catch {
    // Malformed YAML → resolve to private (fail-closed)
    return { status: "private", path: relPath };
  }

  // ── Step 4: Resolve visibility ─────────────────────────────────────────────
  const visibility = resolveVisibility(rawFrontmatter);

  // ── Step 5: Stop if private ────────────────────────────────────────────────
  if (visibility !== "public") {
    return { status: "private", path: relPath };
  }

  // ── Step 6: Full schema validation for public notes ────────────────────────
  const parseResult = VaultFrontmatterSchema.safeParse(rawFrontmatter);
  if (!parseResult.success) {
    // Step 7: Public-but-malformed → throw VaultParseError
    throw new VaultParseError(
      relPath,
      "schema",
      parseResult.error.issues[0]?.message,
    );
  }

  const frontmatter = parseResult.data as import("./schema").VaultFrontmatter;

  // ── Derive slug ────────────────────────────────────────────────────────────
  const filename = path.basename(relPath);
  const slug = deriveSlug(filename, frontmatter.slug);

  // ── Render body HTML ───────────────────────────────────────────────────────
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStripWikilinks)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify);

  const bodyHtml = String(await processor.process(bodyMarkdown));

  // ── Extract first paragraph for preview defaults ───────────────────────────
  const firstParagraph = extractFirstParagraph(bodyMarkdown);

  // ── Apply preview defaults ─────────────────────────────────────────────────
  const preview = applyPreviewDefaults(frontmatter.preview, {
    title: frontmatter.title,
    firstParagraph,
  });

  const note: VaultNote = {
    slug,
    path: relPath,
    frontmatter,
    body: bodyHtml,
    bodyMarkdown,
    preview,
  };

  return { status: "public", note };
}

/**
 * Extracts the first non-empty paragraph of plain text from markdown.
 * Strips markdown syntax naively for use as an excerpt fallback.
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
    // Skip headings, code fences, block quotes, list items for the excerpt
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

  // Strip basic inline markdown + Obsidian wikilinks so the fallback excerpt
  // is plain readable text (P18 — never leak raw [[wikilink]] syntax into a
  // card preview).
  const joined = paragraphLines.join(" ");
  return stripWikilinks(joined)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

/**
 * LocalVaultAdapter — reads notes from a local filesystem vault.
 */
export class LocalVaultAdapter implements VaultAdapter {
  constructor(private readonly vaultRoot: string) {}

  async getPublicNotes(): Promise<VaultNote[]> {
    const paths = await walkVault(this.vaultRoot);
    const publicNotes: VaultNote[] = [];

    for (const relPath of paths) {
      let result: AdapterFileResult;
      try {
        result = await processFile(this.vaultRoot, relPath);
      } catch (err) {
        // VaultParseError (public-but-malformed) — re-throw
        if (err instanceof VaultParseError) {
          throw err;
        }
        // Other unexpected errors — log and skip
        console.error(`[vault] Unexpected error processing ${relPath}:`, err);
        continue;
      }

      if (result.status === "public") {
        publicNotes.push(result.note);
      }
      // private and error results are intentionally ignored here
    }

    return publicNotes;
  }
}
