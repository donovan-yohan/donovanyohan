/**
 * Renders markdown body to sanitized HTML.
 *
 * Pipeline: remark → remark-gfm → strip wikilinks (in remark AST) → remark-rehype
 *          → rehype-sanitize → rehype-stringify
 *
 * - GFM features supported: tables, strikethrough, task lists, autolinks
 * - Wikilinks ([[note]], [[note|alias]], [[note#h]], [[note^id]], ![[embed]])
 *   stripped to plain text BEFORE HTML conversion (so they're never in output)
 * - HTML in markdown (raw <script>, <iframe>, onclick=) is sanitized away
 *   per rehype-sanitize default schema
 * - Code fences and inline code preserve literal wikilink syntax
 *
 * P18: Wikilink handling — Obsidian-syntax-aware strip.
 * P19: HTML sanitization via rehype-sanitize defaultSchema.
 * P25: No I/O, no throws, no env access at module init.
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Root, Text, PhrasingContent } from "mdast";
import type { Plugin } from "unified";

// ── Wikilink regex ────────────────────────────────────────────────────────────
//
// Matches Obsidian wikilink forms at AST-text level (code fences/inline code
// are never visited, preserving literal wikilink syntax there).
//
// Capture groups:
//   1 — embed prefix `!` (if present)
//   2 — target (before `|`, `#`, `^`)
//   3 — alias after `|` (optional)
//   4 — heading fragment after `#` (optional)
//   5 — block id after `^` (optional)
//
// Examples:
//   [[note]]           → target=note, no alias
//   [[note|alias]]     → target=note, alias=alias
//   [[note#heading]]   → target=note (heading stripped for display)
//   [[note^block-id]]  → target=note (block id stripped)
//   ![[image.png]]     → embed, stripped entirely
//
// TODO(#33): dedupe with lib/vault/wikilinks.ts when both PRs merge.

const WIKILINK_RE =
  /(!?)\[\[([^\]|#^]+?)(?:#([^\]|^]+))?(?:\^([^\]|#]+))?(?:\|([^\]]+))?\]\]/g;

/**
 * Resolves the display text for a parsed wikilink.
 *
 * - Embed (`![[...]]`) → empty string (stripped entirely per P18)
 * - `[[note|alias]]` → alias
 * - `[[note#heading]]` / `[[note^id]]` → target (heading/id stripped)
 * - `[[note]]` → target
 *
 * TODO(#33): dedupe with lib/vault/wikilinks.ts when both PRs merge.
 */
function wikilinkDisplayText(
  embed: string,
  target: string,
  _heading: string | undefined,
  _blockId: string | undefined,
  alias: string | undefined,
): string {
  // Embed: stripped entirely — revealing asset/note names is a privacy risk (P18)
  if (embed === "!") return "";

  // Explicit alias overrides everything
  if (alias) return alias;

  // Bare target (heading and block-id stripped per P18)
  return target;
}

// ── remark plugin ─────────────────────────────────────────────────────────────

/**
 * Remark plugin that walks the mdast and replaces wikilink syntax in Text
 * nodes with plain-text equivalents.
 *
 * Code nodes (inline `code` and fenced `code` in mdast) are left untouched,
 * preserving the literal `[[...]]` inside code fences and inline code.
 *
 * TODO(#33): dedupe with lib/vault/wikilinks.ts when both PRs merge.
 */
const remarkStripWikilinks: Plugin<[], Root> = function () {
  return (tree: Root) => {
    visitText(tree);
  };
};

/**
 * Recursively visit all nodes in the tree.
 * Skips `code` (fenced) and `inlineCode` nodes — their `.value` is literal
 * text that should never be parsed for wikilinks.
 */
function visitText(node: Root | PhrasingContent | { type: string; children?: unknown[] }): void {
  // Skip code nodes — their value is literal source text
  if (node.type === "code" || node.type === "inlineCode") {
    return;
  }

  if ("children" in node && Array.isArray(node.children)) {
    const parent = node as { children: (PhrasingContent | { type: string; children?: unknown[] })[] };
    const newChildren: typeof parent.children = [];

    for (const child of parent.children) {
      if (child.type === "text") {
        const textNode = child as Text;
        const expanded = expandWikilinksInText(textNode.value);
        newChildren.push(...expanded);
      } else {
        visitText(child);
        newChildren.push(child);
      }
    }

    parent.children = newChildren;
  }
}

/**
 * Splits a raw text value into an array of mdast Text nodes, replacing each
 * wikilink with its display text (or empty, for embeds).
 */
function expandWikilinksInText(value: string): Text[] {
  const results: Text[] = [];
  let lastIndex = 0;

  WIKILINK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = WIKILINK_RE.exec(value)) !== null) {
    const [full, embed, target, heading, blockId, alias] = match;
    const start = match.index;

    // Text before this wikilink
    if (start > lastIndex) {
      results.push({ type: "text", value: value.slice(lastIndex, start) });
    }

    const display = wikilinkDisplayText(
      embed ?? "",
      target ?? "",
      heading,
      blockId,
      alias,
    );

    if (display !== "") {
      results.push({ type: "text", value: display });
    }

    lastIndex = start + full.length;
  }

  // Remaining text after last wikilink
  if (lastIndex < value.length) {
    results.push({ type: "text", value: value.slice(lastIndex) });
  }

  // If no wikilinks matched, return the original value as a single node
  if (results.length === 0) {
    results.push({ type: "text", value });
  }

  return results;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Renders a markdown body string to sanitized HTML.
 *
 * Pipeline:
 *   1. remark (parse markdown → mdast)
 *   2. remark-gfm (GFM extensions: tables, strikethrough, task lists, autolinks)
 *   3. remarkStripWikilinks (strip Obsidian wikilink syntax in text nodes)
 *   4. remark-rehype (mdast → hast)
 *   5. rehype-sanitize (remove unsafe HTML per defaultSchema)
 *   6. rehype-stringify (hast → HTML string)
 *
 * @param body - Raw markdown string (may be empty).
 * @returns Sanitized HTML string. Empty input returns empty string.
 */
export async function renderMarkdown(body: string): Promise<string> {
  if (body.trim() === "") return "";

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStripWikilinks)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify);

  const result = await processor.process(body);
  return String(result);
}
