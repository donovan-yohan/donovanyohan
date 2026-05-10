/**
 * test/note/NoteRenderer.test.tsx — integration tests for NoteRenderer.
 *
 * Tests:
 *   - Renders fixture note's sanitized HTML through NoteRenderer.
 *   - Component map override: overrides.blockquote replaces default.
 *   - Frontmatter render: { h2: "highlighter" } → resolved H2 uses variant=highlighter.
 *   - Internal /writing/foo link uses next/link (data-internal-vault-link present).
 *   - External link gets target="_blank" rel="noopener noreferrer".
 *   - data-slug attribute appears on the article wrapper.
 *   - data-type attribute reflects frontmatter.type (defaults to "note").
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NoteRenderer } from "../../components/note/NoteRenderer";
import type { VaultNote } from "../../lib/vault/schema";

// ── Fixture helpers ───────────────────────────────────────────────────────────

function makeNote(overrides?: Partial<VaultNote> & { frontmatterExtra?: Record<string, unknown> }): VaultNote {
  const { frontmatterExtra, ...rest } = overrides ?? {};
  return {
    slug: "test-note",
    path: "test-note.md",
    frontmatter: {
      title: "Test Note",
      date: "2026-05-10",
      visibility: "public",
      ...frontmatterExtra,
    },
    body: "<p>Hello world</p>",
    bodyMarkdown: "Hello world",
    preview: {
      kind: "text",
      span: 4,
      excerpt: "Hello world",
    },
    ...rest,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("NoteRenderer", () => {
  it("renders sanitized HTML from note.body", () => {
    const note = makeNote({ body: "<p>Hello <strong>world</strong></p>" });
    const { container } = render(<NoteRenderer note={note} />);
    expect(container.querySelector("p")).toBeTruthy();
    expect(container.querySelector("strong")).toBeTruthy();
    expect(container.querySelector("strong")?.textContent).toBe("world");
  });

  it("renders data-slug attribute on article wrapper", () => {
    const note = makeNote({ slug: "my-note" });
    const { container } = render(<NoteRenderer note={note} />);
    const article = container.querySelector("article");
    expect(article).toBeTruthy();
    expect(article?.getAttribute("data-slug")).toBe("my-note");
  });

  it("renders data-type='note' when frontmatter.type is absent", () => {
    const note = makeNote();
    const { container } = render(<NoteRenderer note={note} />);
    const article = container.querySelector("article");
    expect(article?.getAttribute("data-type")).toBe("note");
  });

  it("renders data-type from frontmatter.type when present (Phase A)", () => {
    const note = makeNote({ frontmatterExtra: { type: "work" } });
    const { container } = render(<NoteRenderer note={note} />);
    const article = container.querySelector("article");
    expect(article?.getAttribute("data-type")).toBe("work");
  });

  it("renders component map override: custom blockquote replaces default", () => {
    const note = makeNote({ body: "<blockquote><p>A quote</p></blockquote>" });
    const customQuote = () => <div data-testid="custom-quote">overridden</div>;
    const { getByTestId } = render(
      <NoteRenderer note={note} overrides={{ blockquote: customQuote }} />
    );
    expect(getByTestId("custom-quote")).toBeTruthy();
    expect(getByTestId("custom-quote").textContent).toBe("overridden");
  });

  it("frontmatter render.h2 = highlighter → h2 renders with highlighter class", () => {
    const note = makeNote({
      body: "<h2>Section heading</h2>",
      frontmatterExtra: { render: { h2: "highlighter" } },
    });
    const { container } = render(<NoteRenderer note={note} />);
    const heading = container.querySelector("h2");
    expect(heading).toBeTruthy();
    // The Heading component adds note-heading--highlighter for the highlighter variant
    expect(heading?.className).toContain("note-heading--highlighter");
  });

  it("renders an internal /writing/ link with data-internal-vault-link attribute", () => {
    const note = makeNote({ body: '<p><a href="/writing/other-note">Internal</a></p>' });
    const { container } = render(<NoteRenderer note={note} />);
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("/writing/other-note");
    expect(link?.getAttribute("data-internal-vault-link")).toBe("true");
  });

  it("renders an external link with target=_blank and rel=noopener noreferrer", () => {
    const note = makeNote({ body: '<p><a href="https://example.com">External</a></p>' });
    const { container } = render(<NoteRenderer note={note} />);
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders headings with derived id attribute", () => {
    const note = makeNote({ body: "<h2>My Section</h2>" });
    const { container } = render(<NoteRenderer note={note} />);
    const heading = container.querySelector("h2");
    expect(heading).toBeTruthy();
    // github-slugger: "My Section" → "my-section"
    expect(heading?.getAttribute("id")).toBe("my-section");
  });

  it("renders inline code with note-inline-code class", () => {
    const note = makeNote({ body: "<p><code>const x = 1</code></p>" });
    const { container } = render(<NoteRenderer note={note} />);
    const code = container.querySelector("code");
    expect(code).toBeTruthy();
    expect(code?.className).toContain("note-inline-code");
  });

  it("renders blockquote with note-blockquote class by default", () => {
    const note = makeNote({ body: "<blockquote><p>A quote</p></blockquote>" });
    const { container } = render(<NoteRenderer note={note} />);
    const quote = container.querySelector("blockquote");
    expect(quote).toBeTruthy();
    expect(quote?.className).toContain("note-blockquote");
  });

  it("frontmatter render.blockquote = pull-quote → renders PullQuote", () => {
    const note = makeNote({
      body: "<blockquote><p>A pull quote</p></blockquote>",
      frontmatterExtra: { render: { blockquote: "pull-quote" } },
    });
    const { container } = render(<NoteRenderer note={note} />);
    const quote = container.querySelector("blockquote");
    expect(quote).toBeTruthy();
    expect(quote?.className).toContain("note-pull-quote");
  });

  it("renders note body as an article element", () => {
    const note = makeNote({ body: "<p>Content</p>" });
    const { container } = render(<NoteRenderer note={note} />);
    expect(container.querySelector("article")).toBeTruthy();
  });

  it("multiple paragraphs: only first gets drop-cap when specified", () => {
    const note = makeNote({
      body: "<p>First paragraph</p><p>Second paragraph</p>",
      frontmatterExtra: { render: { "first-paragraph": "drop-cap" } },
    });
    const { container } = render(<NoteRenderer note={note} />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(2);
    // First paragraph should have drop-cap class
    expect(paragraphs[0]?.className).toContain("note-p--drop-cap");
    // Second paragraph should NOT have drop-cap class
    expect(paragraphs[1]?.className).not.toContain("note-p--drop-cap");
  });
});
