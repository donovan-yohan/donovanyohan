/**
 * wikilinks.test.ts — Obsidian wikilink stripping tests (P18).
 *
 * Covers all 7 wikilink forms + code fence preservation.
 */

import { describe, it, expect } from "vitest";
import { stripWikilinks } from "../../lib/vault/wikilinks";

describe("stripWikilinks — basic forms", () => {
  it("strips [[note]] to note", () => {
    expect(stripWikilinks("See [[my-note]] for details.")).toBe(
      "See my-note for details.",
    );
  });

  it("strips [[note|alias]] to alias", () => {
    expect(stripWikilinks("See [[my-note|the first post]] for details.")).toBe(
      "See the first post for details.",
    );
  });

  it("strips [[note#heading]] to note (drops heading)", () => {
    expect(stripWikilinks("Go to [[my-note#introduction]].")).toBe(
      "Go to my-note.",
    );
  });

  it("strips [[note^block-id]] to note (drops block ref)", () => {
    expect(stripWikilinks("See [[my-note^abc123]].")).toBe("See my-note.");
  });

  it("strips [[note#heading|alias]] to alias", () => {
    expect(stripWikilinks("Read [[my-note#intro|the intro]].")).toBe(
      "Read the intro.",
    );
  });

  it("strips [[note^id|alias]] to alias", () => {
    expect(stripWikilinks("See [[my-note^ref|this block]].")).toBe(
      "See this block.",
    );
  });

  it("strips ![[embed]] entirely (empty string, not the target name)", () => {
    expect(stripWikilinks("Before ![[private-asset.png]] after.")).toBe(
      "Before  after.",
    );
  });

  it("strips ![[note-embed]] entirely (not the note name)", () => {
    expect(stripWikilinks("![[private-note]]")).toBe("");
  });
});

describe("stripWikilinks — multiple wikilinks in one string", () => {
  it("strips multiple wikilinks", () => {
    const input =
      "See [[note-a]] and [[note-b|second]] and ![[image.png]] done.";
    expect(stripWikilinks(input)).toBe("See note-a and second and  done.");
  });
});

describe("stripWikilinks — code fence preservation (plain string)", () => {
  it("does NOT modify wikilinks inside backtick strings (raw string level)", () => {
    // Note: stripWikilinks() operates on the raw string. It does not understand
    // code fences. The remark plugin (remarkStripWikilinks) handles code fence
    // skipping at the AST level. This test verifies stripWikilinks() behavior.
    const input = "`[[inline-code]]`";
    // Raw string replace will touch this — that's by design for the raw helper.
    // The remark plugin skips it. We document this distinction here.
    const result = stripWikilinks(input);
    // The raw helper converts it (expected behavior for lint/scripts)
    expect(result).toBe("`inline-code`");
  });

  it("preserves content in triple-backtick blocks when processed via remark (remark plugin)", async () => {
    // Test the remark plugin integration to verify code fences are skipped
    const { unified } = await import("unified");
    const remarkParse = (await import("remark-parse")).default;
    const remarkStringify = (await import("remark-stringify")).default;
    const { remarkStripWikilinks } = await import("../../lib/vault/wikilinks");

    const markdown = "```\n[[this-is-code]]\n```\n\n[[this-is-not-code]]";

    const result = await unified()
      .use(remarkParse)
      .use(remarkStripWikilinks)
      .use(remarkStringify)
      .process(markdown);

    const output = String(result);

    // Code fence content is preserved literal
    expect(output).toContain("[[this-is-code]]");
    // Non-code wikilink is stripped
    expect(output).not.toContain("[[this-is-not-code]]");
    expect(output).toContain("this-is-not-code");
  });
});

describe("stripWikilinks — edge cases", () => {
  it("handles empty string", () => {
    expect(stripWikilinks("")).toBe("");
  });

  it("handles string with no wikilinks", () => {
    expect(stripWikilinks("Hello world.")).toBe("Hello world.");
  });

  it("strips note with spaces in target", () => {
    expect(stripWikilinks("[[My Note With Spaces]]")).toBe(
      "My Note With Spaces",
    );
  });
});

// ── Resolve-mode plugin (P31) ─────────────────────────────────────────────────

/**
 * Helper: runs a markdown string through a unified pipeline using the
 * supplied wikilink plugin. Returns serialized HTML so tests can assert on
 * anchor presence / absence directly.
 */
async function renderWithPlugin(
  markdown: string,
  plugin: ReturnType<
    typeof import("../../lib/vault/wikilinks").createWikilinkPlugin
  >,
): Promise<string> {
  const { unified } = await import("unified");
  const remarkParse = (await import("remark-parse")).default;
  const remarkRehype = (await import("remark-rehype")).default;
  const rehypeStringify = (await import("rehype-stringify")).default;

  const result = await unified()
    .use(remarkParse)
    .use(plugin)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}

describe("createWikilinkPlugin — resolve mode", () => {
  it("emits an anchor when the target slug is in publicSlugs", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(["hello-world"]),
      privateSlugs: new Set(),
      sourcePath: "notes/source.md",
    });
    const html = await renderWithPlugin("See [[hello-world]] here.", plugin);
    expect(html).toContain('<a href="/work/hello-world">hello-world</a>');
  });

  it("uses the alias as anchor text when [[target|alias]] is given", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(["hello-world"]),
      privateSlugs: new Set(),
      sourcePath: "notes/source.md",
    });
    const html = await renderWithPlugin(
      "See [[hello-world|the first post]].",
      plugin,
    );
    expect(html).toContain(
      '<a href="/work/hello-world">the first post</a>',
    );
  });

  it("ignores #heading and ^block-id in the URL (display target only)", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(["hello-world"]),
      privateSlugs: new Set(),
      sourcePath: "notes/source.md",
    });
    const html = await renderWithPlugin(
      "See [[hello-world#intro|alias]] and [[hello-world^ref]].",
      plugin,
    );
    expect(html).toContain('<a href="/work/hello-world">alias</a>');
    expect(html).toContain('<a href="/work/hello-world">hello-world</a>');
  });

  it("falls back to plain text when the target slug is unresolved", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(["hello-world"]),
      privateSlugs: new Set(),
      sourcePath: "notes/source.md",
    });
    const html = await renderWithPlugin("See [[orphan-target]].", plugin);
    expect(html).toContain("orphan-target");
    expect(html).not.toContain("<a");
  });

  it("strips embeds entirely (![[asset]]) — never resolves them", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(["hello-world"]),
      privateSlugs: new Set(),
      sourcePath: "notes/source.md",
    });
    // Even if hello-world were public, embeds are dropped — no asset name leak.
    const html = await renderWithPlugin("Before ![[hello-world]] after.", plugin);
    expect(html).not.toContain("hello-world");
    expect(html).not.toContain("<a");
    expect(html).toContain("Before");
    expect(html).toContain("after");
  });

  it("throws WikilinkLeakError when the target resolves to a private slug", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const { WikilinkLeakError } = await import("../../lib/vault/errors");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(),
      privateSlugs: new Set(["secret-note"]),
      sourcePath: "notes/source.md",
    });
    await expect(
      renderWithPlugin("See [[secret-note]].", plugin),
    ).rejects.toBeInstanceOf(WikilinkLeakError);
  });

  it("WikilinkLeakError carries sourcePath, target, and privateSlug", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const { WikilinkLeakError } = await import("../../lib/vault/errors");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(),
      privateSlugs: new Set(["secret-note"]),
      sourcePath: "notes/source.md",
    });

    let caught: unknown;
    try {
      await renderWithPlugin("See [[Secret Note]].", plugin);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(WikilinkLeakError);
    const leak = caught as InstanceType<typeof WikilinkLeakError>;
    expect(leak.sourcePath).toBe("notes/source.md");
    expect(leak.target).toBe("Secret Note");
    expect(leak.privateSlug).toBe("secret-note");
  });

  it("private-target check fires even when the same slug is also in publicSlugs (private wins)", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const { WikilinkLeakError } = await import("../../lib/vault/errors");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(["secret-note"]),
      privateSlugs: new Set(["secret-note"]),
      sourcePath: "notes/source.md",
    });
    await expect(
      renderWithPlugin("See [[secret-note]].", plugin),
    ).rejects.toBeInstanceOf(WikilinkLeakError);
  });

  it("normalizes target via filename slug rules ([[Hello World]] → hello-world)", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(["hello-world"]),
      privateSlugs: new Set(),
      sourcePath: "notes/source.md",
    });
    const html = await renderWithPlugin("See [[Hello World]].", plugin);
    expect(html).toContain('<a href="/work/hello-world">Hello World</a>');
  });

  it("does not resolve wikilinks inside code fences", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(["hello-world"]),
      privateSlugs: new Set(["secret-note"]),
      sourcePath: "notes/source.md",
    });
    const md = "```\n[[hello-world]] and [[secret-note]]\n```";
    // No throw despite secret-note being private — code fence is exempt.
    const html = await renderWithPlugin(md, plugin);
    expect(html).toContain("[[hello-world]]");
    expect(html).toContain("[[secret-note]]");
  });

  it("respects hrefPrefix override", async () => {
    const { createWikilinkPlugin } = await import("../../lib/vault/wikilinks");
    const plugin = createWikilinkPlugin({
      publicSlugs: new Set(["hello-world"]),
      privateSlugs: new Set(),
      sourcePath: "notes/source.md",
      hrefPrefix: "/notes",
    });
    const html = await renderWithPlugin("See [[hello-world]].", plugin);
    expect(html).toContain('<a href="/notes/hello-world">hello-world</a>');
  });
});
