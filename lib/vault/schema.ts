/**
 * Zod schema for vault frontmatter.
 *
 * Design decisions (see API_CONTRACT.md + design doc):
 *   - P24: YAML parsers may emit `date: 2026-05-10` as a JS Date object.
 *     `z.preprocess` coerces Date → ISO string before the regex check so the
 *     common authoring pattern doesn't silently resolve to private.
 *   - P10: `visibility` defaults to `'private'` — fail-closed by default.
 *   - `passthrough()` preserves extra frontmatter keys (e.g. `mood`, `weather`)
 *     for forkers and future pipeline stages without breaking validation.
 *   - P25: No I/O, no throws, no env access at module init. Pure exports.
 */

import { z } from "zod";

// ── Exported primitive types ──────────────────────────────────────────────────

export type Visibility = "public" | "private";
export type PreviewKind = "text" | "image" | "quote" | "embed";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

/**
 * PreviewConfig: controls how the note card is rendered on the writing index.
 * All sub-fields are optional in frontmatter; defaults applied by
 * `applyPreviewDefaults()` in preview-defaults.ts.
 */
export const PreviewConfigSchema = z.object({
  kind: z.enum(["text", "image", "quote", "embed"]).optional(),
  span: z.number().int().min(1).max(12).optional(),
  accent: z.string().optional(),
  tint: z.string().optional(),
  headline: z.string().optional(),
  excerpt: z.string().optional(),
  image: z.string().optional(),
});

export type PreviewConfigPartial = z.infer<typeof PreviewConfigSchema>;

export interface PreviewConfig {
  kind: PreviewKind;
  span: number;
  accent?: string;
  tint?: string;
  headline?: string;
  excerpt?: string;
  image?: string;
}

// ── Main frontmatter schema ───────────────────────────────────────────────────

/**
 * VaultFrontmatterSchema — the canonical Zod schema for vault note frontmatter.
 *
 * `passthrough()` — extra frontmatter keys (e.g. `mood`, `weather`) are
 *   preserved and passed through unchanged. They are NOT validated.
 *
 * Date coercion (P24) — `z.preprocess` converts:
 *   - JS `Date` (from YAML auto-parse) → ISO `YYYY-MM-DD` string
 *   - Strings → passed through as-is for regex validation
 *   - Anything else → passed through (will fail regex, so resolves to private)
 */
export const VaultFrontmatterSchema = z
  .object({
    title: z.string().min(1),

    date: z.preprocess(
      (v) => {
        // Invalid Date (e.g. `new Date('not-a-date')`) returns NaN from getTime();
        // calling toISOString() on it throws RangeError. Guard explicitly so the
        // value flows through to the regex check (which will reject it → private).
        if (v instanceof Date) {
          return Number.isNaN(v.getTime()) ? v : v.toISOString().slice(0, 10);
        }
        return v;
      },
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    ),

    slug: z
      .string()
      .regex(
        /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
        "slug must be kebab-case ASCII, starting and ending with alphanumeric",
      )
      .optional(),

    /**
     * Privacy boundary (P10): default `'private'` — fail-closed.
     * The only way a note becomes public is an explicit `visibility: public`
     * in frontmatter that also passes full schema validation.
     */
    visibility: z.enum(["public", "private"]).default("private"),

    preview: PreviewConfigSchema.optional(),
  })
  .passthrough();

export type VaultFrontmatter = z.infer<typeof VaultFrontmatterSchema> & {
  // passthrough() allows extra keys; re-declare for explicit typing
  [extra: string]: unknown;
};
