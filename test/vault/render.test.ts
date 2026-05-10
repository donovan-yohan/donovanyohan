/**
 * Tests for lib/vault/render.ts
 *
 * Covers: HTML sanitization (P19), wikilink stripping (P18), GFM features,
 * code fence preservation, empty body edge case.
 */

import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../../lib/vault/render";

describe("renderMarkdown", () => {
  // ── HTML sanitization (P19) ───────────────────────────────────────────────

  it("strips <script> tags from body", async () => {
    const html = await renderMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
  });

  it("strips <iframe>, <object>, and onclick attributes", async () => {
    const html = await renderMarkdown(
      `<iframe src="https://evil.com"></iframe>\n<object data="file.swf"></object>\n<p onclick="doEvil()">click me</p>`,
    );
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<object");
    expect(html).not.toContain("onclick");
  });

  // ── GFM markdown features ─────────────────────────────────────────────────

  it("renders headings h1–h6", async () => {
    const md = `# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6`;
    const html = await renderMarkdown(md);
    expect(html).toContain("<h1>");
    expect(html).toContain("<h2>");
    expect(html).toContain("<h3>");
    expect(html).toContain("<h4>");
    expect(html).toContain("<h5>");
    expect(html).toContain("<h6>");
  });

  it("renders unordered and ordered lists", async () => {
    const md = `- item one\n- item two\n\n1. first\n2. second`;
    const html = await renderMarkdown(md);
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>");
  });

  it("renders GFM tables", async () => {
    const md = `| A | B |\n| - | - |\n| 1 | 2 |`;
    const html = await renderMarkdown(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
    expect(html).toContain("<td>");
  });

  it("renders fenced code blocks", async () => {
    const md = "```js\nconst x = 1;\n```";
    const html = await renderMarkdown(md);
    expect(html).toContain("<code");
    expect(html).toContain("const x = 1;");
  });

  it("renders inline code", async () => {
    const md = "Use `const x = 1` here.";
    const html = await renderMarkdown(md);
    expect(html).toContain("<code>");
    expect(html).toContain("const x = 1");
  });

  it("renders links", async () => {
    const html = await renderMarkdown("[example](https://example.com)");
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain("example");
  });

  it("renders bold and italic", async () => {
    const html = await renderMarkdown("**bold** and _italic_");
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
  });

  // ── Wikilink stripping (P18) ──────────────────────────────────────────────

  it("strips [[note]] to plain text 'note', no link, no brackets", async () => {
    const html = await renderMarkdown("See [[other-note]] for details.");
    expect(html).toContain("other-note");
    expect(html).not.toContain("[[");
    expect(html).not.toContain("]]");
    // Must not be a hyperlink
    expect(html).not.toMatch(/<a[^>]*>other-note<\/a>/);
  });

  it("strips [[a|b]] to alias text 'b'", async () => {
    const html = await renderMarkdown("See [[a|b]] for details.");
    expect(html).toContain("b");
    expect(html).not.toContain("[[");
    // The target 'a' on its own should not appear as a bare wikilink artifact
    expect(html).not.toContain("[[a");
  });

  it("strips [[a#h]] to target text 'a' (heading stripped)", async () => {
    const html = await renderMarkdown("See [[a#heading-section]] for info.");
    expect(html).toContain("a");
    expect(html).not.toContain("[[");
    expect(html).not.toContain("heading-section");
  });

  it("strips [[a^id]] to target text 'a' (block id stripped)", async () => {
    const html = await renderMarkdown("Ref [[a^block-id]] here.");
    expect(html).toContain("a");
    expect(html).not.toContain("[[");
    expect(html).not.toContain("block-id");
  });

  it("strips ![[image.png]] entirely — no 'image.png' in output, no <img>", async () => {
    const html = await renderMarkdown("Here is ![[image.png]] embedded.");
    expect(html).not.toContain("image.png");
    expect(html).not.toContain("<img");
  });

  // ── Code fence / inline code preservation ────────────────────────────────

  it("preserves [[in-code-fence]] literally inside a fenced code block", async () => {
    const md = "```\n[[in-code-fence]]\n```";
    const html = await renderMarkdown(md);
    expect(html).toContain("[[in-code-fence]]");
  });

  it("preserves [[inline]] literally inside inline code", async () => {
    const md = "Use `[[inline]]` syntax.";
    const html = await renderMarkdown(md);
    expect(html).toContain("[[inline]]");
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it("returns empty string for empty body without crashing", async () => {
    const html = await renderMarkdown("");
    expect(html).toBe("");
  });

  it("returns empty string for whitespace-only body", async () => {
    const html = await renderMarkdown("   \n  ");
    expect(html).toBe("");
  });

  // ── Regressions / bot review fixes ────────────────────────────────────────

  it("text containing ONLY a stripped embed produces no text node leak (gemini #43)", async () => {
    // Regression: previously, a text node containing only `![[image.png]]`
    // would have results.length === 0 and the original raw wikilink would be
    // pushed back as a fallback. Now: matched flag tracks the strip; result
    // is empty (the text node disappears entirely).
    const html = await renderMarkdown("![[image.png]]");
    expect(html).not.toContain("[[");
    expect(html).not.toContain("image.png");
  });

  it("strips known-leaking inline HTML the spec promises (rehype-raw + sanitize)", async () => {
    // Without rehype-raw, remark-rehype defaults silently DROP raw HTML before
    // sanitize runs — meaning <script>alert(1)</script> would not be in the
    // output but ALSO would not be inspected by the sanitizer. With rehype-raw,
    // raw HTML reaches sanitize as actual hast nodes and is pruned by schema.
    // This test is the proof. (copilot #43)
    const html = await renderMarkdown(
      "<p>safe text</p><script>alert(1)</script><span onmouseover='evil()'>x</span>",
    );
    expect(html).toContain("safe text");
    expect(html).toContain("<p>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onmouseover");
    expect(html).not.toContain("alert(1)");
    expect(html).not.toContain("evil()");
  });

  it("renders concurrently without cross-call regex state corruption", async () => {
    // Per-call RegExp instance prevents shared lastIndex mutation under
    // concurrent renderMarkdown calls. (gemini + copilot #43)
    const inputs = [
      "[[a]] one",
      "[[b|alias]] two",
      "[[c#h]] three",
      "[[d^id]] four",
      "![[e.png]] five",
      "plain six",
    ];
    const results = await Promise.all(inputs.map((s) => renderMarkdown(s)));
    expect(results[0]).toContain("a one");
    expect(results[1]).toContain("alias two");
    expect(results[2]).toContain("c three");
    expect(results[3]).toContain("d four");
    expect(results[4]).toContain("five");
    expect(results[4]).not.toContain("e.png");
    expect(results[5]).toContain("plain six");
  });
});
