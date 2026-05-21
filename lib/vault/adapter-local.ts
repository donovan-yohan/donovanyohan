/**
 * adapter-local.ts — local filesystem vault adapter.
 *
 * Two-pass walk per P22 + P31:
 *
 *   Pass 1 — `resolveFile()`: for every candidate .md path, parse frontmatter,
 *     run `resolveVisibility()`, and derive the slug. Returns either a
 *     `public` resolution (with the parsed frontmatter + raw markdown body
 *     ready to render) or a `private` resolution (slug only — body is never
 *     inspected beyond frontmatter). The walk-then-stop-if-private order is
 *     preserved: private notes never get their body parsed or rendered, the
 *     resolver only reads the YAML header.
 *
 *   Pass 2 — `renderPublicNote()`: for each public resolution, render the
 *     body via `renderMarkdown()` with the full slug map built from pass 1
 *     so wikilinks resolve to anchors / private targets fail loudly / unknown
 *     targets fall back to plain text. Preview defaults applied here.
 *
 * Why two passes: wikilink resolution needs the complete public/private slug
 * set up front. Building the slug set during a single pass would force a
 * source-order dependency on which notes can link to which.
 *
 * Per-file errors are isolated. One bad file does not reject the whole walk.
 * Public-but-schema-invalid still throws `VaultParseError` from pass 1, and
 * a wikilink-leak in pass 2 throws `WikilinkLeakError` — both are intentional
 * build-fail gates.
 *
 * Per P25: No I/O, no env access at module init.
 */

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { walkVault } from "./walk";
import { resolveVisibility } from "./fail-closed";
import { VaultFrontmatterSchema } from "./schema";
import type {
  VaultNote,
  VaultAdapter,
  VaultFrontmatter,
} from "./schema";
import { deriveSlug } from "./slug";
import { applyPreviewDefaults } from "./preview-defaults";
import { stripWikilinks } from "./wikilinks";
import { renderMarkdown } from "./render";
import { VaultParseError } from "./errors";

/** 1MB size cap on individual vault files. */
const MAX_FILE_BYTES = 1024 * 1024;

/**
 * Pass-1 output. Public resolutions carry everything the renderer needs in
 * pass 2; private resolutions carry only the slug (or `null` if it could not
 * be derived without trusting metadata we never parsed).
 */
type ResolvedFile =
  | {
      visibility: "public";
      relPath: string;
      slug: string;
      frontmatter: VaultFrontmatter;
      bodyMarkdown: string;
    }
  | { visibility: "private"; relPath: string; slug: string | null };

/**
 * Pass 1: read + frontmatter-parse + visibility-resolve + slug-derive.
 *
 * Returns `null` only when the file could not be read (size cap, IO error,
 * etc.). Private and malformed-YAML cases return a `private` resolution so
 * the caller can still collect a slug into the leak-gate set.
 *
 * Throws `VaultParseError` for public-but-schema-invalid (P22).
 */
async function resolveFile(
  vaultRoot: string,
  relPath: string,
): Promise<ResolvedFile | null> {
  const absPath = path.join(vaultRoot, relPath);
  const filename = path.basename(relPath);

  // Read with size cap
  let content: string;
  try {
    const s = await stat(absPath);
    if (s.size > MAX_FILE_BYTES) {
      console.warn(
        `[vault] Skipping ${relPath}: ${s.size} bytes exceeds ${MAX_FILE_BYTES}`,
      );
      return null;
    }
    content = await readFile(absPath, "utf8");
  } catch (err) {
    console.error(
      `[vault] Read error for ${relPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }

  // Parse frontmatter
  let rawFrontmatter: unknown;
  let bodyMarkdown: string;
  try {
    const parsed = matter(content);
    rawFrontmatter = parsed.data;
    bodyMarkdown = parsed.content;
  } catch {
    // Malformed YAML → private; slug derived from filename only since we
    // cannot trust any frontmatter slug override from a broken parse.
    return {
      visibility: "private",
      relPath,
      slug: deriveSlug(filename) || null,
    };
  }

  const visibility = resolveVisibility(rawFrontmatter);

  if (visibility !== "public") {
    // Private: slug derivation uses the filename and (if the YAML parsed)
    // any explicit `slug:` override so the leak gate catches both shapes.
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

  // Public: full schema parse so we know `title`/`date` exist before render.
  const parseResult = VaultFrontmatterSchema.safeParse(rawFrontmatter);
  if (!parseResult.success) {
    throw new VaultParseError(
      relPath,
      "schema",
      parseResult.error.issues[0]?.message,
    );
  }

  const frontmatter = parseResult.data as VaultFrontmatter;
  const slug = deriveSlug(filename, frontmatter.slug);

  return {
    visibility: "public",
    relPath,
    slug,
    frontmatter,
    bodyMarkdown,
  };
}

/**
 * Extracts the first non-empty paragraph of plain text from markdown.
 * Strips inline markdown + wikilink syntax so the fallback excerpt is
 * readable. Per P18 the raw `[[...]]` form never reaches a card preview.
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
 * Pass 2: render a public resolution into a final `VaultNote`.
 *
 * `renderMarkdown` receives the full slug-map context built from pass 1, so
 * wikilinks resolve into anchors (public) / throw (private) / strip (unknown).
 */
async function renderPublicNote(
  resolved: Extract<ResolvedFile, { visibility: "public" }>,
  publicSlugs: ReadonlySet<string>,
  privateSlugs: ReadonlySet<string>,
): Promise<VaultNote> {
  const body = await renderMarkdown(resolved.bodyMarkdown, {
    publicSlugs,
    privateSlugs,
    sourcePath: resolved.relPath,
  });

  const firstParagraph = extractFirstParagraph(resolved.bodyMarkdown);
  const preview = applyPreviewDefaults(resolved.frontmatter.preview, {
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
 * LocalVaultAdapter — reads notes from a local filesystem vault.
 */
export class LocalVaultAdapter implements VaultAdapter {
  constructor(private readonly vaultRoot: string) {}

  async getPublicNotes(): Promise<VaultNote[]> {
    const paths = await walkVault(this.vaultRoot);

    // Pass 1: resolve every file
    const resolvedResults = await Promise.all(
      paths.map(async (relPath) => {
        try {
          return await resolveFile(this.vaultRoot, relPath);
        } catch (err) {
          if (err instanceof VaultParseError) throw err;
          console.error(
            `[vault] Unexpected error resolving ${relPath}:`,
            err,
          );
          return null;
        }
      }),
    );
    const resolved = resolvedResults.filter(
      (r): r is ResolvedFile => r !== null,
    );

    // Build slug sets for the leak gate
    const publicSlugs = new Set<string>();
    const privateSlugs = new Set<string>();
    for (const r of resolved) {
      if (r.slug === null) continue;
      if (r.visibility === "public") {
        publicSlugs.add(r.slug);
      } else {
        privateSlugs.add(r.slug);
      }
    }

    // Pass 2: render public bodies with slug-map context
    const publicNotes = await Promise.all(
      resolved
        .filter(
          (r): r is Extract<ResolvedFile, { visibility: "public" }> =>
            r.visibility === "public",
        )
        .map((r) => renderPublicNote(r, publicSlugs, privateSlugs)),
    );

    return publicNotes;
  }
}
