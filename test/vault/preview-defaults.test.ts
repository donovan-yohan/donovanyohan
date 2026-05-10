/**
 * Tests for lib/vault/preview-defaults.ts
 *
 * Covers: default application when partial is undefined, partial override
 * of each field, passthrough of optional visual fields, and correct fallback
 * values per P12.
 */

import { describe, expect, it } from "vitest";
import { applyPreviewDefaults } from "../../lib/vault/preview-defaults";
import type { PreviewFallback } from "../../lib/vault/preview-defaults";

const FALLBACK: PreviewFallback = {
  title: "My Note Title",
  firstParagraph: "The first paragraph of the note body.",
};

describe("applyPreviewDefaults", () => {
  // ── Full defaults when partial is undefined ─────────────────────────────

  it("returns all defaults when partial is undefined", () => {
    const config = applyPreviewDefaults(undefined, FALLBACK);
    expect(config.kind).toBe("text");
    expect(config.span).toBe(4);
    expect(config.headline).toBe(FALLBACK.title);
    expect(config.excerpt).toBe(FALLBACK.firstParagraph);
  });

  it("returns all defaults when partial is an empty object", () => {
    const config = applyPreviewDefaults({}, FALLBACK);
    expect(config.kind).toBe("text");
    expect(config.span).toBe(4);
    expect(config.headline).toBe(FALLBACK.title);
    expect(config.excerpt).toBe(FALLBACK.firstParagraph);
  });

  it("does not include optional fields (accent, tint, image) when not provided", () => {
    const config = applyPreviewDefaults(undefined, FALLBACK);
    expect("accent" in config).toBe(false);
    expect("tint" in config).toBe(false);
    expect("image" in config).toBe(false);
  });

  // ── Individual field overrides ──────────────────────────────────────────

  it("uses provided kind instead of default", () => {
    const config = applyPreviewDefaults({ kind: "image" }, FALLBACK);
    expect(config.kind).toBe("image");
    expect(config.span).toBe(4); // other defaults still apply
  });

  it("uses provided span instead of default", () => {
    const config = applyPreviewDefaults({ span: 8 }, FALLBACK);
    expect(config.span).toBe(8);
    expect(config.kind).toBe("text"); // other defaults still apply
  });

  it("uses provided headline instead of fallback title", () => {
    const config = applyPreviewDefaults({ headline: "Custom Card Title" }, FALLBACK);
    expect(config.headline).toBe("Custom Card Title");
  });

  it("uses provided excerpt instead of fallback firstParagraph", () => {
    const config = applyPreviewDefaults(
      { excerpt: "A hand-written excerpt." },
      FALLBACK,
    );
    expect(config.excerpt).toBe("A hand-written excerpt.");
  });

  // ── Optional visual fields ──────────────────────────────────────────────

  it("forwards accent when provided", () => {
    const config = applyPreviewDefaults({ accent: "highlighter-yellow" }, FALLBACK);
    expect(config.accent).toBe("highlighter-yellow");
  });

  it("forwards tint when provided", () => {
    const config = applyPreviewDefaults({ tint: "light-grey" }, FALLBACK);
    expect(config.tint).toBe("light-grey");
  });

  it("forwards image when provided", () => {
    const config = applyPreviewDefaults({ image: "/img/notes/cover.png" }, FALLBACK);
    expect(config.image).toBe("/img/notes/cover.png");
  });

  it("includes all optional visual fields when all provided", () => {
    const config = applyPreviewDefaults(
      {
        kind: "image",
        span: 6,
        accent: "highlighter-yellow",
        tint: "light-grey",
        headline: "Card Title",
        excerpt: "Short blurb.",
        image: "/img/cover.png",
      },
      FALLBACK,
    );
    expect(config.kind).toBe("image");
    expect(config.span).toBe(6);
    expect(config.accent).toBe("highlighter-yellow");
    expect(config.tint).toBe("light-grey");
    expect(config.headline).toBe("Card Title");
    expect(config.excerpt).toBe("Short blurb.");
    expect(config.image).toBe("/img/cover.png");
  });

  // ── Fallback values ─────────────────────────────────────────────────────

  it("uses empty string fallback when firstParagraph is empty", () => {
    const config = applyPreviewDefaults(undefined, {
      title: "My Note",
      firstParagraph: "",
    });
    expect(config.excerpt).toBe("");
  });

  it("applies title fallback correctly for different fallback values", () => {
    const config = applyPreviewDefaults(undefined, {
      title: "A Different Title",
      firstParagraph: "Some paragraph.",
    });
    expect(config.headline).toBe("A Different Title");
    expect(config.excerpt).toBe("Some paragraph.");
  });

  // ── Return type completeness ────────────────────────────────────────────

  it("always returns an object with kind and span defined (no undefined required fields)", () => {
    const config = applyPreviewDefaults(undefined, FALLBACK);
    expect(config.kind).toBeDefined();
    expect(config.span).toBeDefined();
    expect(config.headline).toBeDefined();
    expect(config.excerpt).toBeDefined();
  });
});
