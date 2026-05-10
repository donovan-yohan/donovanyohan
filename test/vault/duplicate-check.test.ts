/**
 * duplicate-check.test.ts — slug collision detection tests.
 */

import { describe, it, expect } from "vitest";
import { assertNoDuplicateSlugs } from "../../lib/vault/duplicate-check";
import { DuplicateSlugError } from "../../lib/vault/errors";
import type { VaultNote } from "../../lib/vault/schema";

function makeNote(slug: string, filepath: string, frontmatterSlug?: string): VaultNote {
  return {
    slug,
    path: filepath,
    frontmatter: {
      title: "Test Note",
      date: "2026-05-10",
      visibility: "public",
      ...(frontmatterSlug ? { slug: frontmatterSlug } : {}),
    },
    body: "<p>body</p>",
    bodyMarkdown: "body",
    preview: {
      kind: "text",
      span: 4,
      headline: "Test Note",
      excerpt: "body",
    },
  };
}

describe("assertNoDuplicateSlugs — no collision", () => {
  it("passes when all slugs are unique", () => {
    const notes = [
      makeNote("note-a", "note-a.md"),
      makeNote("note-b", "note-b.md"),
      makeNote("note-c", "note-c.md"),
    ];
    expect(() => assertNoDuplicateSlugs(notes)).not.toThrow();
  });

  it("passes for empty array", () => {
    expect(() => assertNoDuplicateSlugs([])).not.toThrow();
  });

  it("passes for single note", () => {
    expect(() => assertNoDuplicateSlugs([makeNote("only-note", "only.md")])).not.toThrow();
  });
});

describe("assertNoDuplicateSlugs — 2-way collision", () => {
  it("throws DuplicateSlugError for 2 notes with the same slug", () => {
    const notes = [
      makeNote("my-note", "note-a.md"),
      makeNote("my-note", "note-b.md"),
    ];
    expect(() => assertNoDuplicateSlugs(notes)).toThrow(DuplicateSlugError);
  });

  it("error contains the colliding slug", () => {
    const notes = [
      makeNote("my-note", "note-a.md"),
      makeNote("my-note", "note-b.md"),
    ];
    try {
      assertNoDuplicateSlugs(notes);
    } catch (err) {
      expect(err).toBeInstanceOf(DuplicateSlugError);
      expect((err as DuplicateSlugError).slug).toBe("my-note");
    }
  });

  it("error contains both colliding paths", () => {
    const notes = [
      makeNote("my-note", "note-a.md"),
      makeNote("my-note", "note-b.md"),
    ];
    try {
      assertNoDuplicateSlugs(notes);
    } catch (err) {
      expect(err).toBeInstanceOf(DuplicateSlugError);
      const e = err as DuplicateSlugError;
      expect(e.paths).toContain("note-a.md");
      expect(e.paths).toContain("note-b.md");
      expect(e.paths).toHaveLength(2);
    }
  });
});

describe("assertNoDuplicateSlugs — 3-way collision (N-way)", () => {
  it("throws DuplicateSlugError for 3 notes with the same slug", () => {
    const notes = [
      makeNote("shared-slug", "note-a.md"),
      makeNote("shared-slug", "note-b.md"),
      makeNote("shared-slug", "note-c.md"),
    ];
    expect(() => assertNoDuplicateSlugs(notes)).toThrow(DuplicateSlugError);
  });

  it("error contains ALL 3 colliding paths", () => {
    const notes = [
      makeNote("shared-slug", "note-a.md"),
      makeNote("shared-slug", "note-b.md"),
      makeNote("shared-slug", "note-c.md"),
    ];
    try {
      assertNoDuplicateSlugs(notes);
    } catch (err) {
      expect(err).toBeInstanceOf(DuplicateSlugError);
      const e = err as DuplicateSlugError;
      expect(e.paths).toHaveLength(3);
      expect(e.paths).toContain("note-a.md");
      expect(e.paths).toContain("note-b.md");
      expect(e.paths).toContain("note-c.md");
    }
  });

  it("error resolutions array has same length as paths", () => {
    const notes = [
      makeNote("dup", "a.md"),
      makeNote("dup", "b.md"),
      makeNote("dup", "c.md"),
    ];
    try {
      assertNoDuplicateSlugs(notes);
    } catch (err) {
      const e = err as DuplicateSlugError;
      expect(e.resolutions).toHaveLength(e.paths.length);
    }
  });
});

describe("assertNoDuplicateSlugs — resolution tracking", () => {
  it("identifies frontmatter resolution", () => {
    // When note.frontmatter.slug === note.slug, resolution is 'frontmatter'
    const notes = [
      makeNote("custom-slug", "note-a.md", "custom-slug"),
      makeNote("custom-slug", "note-b.md", "custom-slug"),
    ];
    try {
      assertNoDuplicateSlugs(notes);
    } catch (err) {
      const e = err as DuplicateSlugError;
      // At least some should be 'frontmatter'
      expect(e.resolutions.some((r) => r === "frontmatter")).toBe(true);
    }
  });
});
