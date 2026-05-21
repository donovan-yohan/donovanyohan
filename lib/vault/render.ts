/**
 * render.ts — markdown body → sanitized HTML for vault notes.
 *
 * Pipeline:
 *   1. remark-parse           — markdown → mdast
 *   2. remark-gfm             — GFM extensions: tables, strikethrough, tasks
 *   3. wikilink plugin        — strip OR resolve, depending on opts (P18, P31)
 *   4. remark-rehype          — mdast → hast (allowDangerousHtml: true)
 *   5. rehype-raw             — parse raw-HTML hast nodes into element nodes
 *   6. rehype-sanitize        — remove unsafe HTML per defaultSchema (P19)
 *   7. rehype-stringify       — hast → HTML string
 *
 * Two render modes:
 *
 *   - No opts → strip wikilinks to plain text (cached, frozen processor).
 *     Used wherever a slug map isn't available (excerpt rendering, lint).
 *
 *   - `WikilinkResolveOpts` → resolve public targets to `<a>`, throw
 *     `WikilinkLeakError` on private targets, fall back to plain text for
 *     unresolved targets. Used by the vault adapter once the per-vault slug
 *     map has been built. A fresh processor is constructed per call because
 *     the plugin instance is bound to the supplied slug sets.
 *
 * `allowDangerousHtml: true` is intentional — without it, remark-rehype would
 * silently drop raw HTML before rehype-sanitize ran, leaving the sanitizer
 * with nothing to inspect. Letting raw HTML through and then sanitizing makes
 * the privacy promise observable (matches the explainer in `VAULT.md`).
 *
 * Per P25: No I/O, no env access, no throws at module init.
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { createWikilinkPlugin } from "./wikilinks";
import type { WikilinkResolveOpts } from "./wikilinks";

// Re-export so adapters can import the opts type from a single module.
export type { WikilinkResolveOpts } from "./wikilinks";

/**
 * Cached strip-only processor for no-opts renders. Reusable per unified docs:
 * `freeze()` makes the processor reentrant; `process()` allocates fresh state
 * per invocation so concurrent calls don't trample each other.
 */
const stripProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(createWikilinkPlugin())
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize)
  .use(rehypeStringify)
  .freeze();

/**
 * Renders a markdown body string to sanitized HTML.
 *
 * @param body - Raw markdown (may be empty).
 * @param opts - When provided, wikilinks resolve against the supplied slug
 *   sets and emit `<a>` for public targets / throw for private targets /
 *   fall back to plain text for unresolved targets. When omitted, all
 *   wikilinks are stripped to plain text (and embeds dropped entirely).
 * @returns Sanitized HTML string. Empty input returns empty string.
 */
export async function renderMarkdown(
  body: string,
  opts?: WikilinkResolveOpts,
): Promise<string> {
  if (body.trim() === "") return "";

  if (opts === undefined) {
    const result = await stripProcessor.process(body);
    return String(result);
  }

  // Resolve mode: plugin instance is bound to the supplied slug map, so the
  // processor must be built per call. (The slug map differs per render.)
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(createWikilinkPlugin(opts))
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeStringify);

  const result = await processor.process(body);
  return String(result);
}
