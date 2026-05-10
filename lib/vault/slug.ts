/**
 * slug.ts — filename → kebab-case ASCII slug derivation.
 *
 * Slug rules per P11 (API_CONTRACT.md):
 *   - If a valid frontmatter slug override is provided, use it directly.
 *   - Otherwise, derive from the filename: strip Unicode/emoji/accents,
 *     lowercase, replace whitespace and punctuation with `-`, collapse
 *     repeated dashes, trim leading/trailing dashes.
 *
 * Per P25: No I/O, no env access, no throws at module init. Pure function.
 */

/**
 * Regex for valid frontmatter slug overrides.
 * Must start AND end with an alphanumeric character; may contain lowercase
 * letters, digits, and hyphens in the middle. Single-character slugs
 * (just one alphanumeric) are also valid.
 */
const VALID_SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

/**
 * Derives a canonical URL slug for a vault note.
 *
 * @param filename - The bare filename including extension, e.g. `Hello World.md`.
 *   Just the name, not the full path. The `.md` extension (or any extension)
 *   is stripped before processing.
 * @param frontmatterSlug - Optional frontmatter `slug` override. If provided
 *   and valid, it is returned as-is. If provided but invalid, the derivation
 *   falls back to the filename (conservative — does not throw).
 * @returns Kebab-case, ASCII-only slug string.
 *
 * @example
 * deriveSlug('Hello World.md')          // 'hello-world'
 * deriveSlug('2026-05-10 Daily.md')     // '2026-05-10-daily'
 * deriveSlug("What's New?.md")          // 'whats-new'
 * deriveSlug('résumé.md')              // 'resume'
 * deriveSlug('🚀 Launch.md')           // 'launch'
 * deriveSlug('Note (draft).md')        // 'note-draft'
 * deriveSlug('my-note.md', 'custom')   // 'custom'
 */
export function deriveSlug(filename: string, frontmatterSlug?: string): string {
  // If a slug override was given and passes validation, use it.
  if (frontmatterSlug !== undefined && frontmatterSlug !== null) {
    if (VALID_SLUG_RE.test(frontmatterSlug)) {
      return frontmatterSlug;
    }
    // Invalid override — fall through to filename derivation (conservative).
  }

  return slugifyFilename(filename);
}

/**
 * Converts a filename to a kebab-case ASCII slug.
 *
 * Steps:
 *   1. Strip extension (everything after the last `.`).
 *   2. Normalize Unicode to NFD decomposition (splits accented chars into
 *      base + combining mark, e.g. `é` → `e` + ◌́).
 *   3. Remove all non-ASCII characters (covers combining marks, emoji, etc.).
 *   4. Lowercase the result.
 *   5. Replace any run of whitespace or punctuation characters with a single `-`.
 *   6. Collapse repeated `-` into one.
 *   7. Trim leading and trailing `-`.
 */
function slugifyFilename(filename: string): string {
  // 1. Strip extension
  const name = filename.replace(/\.[^.]+$/, "");

  // 2. NFD decomposition — turns `é` into `e` + combining accent
  const decomposed = name.normalize("NFD");

  // 3. Remove non-ASCII (covers combining diacritical marks U+0300–U+036F,
  //    emoji, CJK, etc.). Use Unicode property escape \P{ASCII} to match
  //    any non-ASCII codepoint cleanly (avoids no-control-regex lint rule).
  const ascii = decomposed.replace(/\P{ASCII}/gu, "");

  // 4. Lowercase
  const lower = ascii.toLowerCase();

  // 4b. Remove apostrophes so contractions collapse without a separating dash
  //     (e.g. "What's" → "whats" not "what-s"). The non-ASCII filter on line 76
  //     already stripped curly quotes; only the ASCII apostrophe (0x27) remains.
  const noApostrophe = lower.replace(/'/g, "");

  // 5. Replace whitespace and punctuation runs with a single dash.
  //    Punctuation here = anything that is NOT alphanumeric or already a dash.
  const dashed = noApostrophe.replace(/[^a-z0-9-]+/g, "-");

  // 6. Collapse consecutive dashes
  const collapsed = dashed.replace(/-{2,}/g, "-");

  // 7. Trim leading/trailing dashes
  const trimmed = collapsed.replace(/^-+|-+$/g, "");

  // 8. Empty-result guard: a filename consisting entirely of non-ASCII
  //    characters or punctuation (e.g. "🚀🔥🎉.md") collapses to "". Caller
  //    must handle this — the schema's slug regex will reject empty strings,
  //    so the note resolves to private (fail-closed). Build-time
  //    duplicate-slug check catches repeated empties as collisions.
  return trimmed;
}
