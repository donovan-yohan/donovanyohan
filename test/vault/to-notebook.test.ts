import { describe, expect, test } from "vitest";

import { notesToNotebookMonths } from "../../lib/vault/to-notebook";
import type { NotebookRow } from "../../components/lab/Notebook";
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

const occupiedUnits = (row: NotebookRow): number =>
  row.cells.reduce(
    (sum, cell) => sum + (cell.colSpan ?? 1) * (cell.rowSpan ?? 1),
    0,
  );

const assertFullRow = (row: NotebookRow): void => {
  expect(occupiedUnits(row)).toBe(row.cols * (row.rows ?? 1));
};

describe("notesToNotebookMonths", () => {
  test("packs dy-journal notes into full four-column desktop rows", () => {
    const [month] = notesToNotebookMonths([
      note({ slug: "feature", date: "2026-06-06", span: 9, image: "/vault-assets/feature/cover.png" }),
      note({ slug: "side-a", date: "2026-06-05", span: 6, image: "/vault-assets/side-a/cover.png" }),
      note({ slug: "side-b", date: "2026-06-04", span: 3, image: "/vault-assets/side-b/cover.png" }),
      note({ slug: "half-a", date: "2026-06-03", span: 8 }),
      note({ slug: "half-b", date: "2026-06-02", span: 4 }),
    ]);

    expect(month.rows).toHaveLength(2);
    expect(month.rows.map((row) => row.cols)).toEqual([4, 4]);
    month.rows.forEach(assertFullRow);

    expect(month.rows[0]).toMatchObject({
      rows: 2,
      cells: [
        { colSpan: 2, rowSpan: 2, entry: { id: "feature" } },
        { colSpan: 2, entry: { id: "side-a" } },
        { colSpan: 2, entry: { id: "side-b" } },
      ],
    });
    expect(month.rows[1].cells).toMatchObject([
      { colSpan: 2, entry: { id: "half-a" } },
      { colSpan: 2, entry: { id: "half-b" } },
    ]);
  });

  test("uses full-width and half-width fallback rows for one or two entries", () => {
    const [singleMonth] = notesToNotebookMonths([
      note({ slug: "only", date: "2026-06-01" }),
    ]);
    expect(singleMonth.rows).toHaveLength(1);
    assertFullRow(singleMonth.rows[0]);
    expect(singleMonth.rows[0].cells).toMatchObject([
      { colSpan: 4, entry: { id: "only" } },
    ]);

    const [pairMonth] = notesToNotebookMonths([
      note({ slug: "newer", date: "2026-06-02" }),
      note({ slug: "older", date: "2026-06-01" }),
    ]);
    expect(pairMonth.rows).toHaveLength(1);
    assertFullRow(pairMonth.rows[0]);
    expect(pairMonth.rows[0].cells).toMatchObject([
      { colSpan: 2, entry: { id: "newer" } },
      { colSpan: 2, entry: { id: "older" } },
    ]);
  });
});
