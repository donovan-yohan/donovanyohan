/**
 * Tests for lib/vault/slug.ts
 *
 * Covers: filename → slug derivation (P11), frontmatter slug override,
 * invalid override fallback, slug table from API_CONTRACT.md, and a
 * collision-detection helper example.
 */

import { describe, expect, it } from "vitest";
import { deriveSlug } from "../../lib/vault/slug";

// ── Collision detection helper (used in table tests) ───────────────────────

/**
 * Given a list of filenames, returns any pairs that produce the same derived
 * slug. Useful for the build-time DuplicateSlugError check.
 */
function findCollisions(filenames: string[]): [string, string, string][] {
  const seen = new Map<string, string>();
  const collisions: [string, string, string][] = [];
  for (const f of filenames) {
    const slug = deriveSlug(f);
    if (seen.has(slug)) {
      collisions.push([slug, seen.get(slug)!, f]);
    } else {
      seen.set(slug, f);
    }
  }
  return collisions;
}

describe("deriveSlug — filename → kebab-case ASCII (P11)", () => {
  // ── API_CONTRACT.md table ────────────────────────────────────────────────

  describe("slug table from API_CONTRACT.md", () => {
    it("'Hello World.md' → 'hello-world'", () => {
      expect(deriveSlug("Hello World.md")).toBe("hello-world");
    });

    it("'2026-05-10 Daily.md' → '2026-05-10-daily'", () => {
      expect(deriveSlug("2026-05-10 Daily.md")).toBe("2026-05-10-daily");
    });

    it("\"What's New?.md\" → 'whats-new'", () => {
      expect(deriveSlug("What's New?.md")).toBe("whats-new");
    });

    it("'résumé.md' → 'resume' (accent stripping)", () => {
      expect(deriveSlug("résumé.md")).toBe("resume");
    });

    it("'🚀 Launch.md' → 'launch' (emoji stripped)", () => {
      expect(deriveSlug("🚀 Launch.md")).toBe("launch");
    });

    it("'Note (draft).md' → 'note-draft' (parentheses treated as punctuation)", () => {
      expect(deriveSlug("Note (draft).md")).toBe("note-draft");
    });
  });

  // ── Extension handling ────────────────────────────────────────────────────

  it("strips the .md extension", () => {
    expect(deriveSlug("My Note.md")).toBe("my-note");
  });

  it("strips any extension, not just .md", () => {
    expect(deriveSlug("My Note.txt")).toBe("my-note");
  });

  it("strips only the last extension for multi-dot names", () => {
    // e.g. '2026.05.10.md' → '2026-05-10'
    expect(deriveSlug("2026.05.10.md")).toBe("2026-05-10");
  });

  // ── Unicode / accent stripping ────────────────────────────────────────────

  it("strips combining diacritical marks (NFD decomposition + ASCII filter)", () => {
    expect(deriveSlug("café.md")).toBe("cafe");
    expect(deriveSlug("naïve.md")).toBe("naive");
    expect(deriveSlug("über.md")).toBe("uber");
  });

  it("strips CJK characters", () => {
    // Non-ASCII removed; remaining parts slugified
    expect(deriveSlug("日本語 Note.md")).toBe("note");
  });

  it("strips emoji and non-ASCII punctuation", () => {
    expect(deriveSlug("✨ Highlights.md")).toBe("highlights");
    expect(deriveSlug("📝 Notes.md")).toBe("notes");
  });

  // ── Whitespace and punctuation ────────────────────────────────────────────

  it("collapses multiple spaces to a single dash", () => {
    expect(deriveSlug("Too   Many   Spaces.md")).toBe("too-many-spaces");
  });

  it("replaces underscores with dashes", () => {
    expect(deriveSlug("snake_case_file.md")).toBe("snake-case-file");
  });

  it("collapses multiple consecutive dashes", () => {
    expect(deriveSlug("Foo---Bar.md")).toBe("foo-bar");
  });

  it("trims leading dashes", () => {
    expect(deriveSlug("-leading.md")).toBe("leading");
  });

  it("trims trailing dashes", () => {
    expect(deriveSlug("trailing-.md")).toBe("trailing");
  });

  it("handles a filename with only non-ASCII characters", () => {
    // All characters stripped → empty string; result is '' (edge case, not thrown)
    const result = deriveSlug("🚀🔥🎉.md");
    expect(typeof result).toBe("string");
    expect(result).toBe("");
  });

  // ── Frontmatter slug override ─────────────────────────────────────────────

  it("uses frontmatter slug when valid", () => {
    expect(deriveSlug("Hello World.md", "my-custom-slug")).toBe("my-custom-slug");
  });

  it("uses frontmatter slug starting with a digit", () => {
    expect(deriveSlug("Note.md", "2026-daily")).toBe("2026-daily");
  });

  it("falls back to filename derivation when slug override is invalid — uppercase", () => {
    expect(deriveSlug("Hello World.md", "Invalid-Slug")).toBe("hello-world");
  });

  it("falls back to filename derivation when slug override has leading dash", () => {
    expect(deriveSlug("Hello World.md", "-bad")).toBe("hello-world");
  });

  it("falls back to filename derivation when slug override has trailing dash", () => {
    expect(deriveSlug("Hello World.md", "bad-")).toBe("hello-world");
  });

  it("falls back to filename derivation when slug override has spaces", () => {
    expect(deriveSlug("Hello World.md", "has spaces")).toBe("hello-world");
  });

  it("uses frontmatter slug when provided and undefined is NOT provided", () => {
    expect(deriveSlug("Hello World.md", undefined)).toBe("hello-world");
  });

  // ── Collision detection helper ────────────────────────────────────────────

  describe("collision detection helper", () => {
    it("detects no collisions in the API_CONTRACT table", () => {
      const table = [
        "Hello World.md",
        "2026-05-10 Daily.md",
        "What's New?.md",
        "résumé.md",
        "🚀 Launch.md",
        "Note (draft).md",
      ];
      // All six filenames should produce unique slugs
      const collisions = findCollisions(table);
      expect(collisions).toHaveLength(0);
    });

    it("detects a collision between files that normalize to the same slug", () => {
      const files = ["Hello World.md", "hello-world.md"];
      const collisions = findCollisions(files);
      expect(collisions).toHaveLength(1);
      expect(collisions[0][0]).toBe("hello-world");
    });

    it("detects multiple collisions in a set", () => {
      const files = [
        "café.md",      // → 'cafe'
        "cafe.md",      // → 'cafe'
        "Cafe.md",      // → 'cafe'
      ];
      const collisions = findCollisions(files);
      expect(collisions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
