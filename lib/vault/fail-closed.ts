/**
 * fail-closed.ts — privacy boundary for vault visibility resolution.
 *
 * Privacy boundary per P10. Fail-closed: anything not explicitly `public`
 * resolves to `private` by default. `visibility: preview` is rendered only
 * when the caller opts into development preview mode.
 *
 * Per P22 (walk-then-stop-if-private order), `resolveVisibility` is called
 * BEFORE full schema validation, before body rendering, before any other
 * processing. If the result is not `'public'`, the pipeline stops immediately.
 *
 * Per P25: No I/O, no env access, no throws at module init. Pure function.
 */

import { VaultFrontmatterSchema } from "./schema";
import type { Visibility } from "./schema";

/**
 * Resolves whether a raw frontmatter object should be treated as public or
 * private. This is the ONLY source of truth for that decision.
 *
 * The function returns `'public'` when ALL of the following are true:
 *   1. `rawFrontmatter` is a non-null object.
 *   2. `visibility` is exactly the string `'public'` (no whitespace, no caps).
 *   3. `title` is a non-empty string.
 *   4. `date` is a valid YYYY-MM-DD string (or a JS Date that coerces to one).
 *
 * It returns `'preview'` for valid `visibility: preview` only when
 * `includePreview` is true. Every other input — null, undefined, {}, wrong
 * type, wrong value, YAML parse errors — returns `'private'`.
 *
 * @param rawFrontmatter - Output of gray-matter's `.data` property, or
 *   anything else that came out of a per-file try/catch.
 * @returns `'public'` | `'preview'` | `'private'`
 */
export function resolveVisibility(
  rawFrontmatter: unknown,
  opts: { includePreview?: boolean } = {},
): Visibility {
  // Fast-path: must be a non-null object
  if (rawFrontmatter === null || rawFrontmatter === undefined) return "private";
  if (typeof rawFrontmatter !== "object" || Array.isArray(rawFrontmatter)) {
    return "private";
  }

  // Peek at visibility before running full schema parse (cheap guard)
  const raw = rawFrontmatter as Record<string, unknown>;
  const rawVisibility = raw["visibility"];
  const isVisible =
    rawVisibility === "public" ||
    (opts.includePreview === true && rawVisibility === "preview");
  if (!isVisible) {
    // Catches: undefined, null, 'private', 'PUBLIC', 'public ', ['public'],
    // and preview notes outside the configured development preview mode.
    return "private";
  }

  // Run the Zod schema to validate title + date (and coerce Date → string).
  // We use safeParse so YAML weirdness never throws out of this function.
  const result = VaultFrontmatterSchema.safeParse(rawFrontmatter);
  if (!result.success) return "private";

  // Schema defaults visibility to 'private' on missing; after parse, confirm
  // the resolved value is still an allowed visibility for this publication mode.
  if (result.data.visibility === "public") return "public";
  if (opts.includePreview === true && result.data.visibility === "preview") {
    return "preview";
  }
  return "private";
}
