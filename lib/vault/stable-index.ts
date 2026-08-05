/**
 * stable-index.ts — stable entry numbers for published vault notes.
 *
 * An entry number is an identity, not a list position: the oldest published
 * note is #001 forever, the next one #002, and publishing something new only
 * ever appends the next number. Numbering therefore runs over the whole
 * published set in date-ascending order, and callers look each card's number
 * up by slug — so newest-first display order, month grouping and client-side
 * filters all render the same number for the same note.
 *
 * Callers pass the complete set they publish on that surface (post
 * eligibility filter, pre display filter). Numbering a partially filtered set
 * would reintroduce shifting numbers.
 *
 * Pure module: no I/O, no module-init side effects (P25).
 */

import type { VaultNote } from "./schema";

/**
 * Maps every note's slug to its 1-based position in date-ascending order.
 * Ties on date are broken by slug so the ordering is total and deterministic.
 */
export function stableIndexBySlug(notes: VaultNote[]): Map<string, number> {
  const bySlug = new Map<string, number>();

  [...notes]
    .sort((a, b) => {
      const dateCmp = a.frontmatter.date.localeCompare(b.frontmatter.date);
      return dateCmp !== 0 ? dateCmp : a.slug.localeCompare(b.slug);
    })
    .forEach((note, position) => bySlug.set(note.slug, position + 1));

  return bySlug;
}

/** Renders an entry number as the card label `#001`. */
export const formatEntryNumber = (entryNumber: number): string =>
  `#${String(entryNumber).padStart(3, "0")}`;
