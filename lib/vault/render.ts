/**
 * Renders markdown body to sanitized HTML.
 *
 * Pipeline: remark-parse → remark-gfm → strip wikilinks → remark-rehype
 *          (allowDangerousHtml) → rehype-raw → rehype-sanitize → rehype-stringify
 *
 * - GFM features supported: tables, strikethrough, task lists, autolinks
 * - Wikilinks ([[note]], [[note|alias]], [[note#h]], [[note^id]], ![[embed]])
 *   stripped to plain text BEFORE HTML conversion (so they're never in output)
 * - Raw HTML in markdown is parsed (rehype-raw) then sanitized per
 *   rehype-sanitize defaultSchema. Default `remark-rehype` would silently DROP
 *   raw HTML before sanitize ran — we explicitly allow it through then sanitize.
 *   Result: <script>, <iframe>, onclick= and other unsafe forms are stripped;
 *   safe inline HTML (e.g. <em>, <a href>) is preserved.
 * - Code fences and inline code preserve literal wikilink syntax
 *
 * P18: Wikilink handling — Obsidian-syntax-aware strip.
 * P19: HTML sanitization via rehype-sanitize defaultSchema (with rehype-raw).
 * P25: No I/O, no throws, no env access at module init.
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Root, Text, PhrasingContent } from "mdast";
import type { Plugin } from "unified";

// ── Wikilink regex (template; NOT executed directly) ──────────────────────────
//
// Matches Obsidian wikilink forms at AST-text level (code fences/inline code
// are never visited, preserving literal wikilink syntax there).
//
// Source pattern is kept as a string and a fresh `RegExp` instance is created
// per call site to avoid `lastIndex` mutation under concurrent renderMarkdown
// calls. We use `String.prototype.matchAll` on a non-global instance.
//
// Capture groups (as ordered by the destructuring at the call site):
//   [1] embed   — leading `!` if present (`![[...]]` is an embed)
//   [2] target  — text before `#`, `^`, or `|`
//   [3] heading — fragment after `#` (optional)
//   [4] blockId — fragment after `^` (optional)
//   [5] alias   — fragment after `|` (optional)
//
// Examples:
//   [[note]]           → target=note, no alias
//   [[note|alias]]     → target=note, alias=alias
//   [[note#heading]]   → target=note (heading stripped for display)
//   [[note^block-id]]  → target=note (block id stripped)
//   ![[image.png]]     → embed, stripped entirely
//
// TODO(#33): dedupe with lib/vault/wikilinks.ts when both PRs merge.

const WIKILINK_PATTERN =
  String.raw`(!?)\[\[([^\]|#^]+?)(?:#([^\]|^]+))?(?:\^([^\]|#]+))?(?:\|([^\]]+))?\]\]`;

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
 *
 * Uses a per-call `RegExp` instance (not a shared module-level regex) so
 * concurrent `renderMarkdown` calls cannot interfere via `lastIndex`. Tracks
 * an explicit `matched` flag so an input that contained ONLY a stripped
 * embed still produces an empty result set (not the original raw string).
 */
function expandWikilinksInText(value: string): Text[] {
  const results: Text[] = [];
  let lastIndex = 0;
  let matched = false;

  // Per-call regex instance — no shared lastIndex mutation across concurrent
  // renderMarkdown calls (gemini #43, copilot concurrency note).
  const re = new RegExp(WIKILINK_PATTERN, "g");

  for (const match of value.matchAll(re)) {
    matched = true;
    const [full, embed, target, heading, blockId, alias] = match;
    const start = match.index ?? 0;

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

  // If NO wikilinks matched, return the original value as a single node.
  // If wikilinks DID match but all were stripped (e.g. text was just an
  // embed `![[image.png]]`), return an empty array — do NOT push the raw
  // input back. (gemini #43 logic-bug fix.)
  if (!matched) {
    return [{ type: "text", value }];
  }

  return results;
}

// ── Public API ────────────────────────────────────────────────────────────────

// Pre-configured + frozen processor reused across renderMarkdown calls.
// Module-level so plugin registration only happens once. Per unified docs:
// `freeze()` makes the processor reusable; `process()` is safe to call
// concurrently because it allocates fresh state per invocation. (gemini #43
// performance note.)
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkStripWikilinks)
  // allowDangerousHtml: lets raw HTML pass through to rehype-raw + sanitize
  // instead of being silently dropped by the default mdast→hast bridge.
  // Otherwise <script>, <iframe>, etc. would never reach the sanitizer
  // (because remark-rehype would have already deleted them) — meaning the
  // "sanitization" guarantee in our docs would be vacuous. (copilot #43)
  .use(remarkRehype, { allowDangerousHtml: true })
  // Parse the raw HTML strings (now in hast as `raw` nodes) into actual
  // hast element nodes so rehype-sanitize can inspect and prune them.
  .use(rehypeRaw)
  .use(rehypeSanitize)
  .use(rehypeStringify)
  .freeze();

/**
 * Renders a markdown body string to sanitized HTML.
 *
 * Pipeline:
 *   1. remark-parse           — markdown → mdast
 *   2. remark-gfm             — GFM extensions: tables, strikethrough, tasks
 *   3. remarkStripWikilinks   — strip Obsidian wikilink syntax in text nodes
 *   4. remark-rehype          — mdast → hast (allowDangerousHtml: true)
 *   5. rehype-raw             — parse raw-HTML hast nodes into element nodes
 *   6. rehype-sanitize        — remove unsafe HTML per defaultSchema
 *   7. rehype-stringify       — hast → HTML string
 *
 * @param body - Raw markdown string (may be empty).
 * @returns Sanitized HTML string. Empty input returns empty string.
 */
export async function renderMarkdown(body: string): Promise<string> {
  if (body.trim() === "") return "";
  const result = await processor.process(body);
  return String(result);
}
