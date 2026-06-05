import { describe, expect, test } from "vitest";

import { notesToNotebookMonths } from "../../lib/vault/to-notebook";
import type { VaultNote } from "../../lib/vault/schema";

const note = (overrides: {
  slug: string;
  date?: string;
  type?: VaultNote["frontmatter"]["type"];
  span?: number;
  image?: string;
}): VaultNote => ({
  slug: overrides.slug,
  path: `notes/writing/${overrides.slug}.md`,
  frontmatter: {
    title: overrides.slug,
    date: overrides.date ?? "2026-06-01",
    visibility: "public",
    type: overrides.type ?? "writing",
    tags: [],
  },
  body: "<p>body</p>",
  bodyMarkdown: "body",
  preview: {
    kind: overrides.image ? "image" : "text",
    span: overrides.span ?? 3,
    headline: overrides.slug,
    excerpt: "preview excerpt",
    ...(overrides.image ? { image: overrides.image } : {}),
  },
});

describe("notesToNotebookMonths", () => {
  test("maps dy-journal preview spans onto a four-column desktop notebook grid", () => {
    const [month] = notesToNotebookMonths([
      note({ slug: "hero", span: 9, image: "/vault-assets/hero/cover.png" }),
      note({ slug: "wide", span: 6 }),
      note({ slug: "stamp", span: 3 }),
    ]);

    expect(month.rows).toHaveLength(1);
    expect(month.rows[0].cols).toBe(4);
    expect(month.rows[0].cells.map((cell) => cell.entry.id)).toEqual([
      "hero",
      "stamp",
      "wide",
    ]);
    expect(month.rows[0].cells[0]).toMatchObject({ colSpan: 3, rowSpan: 2 });
    expect(month.rows[0].cells[1].colSpan).toBeUndefined();
    expect(month.rows[0].cells[2]).toMatchObject({ colSpan: 2 });
  });
});
