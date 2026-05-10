/**
 * Tests for lib/vault/schema.ts
 *
 * Covers: VaultFrontmatterSchema parse/reject, date coercion (P24),
 * visibility default, passthrough of extra keys, slug validation,
 * preview sub-schema.
 */

import { describe, expect, it } from "vitest";
import { VaultFrontmatterSchema } from "../../lib/vault/schema";

const VALID_BASE = {
  title: "Hello World",
  date: "2026-05-10",
  visibility: "public",
} as const;

describe("VaultFrontmatterSchema", () => {
  describe("valid inputs", () => {
    it("parses a minimal valid note", () => {
      const result = VaultFrontmatterSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.title).toBe("Hello World");
      expect(result.data.date).toBe("2026-05-10");
      expect(result.data.visibility).toBe("public");
    });

    it("parses a note with all optional fields", () => {
      const result = VaultFrontmatterSchema.safeParse({
        ...VALID_BASE,
        slug: "hello-world",
        preview: {
          kind: "image",
          span: 6,
          accent: "highlighter-yellow",
          tint: "light-grey",
          headline: "Custom headline",
          excerpt: "Custom excerpt",
          image: "/img/notes/cover.png",
        },
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.slug).toBe("hello-world");
      expect(result.data.preview?.kind).toBe("image");
      expect(result.data.preview?.span).toBe(6);
    });

    it("preserves extra frontmatter keys via passthrough (P passthrough)", () => {
      const result = VaultFrontmatterSchema.safeParse({
        ...VALID_BASE,
        mood: "focused",
        weather: "sunny",
        tags: ["writing", "daily"],
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect((result.data as Record<string, unknown>)["mood"]).toBe("focused");
      expect((result.data as Record<string, unknown>)["weather"]).toBe("sunny");
      expect((result.data as Record<string, unknown>)["tags"]).toEqual([
        "writing",
        "daily",
      ]);
    });
  });

  describe("visibility default (P10)", () => {
    it("defaults visibility to 'private' when omitted", () => {
      const result = VaultFrontmatterSchema.safeParse({
        title: "A Note",
        date: "2026-05-10",
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.visibility).toBe("private");
    });

    it("accepts explicit 'private' visibility", () => {
      const result = VaultFrontmatterSchema.safeParse({
        ...VALID_BASE,
        visibility: "private",
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.visibility).toBe("private");
    });

    it("rejects invalid visibility values", () => {
      expect(
        VaultFrontmatterSchema.safeParse({ ...VALID_BASE, visibility: "PUBLIC" }).success,
      ).toBe(false);
      expect(
        VaultFrontmatterSchema.safeParse({ ...VALID_BASE, visibility: "draft" }).success,
      ).toBe(false);
      expect(
        VaultFrontmatterSchema.safeParse({ ...VALID_BASE, visibility: 42 }).success,
      ).toBe(false);
    });
  });

  describe("date coercion (P24)", () => {
    it("accepts a string date in YYYY-MM-DD format", () => {
      const result = VaultFrontmatterSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.date).toBe("2026-05-10");
    });

    it("coerces a JS Date object to YYYY-MM-DD string (P24)", () => {
      const result = VaultFrontmatterSchema.safeParse({
        ...VALID_BASE,
        date: new Date("2026-05-10"),
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.date).toBe("2026-05-10");
    });

    it("rejects a non-date string", () => {
      const result = VaultFrontmatterSchema.safeParse({
        ...VALID_BASE,
        date: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a numeric timestamp", () => {
      const result = VaultFrontmatterSchema.safeParse({
        ...VALID_BASE,
        date: 1746921600000,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a null date", () => {
      const result = VaultFrontmatterSchema.safeParse({
        ...VALID_BASE,
        date: null,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("title validation", () => {
    it("rejects empty title", () => {
      const result = VaultFrontmatterSchema.safeParse({
        ...VALID_BASE,
        title: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing title", () => {
      const result = VaultFrontmatterSchema.safeParse({
        date: VALID_BASE.date,
        visibility: VALID_BASE.visibility,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("optional slug validation", () => {
    it("accepts valid kebab-case slugs", () => {
      for (const slug of ["hello", "hello-world", "2026-05-10-daily", "a1b2"]) {
        const result = VaultFrontmatterSchema.safeParse({ ...VALID_BASE, slug });
        expect(result.success, `slug '${slug}' should be valid`).toBe(true);
      }
    });

    it("rejects invalid slugs", () => {
      for (const slug of ["-start", "Has-Capitals", "with space", "trail-"]) {
        const result = VaultFrontmatterSchema.safeParse({ ...VALID_BASE, slug });
        expect(result.success, `slug '${slug}' should be invalid`).toBe(false);
      }
    });

    it("allows slug to be omitted", () => {
      const result = VaultFrontmatterSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.slug).toBeUndefined();
    });
  });

  describe("preview sub-schema", () => {
    it("accepts partial preview with only kind", () => {
      const result = VaultFrontmatterSchema.safeParse({
        ...VALID_BASE,
        preview: { kind: "quote" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid kind value", () => {
      const result = VaultFrontmatterSchema.safeParse({
        ...VALID_BASE,
        preview: { kind: "video" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects span out of 1-12 range", () => {
      expect(
        VaultFrontmatterSchema.safeParse({ ...VALID_BASE, preview: { span: 0 } }).success,
      ).toBe(false);
      expect(
        VaultFrontmatterSchema.safeParse({ ...VALID_BASE, preview: { span: 13 } }).success,
      ).toBe(false);
    });

    it("accepts span at boundaries", () => {
      expect(
        VaultFrontmatterSchema.safeParse({ ...VALID_BASE, preview: { span: 1 } }).success,
      ).toBe(true);
      expect(
        VaultFrontmatterSchema.safeParse({ ...VALID_BASE, preview: { span: 12 } }).success,
      ).toBe(true);
    });
  });
});
