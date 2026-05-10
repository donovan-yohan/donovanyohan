/**
 * duplicate-check.ts — detect colliding slugs in the public note set.
 *
 * Per P11: Duplicate slugs across the public set throw DuplicateSlugError.
 * Handles N-way collisions (3+ files sharing a slug) — all colliding paths
 * are included in the error.
 *
 * Per P25: No I/O, no env access at module init. Pure function.
 */

import { DuplicateSlugError } from "./errors";
import type { VaultNote } from "./schema";
import { deriveSlug } from "./slug";

/**
 * Asserts no two notes in `notes` share a slug.
 * Throws `DuplicateSlugError` for the first collision found (including
 * all files that share that slug).
 *
 * @param notes - Array of public VaultNote objects.
 * @throws DuplicateSlugError if any two+ notes share a slug.
 */
export function assertNoDuplicateSlugs(notes: VaultNote[]): void {
  // Map from slug → list of { path, resolution }
  const slugMap = new Map<
    string,
    Array<{ path: string; resolution: "derived" | "frontmatter" }>
  >();

  for (const note of notes) {
    const { slug, path, frontmatter } = note;
    const resolution: "derived" | "frontmatter" =
      frontmatter.slug !== undefined && frontmatter.slug === slug
        ? "frontmatter"
        : // Check if the derived slug matches — if frontmatter.slug was
          // provided but invalid, deriveSlug falls back to filename
          // derivation. We detect this by checking whether the note's slug
          // matches what deriveSlug would produce from the filename.
          deriveSlug(path.split("/").pop() ?? path, frontmatter.slug) === slug &&
            frontmatter.slug !== undefined
          ? "frontmatter"
          : "derived";

    const existing = slugMap.get(slug);
    if (existing) {
      existing.push({ path, resolution });
    } else {
      slugMap.set(slug, [{ path, resolution }]);
    }
  }

  // Find collisions and throw on the first one
  for (const [slug, entries] of slugMap) {
    if (entries.length > 1) {
      throw new DuplicateSlugError(
        slug,
        entries.map((e) => e.path),
        entries.map((e) => e.resolution),
      );
    }
  }
}
