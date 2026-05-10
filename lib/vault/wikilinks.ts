/**
 * wikilinks.ts — strip Obsidian wikilink syntax to plain text (P18).
 *
 * Supported forms:
 *   [[note]]              → "note"
 *   [[note|alias]]        → "alias"
 *   [[note#heading]]      → "note"
 *   [[note^block-id]]     → "note"
 *   [[note#heading|alias]] → "alias"
 *   [[note^id|alias]]     → "alias"
 *   ![[anything]]         → "" (embeds stripped entirely — don't leak asset names)
 *
 * Code fences and inline code are NOT processed (remark plugin respects the AST).
 * `stripWikilinks()` is also exported for non-AST callers (lint/tests).
 *
 * Per P25: No I/O, no env access at module init.
 */

import type { Plugin } from "unified";
import type { Root, Text } from "mdast";
import { visit } from "unist-util-visit";

// ── Regex ─────────────────────────────────────────────────────────────────────

/**
 * Matches embeds: ![[...]]
 * Group 1: everything inside brackets (unused — embed is stripped entirely).
 */
const EMBED_RE = /!\[\[[^\]]*\]\]/g;

/**
 * Matches regular wikilinks: [[target]] or [[target|alias]]
 * where target may include a #heading or ^block-id suffix.
 *
 * Capture groups:
 *   1 — base note name (before # or ^)
 *   2 — optional alias (after |), or undefined
 */
const WIKILINK_RE = /\[\[([^#\]^|]+)(?:[#^][^\]|]*)?(?:\|([^\]]*))?\]\]/g;

// ── Plain-text strip (for non-AST callers) ────────────────────────────────────

/**
 * Strips all Obsidian wikilink forms from a raw markdown string.
 * Operates on the full string — does NOT skip code fences.
 * Use this for lint/test helpers. For body rendering, use the remark plugin.
 */
export function stripWikilinks(markdown: string): string {
  // Strip embeds first (would otherwise be caught by wikilink regex too)
  const noEmbeds = markdown.replace(EMBED_RE, "");
  // Strip wikilinks: alias if present, else base note name
  return noEmbeds.replace(
    WIKILINK_RE,
    (_match, noteName: string, alias?: string) => {
      return alias !== undefined ? alias.trim() : noteName.trim();
    },
  );
}

// ── Remark plugin (AST-aware — skips code fences and inline code) ─────────────

/**
 * Remark plugin that strips Obsidian wikilink syntax from text nodes.
 * Because it operates on the mdast Text node type, it naturally skips
 * code fences (Code) and inline code (InlineCode) — those are different
 * node types and are never visited.
 *
 * Note: this plugin only processes `text` nodes. Image alt text and link
 * titles are NOT stripped (they are separate node types/fields).
 */
export const remarkStripWikilinks: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "text", (node: Text) => {
      node.value = stripWikilinks(node.value);
    });
  };
};
