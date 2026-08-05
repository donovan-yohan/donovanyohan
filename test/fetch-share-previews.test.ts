/**
 * Tests for scripts/fetch-share-previews.ts
 *
 * Strategy: exercise the pure helpers only. The script's network + sharp work
 * is operator-side and deliberately not run here — sharp is imported
 * dynamically inside the conversion step, so importing this module never
 * loads a native binding under jsdom.
 *
 * Coverage:
 *   - argument parsing (flags, --only, --timeout, error cases)
 *   - YouTube id extraction across every link shape we actually receive
 *   - og:image / twitter:image extraction + entity decoding + precedence
 *   - relative image URL resolution and non-http rejection
 *   - frontmatter surgery: insertion point, block-scalar safety, replacement
 *   - link URL + existing-image detection mirroring the blog card resolver
 */

import { describe, it, expect } from "vitest";
import { load as yamlLoad } from "js-yaml";

import {
  absolutizeUrl,
  decodeHtmlEntities,
  existingPreviewImage,
  extractMetaImage,
  parseArgs,
  readFrontmatterBlock,
  shareLinkUrl,
  withPreviewImage,
  youtubeThumbnailCandidates,
  youtubeVideoId,
} from "../scripts/fetch-share-previews.js";

describe("parseArgs", () => {
  it("requires a vault path", () => {
    const parsed = parseArgs([]);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.message).toMatch(/vault-path/);
  });

  it("defaults to a non-forcing, non-dry run", () => {
    const parsed = parseArgs(["/vault"]);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.options).toMatchObject({
        vaultPath: "/vault",
        force: false,
        dryRun: false,
        only: [],
      });
      expect(parsed.options.timeoutMs).toBeGreaterThan(0);
    }
  });

  it("accepts flags in any position and repeats --only", () => {
    const parsed = parseArgs(["--force", "--only", "pi-mono", "/vault", "--only", "hindsight"]);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.options.force).toBe(true);
      expect(parsed.options.only).toEqual(["pi-mono", "hindsight"]);
      expect(parsed.options.vaultPath).toBe("/vault");
    }
  });

  it("rejects unknown flags, dangling values, and extra positionals", () => {
    expect(parseArgs(["--nope", "/vault"]).ok).toBe(false);
    expect(parseArgs(["/vault", "--only"]).ok).toBe(false);
    expect(parseArgs(["/vault", "--timeout", "zero"]).ok).toBe(false);
    expect(parseArgs(["/vault", "--timeout", "-5"]).ok).toBe(false);
    expect(parseArgs(["/vault", "/other"]).ok).toBe(false);
  });
});

describe("youtubeVideoId", () => {
  it("reads every link shape a share note might carry", () => {
    expect(youtubeVideoId("https://youtu.be/n5f51gtuGHE")).toBe("n5f51gtuGHE");
    expect(youtubeVideoId("https://youtu.be/n5f51gtuGHE?t=120")).toBe("n5f51gtuGHE");
    expect(youtubeVideoId("https://www.youtube.com/watch?v=n5f51gtuGHE&list=x")).toBe(
      "n5f51gtuGHE"
    );
    expect(youtubeVideoId("https://m.youtube.com/watch?v=n5f51gtuGHE")).toBe("n5f51gtuGHE");
    expect(youtubeVideoId("https://www.youtube.com/embed/n5f51gtuGHE")).toBe("n5f51gtuGHE");
    expect(youtubeVideoId("https://www.youtube.com/shorts/n5f51gtuGHE")).toBe("n5f51gtuGHE");
    expect(youtubeVideoId("https://www.youtube.com/live/n5f51gtuGHE")).toBe("n5f51gtuGHE");
  });

  it("returns null for non-YouTube and malformed ids", () => {
    expect(youtubeVideoId("https://github.com/badlogic/pi-mono")).toBeNull();
    expect(youtubeVideoId("https://www.youtube.com/@thepragmaticengineer")).toBeNull();
    expect(youtubeVideoId("https://youtu.be/short")).toBeNull();
    expect(youtubeVideoId("not a url")).toBeNull();
  });

  it("orders thumbnail candidates best-quality first", () => {
    const candidates = youtubeThumbnailCandidates("n5f51gtuGHE");
    expect(candidates[0]).toBe("https://i.ytimg.com/vi/n5f51gtuGHE/maxresdefault.jpg");
    expect(candidates.at(-1)).toBe("https://i.ytimg.com/vi/n5f51gtuGHE/hqdefault.jpg");
  });
});

describe("extractMetaImage", () => {
  it("prefers og:image over twitter:image", () => {
    const html = `
      <html><head>
        <meta name="twitter:image" content="https://example.com/twitter.png">
        <meta property="og:image" content="https://example.com/og.png">
      </head></html>`;
    expect(extractMetaImage(html)).toEqual({
      url: "https://example.com/og.png",
      origin: "og:image",
    });
  });

  it("falls back to twitter:image when no og:image exists", () => {
    const html = `<meta name="twitter:image" content="https://example.com/twitter.png">`;
    expect(extractMetaImage(html)).toEqual({
      url: "https://example.com/twitter.png",
      origin: "twitter:image",
    });
  });

  it("decodes entities so query strings survive intact", () => {
    const html = `<meta property="og:image" content="https://cdn.example.com/i?w=1200&amp;h=630">`;
    expect(extractMetaImage(html)?.url).toBe("https://cdn.example.com/i?w=1200&h=630");
  });

  it("handles single-quoted and attribute-reordered tags", () => {
    const html = `<meta content='https://example.com/og.png' property='og:image' />`;
    expect(extractMetaImage(html)?.url).toBe("https://example.com/og.png");
  });

  it("returns null when the page advertises no image", () => {
    expect(extractMetaImage("<html><head><title>none</title></head></html>")).toBeNull();
    expect(extractMetaImage(`<meta property="og:image" content="  ">`)).toBeNull();
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes named and numeric references and leaves unknowns alone", () => {
    expect(decodeHtmlEntities("a&amp;b&#38;c&#x26;d")).toBe("a&b&c&d");
    expect(decodeHtmlEntities("&unknownentity;")).toBe("&unknownentity;");
  });
});

describe("absolutizeUrl", () => {
  it("resolves protocol-relative and path-relative refs against the page", () => {
    expect(absolutizeUrl("//cdn.example.com/a.png", "https://example.com/post")).toBe(
      "https://cdn.example.com/a.png"
    );
    expect(absolutizeUrl("/img/a.png", "https://example.com/blog/post")).toBe(
      "https://example.com/img/a.png"
    );
  });

  it("rejects non-http(s) schemes", () => {
    expect(absolutizeUrl("data:image/png;base64,AAAA", "https://example.com")).toBeNull();
    expect(absolutizeUrl("javascript:alert(1)", "https://example.com")).toBeNull();
  });
});

describe("readFrontmatterBlock", () => {
  it("finds the fenced YAML block", () => {
    const content = "---\ntitle: x\n---\n\nbody\n";
    const block = readFrontmatterBlock(content);
    expect(block).not.toBeNull();
    expect(block && content.slice(block.start, block.end)).toBe("\ntitle: x");
  });

  it("returns null for missing or unterminated frontmatter", () => {
    expect(readFrontmatterBlock("no frontmatter here")).toBeNull();
    expect(readFrontmatterBlock("---\ntitle: x\nstill going")).toBeNull();
  });
});

describe("withPreviewImage", () => {
  const RESHARE_YAML = [
    "",
    "title: hippo-memory",
    "slug: hippo-memory",
    "type: reshare",
    "preview:",
    "  kind: quote",
    "  span: 4",
    "  accent: orange",
    "  excerpt: |",
    "    Portable memory layer for CLI agents.",
    "    image: not-a-key-just-prose",
    "  quote: |",
    '    "Knowing what to forget."',
    "tags:",
    "  - memory",
  ].join("\n");

  it("inserts image after the scalar keys but before the first block scalar", () => {
    const updated = withPreviewImage(RESHARE_YAML, "imgs/hippo-memory-preview.webp");
    const lines = updated.split("\n");
    expect(lines.indexOf("  image: imgs/hippo-memory-preview.webp")).toBe(
      lines.indexOf("  accent: orange") + 1
    );
    expect(lines.indexOf("  image: imgs/hippo-memory-preview.webp")).toBeLessThan(
      lines.indexOf("  excerpt: |")
    );
  });

  it("leaves block-scalar bodies and sibling keys untouched", () => {
    const updated = withPreviewImage(RESHARE_YAML, "imgs/hippo-memory-preview.webp");
    expect(updated).toContain("    image: not-a-key-just-prose");
    expect(updated).toContain('    "Knowing what to forget."');
    expect(updated).toContain("tags:\n  - memory");

    const parsed = yamlLoad(updated) as Record<string, Record<string, string>>;
    expect(parsed.preview.image).toBe("imgs/hippo-memory-preview.webp");
    expect(parsed.preview.kind).toBe("quote");
    expect(parsed.preview.excerpt).toContain("image: not-a-key-just-prose");
  });

  it("replaces an existing image in place rather than duplicating it", () => {
    const once = withPreviewImage(RESHARE_YAML, "imgs/a.webp");
    const twice = withPreviewImage(once, "imgs/b.webp");
    expect(twice.match(/^ {2}image:/gm)).toHaveLength(1);
    expect(twice).toContain("  image: imgs/b.webp");
  });

  it("creates a preview block when the note has none", () => {
    const updated = withPreviewImage("\ntitle: x\ntype: reshare", "imgs/x-preview.webp");
    const parsed = yamlLoad(updated) as Record<string, Record<string, string>>;
    expect(parsed.preview.image).toBe("imgs/x-preview.webp");
  });

  it("respects a four-space preview indent", () => {
    const yaml = "\ntitle: x\npreview:\n    kind: text\n    span: 4";
    const updated = withPreviewImage(yaml, "imgs/x-preview.webp");
    expect(updated).toContain("    image: imgs/x-preview.webp");
    const parsed = yamlLoad(updated) as Record<string, Record<string, string>>;
    expect(parsed.preview.image).toBe("imgs/x-preview.webp");
  });
});

describe("shareLinkUrl / existingPreviewImage", () => {
  it("reads the nested link.url shape reshares actually use", () => {
    expect(shareLinkUrl({ link: { url: "https://youtu.be/n5f51gtuGHE", kind: "youtube" } })).toBe(
      "https://youtu.be/n5f51gtuGHE"
    );
    expect(shareLinkUrl({ link: "https://example.com" })).toBe("https://example.com");
    expect(shareLinkUrl({ sourceUrl: "https://example.com" })).toBe("https://example.com");
    expect(shareLinkUrl({})).toBeUndefined();
  });

  it("detects an already-resolved preview image", () => {
    expect(existingPreviewImage({ preview: { image: "imgs/a.webp" } })).toBe("imgs/a.webp");
    expect(existingPreviewImage({ preview: { kind: "quote" } })).toBeUndefined();
    expect(existingPreviewImage({})).toBeUndefined();
  });
});
