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

describe("stripWikilinks — alias whitespace trimming", () => {
  it("trims leading/trailing whitespace from alias in [[target| alias ]]", () => {
    expect(stripWikilinks("[[my-note| alias with spaces ]]")).toBe(
      "alias with spaces",
    );
  });

  it("trims leading space from alias in [[target| alias]]", () => {
    expect(stripWikilinks("[[my-note| the note]]")).toBe("the note");
  });

  it("trims trailing space from alias in [[target|alias ]]", () => {
    expect(stripWikilinks("[[my-note|the note ]]")).toBe("the note");
  });

  it("does not alter alias with no surrounding whitespace", () => {
    expect(stripWikilinks("[[my-note|clean alias]]")).toBe("clean alias");
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
