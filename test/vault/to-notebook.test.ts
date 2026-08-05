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
  imageBg?: string;
  tags?: string[];
}): VaultNote => ({
  slug: overrides.slug,
  path: `notes/writing/${overrides.slug}.md`,
  frontmatter: {
    title: overrides.slug,
    date: overrides.date ?? "2026-06-01",
    visibility: "public",
    type: overrides.type ?? "writing",
    tags: overrides.tags ?? [],
  },
  body: "<p>body</p>",
  bodyMarkdown: "body",
  preview: {
    kind: overrides.image ? "image" : "text",
    span: overrides.span ?? 3,
    headline: overrides.slug,
    excerpt: "preview excerpt",
    ...(overrides.image ? { image: overrides.image } : {}),
    ...(overrides.imageBg ? { imageBg: overrides.imageBg } : {}),
  },
});

const occupiedUnits = (row: NotebookRow): number =>
  row.cells.reduce((sum, cell) => sum + (cell.colSpan ?? 1), 0);

const assertCompleteRow = (row: NotebookRow): void => {
  expect(occupiedUnits(row)).toBe(row.cols);
};

describe("notesToNotebookMonths", () => {
  test("packs dy-journal notes chronologically into alternating 3/2 and 2/3 rows", () => {
    const [month] = notesToNotebookMonths([
      note({ slug: "recovery", date: "2026-06-06", span: 9, image: "/vault-assets/recovery/cover.png" }),
      note({ slug: "subagents", date: "2026-06-05", span: 6, image: "/vault-assets/subagents/cover.png" }),
      note({ slug: "hooks", date: "2026-06-04", span: 3, image: "/vault-assets/hooks/cover.png" }),
      note({ slug: "verification", date: "2026-06-03", span: 8 }),
      note({ slug: "filesystem", date: "2026-06-02", span: 4 }),
    ]);

    expect(month.rows.map((row) => row.cols)).toEqual([5, 5, 5]);
    expect(month.rows[0].cells).toMatchObject([
      { colSpan: 3, entry: { id: "recovery" } },
      { colSpan: 2, entry: { id: "subagents" } },
    ]);
    expect(month.rows[1].cells).toMatchObject([
      { colSpan: 2, entry: { id: "hooks" } },
      { colSpan: 3, entry: { id: "verification" } },
    ]);
    expect(month.rows[2].cells).toMatchObject([
      { colSpan: 3, entry: { id: "filesystem" } },
    ]);

    assertCompleteRow(month.rows[0]);
    assertCompleteRow(month.rows[1]);
    expect(occupiedUnits(month.rows[2])).toBeLessThan(month.rows[2].cols);
  });

  test("never makes a single card consume the full desktop grid", () => {
    const [singleMonth] = notesToNotebookMonths([
      note({ slug: "only", date: "2026-06-01" }),
    ]);
    expect(singleMonth.rows).toHaveLength(1);
    expect(singleMonth.rows[0].cols).toBe(5);
    expect(singleMonth.rows[0].cells).toMatchObject([
      { colSpan: 3, entry: { id: "only" } },
    ]);
    expect(occupiedUnits(singleMonth.rows[0])).toBeLessThan(singleMonth.rows[0].cols);

    const [pairMonth] = notesToNotebookMonths([
      note({ slug: "newer", date: "2026-06-02" }),
      note({ slug: "older", date: "2026-06-01" }),
    ]);
    expect(pairMonth.rows).toHaveLength(1);
    assertCompleteRow(pairMonth.rows[0]);
    expect(pairMonth.rows[0].cells).toMatchObject([
      { colSpan: 3, entry: { id: "newer" } },
      { colSpan: 2, entry: { id: "older" } },
    ]);
  });

  test("forwards preview image backgrounds and note tags to notebook entries", () => {
    const [month] = notesToNotebookMonths([
      note({
        slug: "transparent-png",
        image: "/vault-assets/transparent-png/cover.png",
        imageBg: "#05AC5B",
        tags: ["design", "portfolio"],
      }),
    ]);

    expect(month.rows[0].cells[0].entry).toMatchObject({
      id: "transparent-png",
      imageBg: "#05AC5B",
      tags: ["design", "portfolio"],
    });
  });
});
