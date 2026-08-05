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

export type Visibility = "public" | "preview" | "private";
export type PreviewKind = "text" | "image" | "quote" | "embed";
export type NoteType = "note" | "work" | "writing" | "reshare";

export const TAG_SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
export const TagSlugSchema = z
  .string()
  .regex(TAG_SLUG_REGEX, "tag slug must be kebab-case ASCII, starting and ending with alphanumeric");

const frontmatterDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === "string" ? v : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
);

export const SeriesConfigSchema = z.object({
  slug: TagSlugSchema,
  title: z.string().min(1, "series.title cannot be empty"),
  order: z.number().int().min(1).optional(),
});

export type SeriesConfig = z.infer<typeof SeriesConfigSchema>;

export const TaxonomyTagSchema = z.object({
  label: z.string().min(1, "tag label cannot be empty"),
  description: z.string().optional(),
  showInFilters: z.boolean().default(false),
  order: z.number().int().default(1000),
});

export const VaultTaxonomySchema = z.object({
  tags: z.record(TagSlugSchema, TaxonomyTagSchema).default({}),
});

export type TaxonomyTag = z.infer<typeof TaxonomyTagSchema>;
export type VaultTaxonomy = z.infer<typeof VaultTaxonomySchema>;

// Hex colour validator — accepts #RGB or #RRGGBB. Rejects malformed colours
// that would silently break colour-driven rendering.
const HEX_COLOR = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

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
  imageBg: z
    .string()
    .regex(HEX_COLOR, "preview.imageBg must be a hex colour (#RGB or #RRGGBB)")
    .optional(),
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
  imageBg?: string;
}

/**
 * BannerConfig: light/dark image paths for the work-page hero banner.
 * Only meaningful when `type: work`.
 */
export const BannerConfigSchema = z.object({
  // Public-asset paths must start with `/` so the renderer can serve them
  // directly without relative-path ambiguity. Leak-test friendly.
  light: z
    .string()
    .startsWith("/", "banner.light must be a public asset path starting with /")
    .optional(),
  dark: z
    .string()
    .startsWith("/", "banner.dark must be a public asset path starting with /")
    .optional(),
});

export type BannerConfig = z.infer<typeof BannerConfigSchema>;

/**
 * BgColorConfig: light/dark hex colour for the work-page hero background.
 * Only meaningful when `type: work`.
 */
export const BgColorConfigSchema = z.object({
  light: z
    .string()
    .regex(HEX_COLOR, "bgColor.light must be a hex colour (#RGB or #RRGGBB)")
    .optional(),
  dark: z
    .string()
    .regex(HEX_COLOR, "bgColor.dark must be a hex colour (#RGB or #RRGGBB)")
    .optional(),
});

export type BgColorConfig = z.infer<typeof BgColorConfigSchema>;

/**
 * WorkInfoItem: a single metadata chip displayed in the work-page hero.
 * `href` is optional — when present the chip renders as a link.
 */
export const WorkInfoItemSchema = z.object({
  // Non-empty label so an info chip is never blank in the hero.
  label: z.string().min(1, "info[].label cannot be empty"),
  href: z.string().optional(),
});

export type WorkInfoItem = z.infer<typeof WorkInfoItemSchema>;

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
 *
 * Work-type fields (`type`, `subtitle`, `banner`, `bgColor`, `info`, `render`)
 *   are all optional and backwards-compatible. Existing note fixtures that omit
 *   them continue to validate unchanged.
 */
export const VaultFrontmatterSchema = z
  .object({
    title: z.string().min(1),

    date: frontmatterDate,
    updated: frontmatterDate.optional(),
    changeNote: z.string().min(1).optional(),

    slug: z
      .string()
      .regex(
        /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
        "slug must be kebab-case ASCII, starting and ending with alphanumeric",
      )
      .optional(),

    /**
     * Production privacy boundary (P10): default `private` — fail-closed.
     * `visibility: preview` is also non-public unless the build explicitly opts
     * into staging preview mode for a configured development branch.
     */
    visibility: z.enum(["public", "preview", "private"]).default("private"),

    preview: PreviewConfigSchema.optional(),
    tags: z.array(TagSlugSchema).default([]),
    series: SeriesConfigSchema.optional(),

    // ── Work-type fields (Layer B, Phase A) ────────────────────────────────
    // All optional. Backwards-compatible: existing notes that omit them are
    // unaffected. Only meaningful when `type: work`; ignored by the note
    // renderer for `type: note` (default).

    /**
     * `type` — content category. Defaults to `"note"` for all existing notes.
     * `"work"` enables work-page-specific rendering; `"writing"` and
     * `"reshare"` are used by dy-journal article/frontmatter classification.
     */
    // `.default()` already makes the field optional at the input layer; do NOT
    // add `.optional()` after, which would cause Zod to infer `T | undefined`
    // and effectively bypass the default when the key is missing. The
    // discriminator must always resolve to a known note type at runtime.
    type: z.enum(["note", "work", "writing", "reshare"]).default("note"),

    /**
     * `subtitle` — extended description shown in the work-page hero below the
     * title. Equivalent to the `content` prop on `<ArticleHero>`.
     */
    subtitle: z.string().optional(),

    /**
     * `banner` — hero banner image paths. `light` and `dark` each accept a
     * public asset path (e.g. `/img/photos/manulifebanner.png`).
     */
    banner: BannerConfigSchema.optional(),

    /**
     * `bgColor` — hero background colour. Accepts hex strings
     * (e.g. `"#05AC5B"`). Phase B maps these to CSS custom properties.
     */
    bgColor: BgColorConfigSchema.optional(),

    /**
     * `info` — ordered list of metadata chips for the work-page hero.
     * Items without `href` render as plain text; items with `href` render
     * as links. Equivalent to the `info` prop on `<ArticleHero>`.
     */
    info: z.array(WorkInfoItemSchema).optional(),

    /**
     * `render` — renderer hint map (Layer B per spec).
     * Maps element selectors to named render presets so Phase B's NoteRenderer
     * can apply visual treatments without baking them into markdown.
     * Example: `{ h2: "highlighter", blockquote: "pull-quote" }`.
     */
    render: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

export type VaultFrontmatter = z.infer<typeof VaultFrontmatterSchema> & {
  // passthrough() allows extra keys; re-declare for explicit typing
  [extra: string]: unknown;
};

// ── VaultNote ─────────────────────────────────────────────────────────────────

/**
 * VaultNote — the fully-resolved public-safe representation of a vault note.
 * Returned by `getPublicNotes()` and `getNoteBySlug()`.
 *
 * `body` is SANITIZED HTML (rehype-sanitize applied; wikilinks stripped).
 * `bodyMarkdown` is the raw markdown body (sans frontmatter) for future renderers.
 * `preview` is fully resolved — no undefined required fields.
 */
export interface VaultNote {
  slug: string;
  path: string;
  frontmatter: VaultFrontmatter;
  body: string;
  bodyMarkdown: string;
  preview: PreviewConfig;
}

/**
 * VaultAdapter — the interface that all vault adapters implement.
 */
export interface VaultAdapter {
  getPublicNotes(): Promise<VaultNote[]>;
  getTaxonomy(): Promise<VaultTaxonomy>;
}

/**
 * VaultConfig — selects source and provides credentials.
 */
export type VaultConfig =
  | { source: "local"; path: string }
  | { source: "github"; repoUrl: string; token: string; ref?: string };

/**
 * AdapterResult — the per-file result from the adapter pipeline.
 * Private files return a minimal result (no body data); public files
 * return the full VaultNote.
 */
export type AdapterFileResult =
  | { status: "public"; note: VaultNote }
  | { status: "private"; path: string }
  | { status: "error"; path: string; reason: string };
