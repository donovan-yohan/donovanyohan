/**
 * wikilinks.ts — Obsidian wikilink handling for the vault renderer (P18).
 *
 * Two modes:
 *
 *   1. **Strip mode** (default — `createWikilinkPlugin()` with no opts):
 *      Replaces every wikilink with its plain-text display value. Used when
 *      the caller has no slug map (lint, excerpt extraction, no-context render).
 *      This is the conservative default and preserves the pre-Slice-2 behavior.
 *
 *   2. **Resolve mode** (`createWikilinkPlugin({ publicSlugs, privateSlugs, sourcePath })`):
 *      Looks up each wikilink's derived slug in the supplied slug sets.
 *        - public slug  → emit an mdast `link` node `/writing/{slug}`.
 *        - private slug → throw `WikilinkLeakError` (build-fail gate per P31).
 *        - unresolved   → fall back to plain text (matches strip mode).
 *
 * Forms supported (both modes):
 *
 *   [[note]]                 → "note" / link
 *   [[note|alias]]           → "alias"
 *   [[note#heading]]         → "note" / link (heading dropped — no rehype-slug yet)
 *   [[note^block-id]]        → "note" / link (block id dropped)
 *   [[note#heading|alias]]   → "alias"
 *   [[note^id|alias]]        → "alias"
 *   ![[anything]]            → "" (embeds always stripped — never leak asset names)
 *
 * Code fences and inline code are NOT processed (the remark plugin walks the
 * mdast and skips `code` and `inlineCode` nodes). `stripWikilinks()` is also
 * exported as a non-AST helper for lint/excerpt callers.
 *
 * Per P25: No I/O, no env access at module init.
 */

import type { Plugin } from "unified";
import type { Root, Text, Link, PhrasingContent } from "mdast";
import { WikilinkLeakError } from "./errors";
import { deriveSlug } from "./slug";

// ── Regex ─────────────────────────────────────────────────────────────────────

/**
 * Matches embeds: ![[...]]
 * Used by `stripWikilinks()` (raw-string helper).
 */
const EMBED_RE = /!\[\[[^\]]*\]\]/g;

/**
 * Matches regular wikilinks: [[target]] or [[target|alias]], target may
 * include a #heading or ^block-id suffix.
 *
 * Used by `stripWikilinks()` (raw-string helper, simpler grammar).
 */
const WIKILINK_STRIP_RE =
  /\[\[([^#\]^|]+)(?:[#^][^\]|]*)?(?:\|([^\]]*))?\]\]/g;

/**
 * AST-level wikilink pattern with capture groups exposed for resolve mode.
 *
 * Captures:
 *   1 embed   — `!` prefix when present (embed → stripped)
 *   2 target  — note name before `#`, `^`, or `|`
 *   3 heading — `#heading` fragment (optional, dropped on display)
 *   4 blockId — `^block-id` fragment (optional, dropped on display)
 *   5 alias   — `|alias` fragment (optional, overrides display)
 *
 * Kept as a string and instantiated per call site so concurrent renders
 * never share `lastIndex` (per the prior fix from render.ts copilot/gemini #43).
 */
const WIKILINK_AST_PATTERN = String.raw`(!?)\[\[([^\]|#^]+?)(?:#([^\]|^]+))?(?:\^([^\]|#]+))?(?:\|([^\]]+))?\]\]`;

// ── Plain-text strip (non-AST helper) ─────────────────────────────────────────

/**
 * Strips all Obsidian wikilink forms from a raw markdown string.
 * Operates on the full string — does NOT skip code fences. Use for lint
 * helpers and the excerpt extractor; use the remark plugin for body rendering.
 */
export function stripWikilinks(markdown: string): string {
  const noEmbeds = markdown.replace(EMBED_RE, "");
  return noEmbeds.replace(
    WIKILINK_STRIP_RE,
    (_match, noteName: string, alias?: string) => {
      return alias !== undefined ? alias : noteName.trim();
    },
  );
}

// ── Resolve options + slug-candidate derivation ───────────────────────────────

/**
 * Options for resolve mode. Pass nothing to use strip mode.
 *
 * `publicSlugs` / `privateSlugs` are the full slug sets for the vault at
 * render time. Slug derivation is the same function used by the adapter so
 * a target written as `[[Hello World]]` resolves to `hello-world` and lines
 * up with the filename-derived slug.
 *
 * `sourcePath` is the vault-relative path of the note being rendered. It is
 * embedded in `WikilinkLeakError` so the build error points back to the file.
 *
 * `hrefPrefix` defaults to `/writing` (the only public note route at the
 * time of writing). Override only if the route moves.
 */
export interface WikilinkResolveOpts {
  publicSlugs: ReadonlySet<string>;
  privateSlugs: ReadonlySet<string>;
  sourcePath: string;
  hrefPrefix?: string;
}

/**
 * Maps a wikilink target string (`[[target]]`) onto the canonical slug, using
 * the exact same derivation as `deriveSlug(filename)`. Appending `.md` lets
 * us reuse `deriveSlug` without a second normalization path.
 */
function targetToSlug(target: string): string {
  return deriveSlug(target + ".md");
}

// ── Remark plugin (handles both modes) ────────────────────────────────────────

type AnyParent = Root | { type: string; children?: unknown[] };

/**
 * Walks the mdast and rewrites wikilink syntax inside `text` nodes.
 *
 * Strip mode collapses each wikilink to a single text node. Resolve mode may
 * split a text node into a mix of text + link nodes — the parent's `children`
 * array is rebuilt in place.
 *
 * Skips `code` and `inlineCode` nodes so literal `[[...]]` inside code fences
 * and inline code stays intact (preserves the existing code-fence guarantee).
 */
function visitAndReplace(
  node: AnyParent,
  opts: WikilinkResolveOpts | undefined,
): void {
  if (node.type === "code" || node.type === "inlineCode") return;
  if (!("children" in node) || !Array.isArray(node.children)) return;

  const parent = node as { children: PhrasingContent[] };
  const newChildren: PhrasingContent[] = [];

  for (const child of parent.children) {
    if (child.type === "text") {
      const expanded = expandWikilinksInText(child.value, opts);
      newChildren.push(...expanded);
    } else {
      visitAndReplace(child as AnyParent, opts);
      newChildren.push(child);
    }
  }

  parent.children = newChildren;
}

/**
 * Splits a raw text value into mdast nodes (Text and/or Link), replacing each
 * wikilink in place.
 *
 * Per-call RegExp instance — no shared `lastIndex` mutation across concurrent
 * renders (carried over from the render.ts fix).
 *
 * `matched` tracks whether the regex hit anything. An input that contained
 * only a stripped embed (`![[image.png]]`) returns an empty result set, not
 * a fallback to the raw input.
 */
function expandWikilinksInText(
  value: string,
  opts: WikilinkResolveOpts | undefined,
): (Text | Link)[] {
  const results: (Text | Link)[] = [];
  let lastIndex = 0;
  let matched = false;
  const re = new RegExp(WIKILINK_AST_PATTERN, "g");

  for (const match of value.matchAll(re)) {
    matched = true;
    // Skip captures 3 (#heading) and 4 (^block-id) — they're parsed only so
    // the overall regex stays correct; the resolved display/target uses
    // groups 1 (!embed), 2 (target), and 5 (|alias).
    const full = match[0];
    const embed = match[1];
    const target = match[2];
    const alias = match[5];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      results.push({ type: "text", value: value.slice(lastIndex, start) });
    }

    // Embed: stripped entirely (never leak asset / note names)
    if (embed === "!") {
      lastIndex = start + full.length;
      continue;
    }

    const rawTarget = target ?? "";
    const display = (alias !== undefined && alias.length > 0
      ? alias
      : rawTarget
    ).trim();
    const candidateSlug = targetToSlug(rawTarget);

    // Resolve mode: gate on private slug, emit anchor on public slug.
    if (opts && candidateSlug !== "") {
      if (opts.privateSlugs.has(candidateSlug)) {
        throw new WikilinkLeakError(
          opts.sourcePath,
          rawTarget,
          candidateSlug,
        );
      }
      if (opts.publicSlugs.has(candidateSlug)) {
        const prefix = opts.hrefPrefix ?? "/writing";
        results.push({
          type: "link",
          url: `${prefix}/${candidateSlug}`,
          children: [{ type: "text", value: display }],
        });
        lastIndex = start + full.length;
        continue;
      }
    }

    // Fallback (strip mode, or unresolved target in resolve mode):
    // emit the display text. Empty display drops the node entirely.
    if (display !== "") {
      results.push({ type: "text", value: display });
    }
    lastIndex = start + full.length;
  }

  if (lastIndex < value.length) {
    results.push({ type: "text", value: value.slice(lastIndex) });
  }

  if (!matched) {
    return [{ type: "text", value }];
  }

  return results;
}

/**
 * Returns a remark plugin instance bound to the given options.
 *
 * No-arg call (or `undefined` opts) returns the strip-mode plugin used by
 * lint helpers and excerpt rendering — wikilinks become plain text, embeds
 * disappear, no slug map needed.
 *
 * Passing `WikilinkResolveOpts` activates resolve mode: public targets
 * become mdast `link` nodes, private targets throw `WikilinkLeakError`, and
 * unresolved targets fall back to plain text.
 *
 * Plugin instances are cheap to construct, so callers can build a fresh one
 * per render with a different slug map without measurable overhead.
 */
export function createWikilinkPlugin(
  opts?: WikilinkResolveOpts,
): Plugin<[], Root> {
  return () => (tree: Root) => {
    visitAndReplace(tree, opts);
  };
}

/**
 * Backwards-compatible default plugin — strip mode only.
 *
 * Used by `lib/vault/render.ts` for the cached strip-only processor and
 * directly by tests that don't need slug resolution.
 */
export const remarkStripWikilinks: Plugin<[], Root> = createWikilinkPlugin();
