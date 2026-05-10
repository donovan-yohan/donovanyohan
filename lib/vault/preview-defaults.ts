/**
 * preview-defaults.ts — fills in missing PreviewConfig fields with sensible
 * defaults so the frontend always receives a fully-resolved PreviewConfig
 * (no optional fields left undefined in the merged output).
 *
 * Per API_CONTRACT.md, `VaultNote.preview` must be a complete PreviewConfig —
 * callers must not need to null-check individual fields.
 *
 * Per P12 (design doc): defaults are `kind: 'text'`, `span: 4`,
 * `headline: fallback.title`, `excerpt: fallback.firstParagraph`.
 *
 * Per P25: No I/O, no env access, no throws at module init. Pure function.
 */

import type { PreviewConfig, PreviewConfigPartial } from "./schema";

/**
 * Contextual fallback values sourced from the note itself.
 * Passed in from the adapter layer rather than read here to preserve P25
 * (no I/O at module init).
 */
export interface PreviewFallback {
  /** The note's frontmatter title. */
  title: string;
  /** The first paragraph of the note body, plain text. May be empty string. */
  firstParagraph: string;
}

/**
 * Merges a partial `preview` frontmatter block with defaults, producing a
 * fully-resolved `PreviewConfig` with no undefined required fields.
 *
 * Optional visual fields (`accent`, `tint`, `image`) are forwarded as-is;
 * they remain `undefined` when not specified.
 *
 * @param partial - The `preview` object from frontmatter (may be undefined).
 * @param fallback - Note-level fallback values for headline and excerpt.
 * @returns A complete `PreviewConfig` — never has undefined `kind`, `span`,
 *   `headline`, or `excerpt`.
 */
export function applyPreviewDefaults(
  partial: PreviewConfigPartial | undefined,
  fallback: PreviewFallback,
): PreviewConfig {
  return {
    kind: partial?.kind ?? "text",
    span: partial?.span ?? 4,
    headline: partial?.headline ?? fallback.title,
    excerpt: partial?.excerpt ?? fallback.firstParagraph,
    // Optional visual overrides — only include if provided
    ...(partial?.accent !== undefined ? { accent: partial.accent } : {}),
    ...(partial?.tint !== undefined ? { tint: partial.tint } : {}),
    ...(partial?.image !== undefined ? { image: partial.image } : {}),
  };
}
