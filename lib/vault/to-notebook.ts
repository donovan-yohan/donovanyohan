/**
 * to-notebook.ts — maps the vault's public note shape into the Notebook
 * component's declarative `NotebookMonth[]` content tree.
 *
 * Pure function, no I/O. Called from page-level `getStaticProps` after
 * `getPublicNotes()` resolves, so the Notebook renders straight from the
 * vault without any client-side fetching.
 *
 * Grouping: notes are bucketed by `YYYY-MM` from frontmatter.date. Each
 * month renders as packed four-column grid rows. The packer uses complete
 * 4-column patterns only (single full-width, two half-width, or one 2x2
 * feature with two stacked half-width cards) so desktop rows don't leave
 * dangling empty columns on the right.
 *
 * Entry type derivation is content-type aware:
 *   writing → article card, with optional `preview.image` cover
 *   work    → case-study card, with optional preview image or banner cover
 *   note    → note/photo/quote/video based on preview kind
 *   reshare → quote/video/article based on preview kind
 */

import type {
  Entry,
  EntryType,
  NotebookCell,
  NotebookMonth,
  NotebookRow,
  ColsMode,
} from "../../components/lab/Notebook";
import type { VaultNote, PreviewKind } from "./schema";

const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

// Four columns map cleanly onto dy-journal's 1-12 `preview.span` scale:
// 1-3 = stamp, 4-6 = half-width, 7-9 = feature, 10-12 = full-width.
// Mobile CSS collapses these spans back to one column via CSS variables.
const DEFAULT_COLS: ColsMode = 4;
const WORDS_PER_MINUTE = 220;

const computeReadTime = (markdown: string): string => {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringField = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const bannerImage = (fm: VaultNote["frontmatter"]): string | undefined => {
  const banner = fm.banner;
  if (!isRecord(banner)) return undefined;
  return stringField(banner.light) ?? stringField(banner.dark);
};

const knownImageAspectRatio = (image: string | undefined): string | undefined => {
  if (!image) return undefined;
  if (/\/img\/photos\/[^/]*banner\.(png|jpe?g|webp)$/i.test(image)) return "1024 / 400";
  if (image.startsWith("/vault-assets/")) return "1376 / 768";
  return undefined;
};

const noteKindToEntryType = (kind: PreviewKind | undefined): EntryType => {
  switch (kind) {
    case "image":
      return "photo";
    case "quote":
      return "quote";
    case "embed":
      return "video";
    case "text":
    default:
      return "note";
  }
};

const reshareKindToEntryType = (kind: PreviewKind | undefined): EntryType => {
  switch (kind) {
    case "quote":
      return "quote";
    case "embed":
      return "video";
    case "image":
    case "text":
    default:
      return "essay";
  }
};

const entryTypeForNote = (note: VaultNote): EntryType => {
  switch (note.frontmatter.type) {
    case "work":
      return "caseStudy";
    case "writing":
      return "essay";
    case "reshare":
      return reshareKindToEntryType(note.preview.kind);
    case "note":
    default:
      return noteKindToEntryType(note.preview.kind);
  }
};

const noteToEntry = (note: VaultNote, index: number): Entry => {
  const fm = note.frontmatter;
  const preview = note.preview;
  const type = entryTypeForNote(note);
  const headline = preview.headline ?? fm.title;
  const excerpt = preview.excerpt ?? "";
  const image = preview.image ?? bannerImage(fm);
  const imageAspectRatio = knownImageAspectRatio(image);

  const base = {
    id: note.slug,
    date: fm.date,
    index,
    ...(preview.accent !== undefined ? { accent: preview.accent } : {}),
    ...(preview.tint !== undefined ? { tint: preview.tint } : {}),
    ...(fm.tags.length > 0 ? { tags: fm.tags } : {}),
  } as const;

  if (type === "photo") {
    return {
      ...base,
      type: "photo",
      title: headline,
      caption: excerpt || headline,
      fig: `FIG.${index.toString().padStart(2, "0")}`,
      ...(image !== undefined
        ? { image, imageAlt: headline, ...(imageAspectRatio ? { imageAspectRatio } : {}) }
        : {}),
    };
  }
  if (type === "quote") {
    return { ...base, type: "quote", text: excerpt || headline };
  }
  if (type === "video") {
    return { ...base, type: "video", title: headline, blurb: excerpt };
  }
  if (type === "note") {
    return { ...base, type: "note", text: excerpt || headline };
  }

  const articleType: "essay" | "caseStudy" | "project" | "mixed" =
    type === "caseStudy" || type === "project" || type === "mixed" ? type : "essay";

  return {
    ...base,
    type: articleType,
    title: headline,
    blurb: excerpt,
    read: computeReadTime(note.bodyMarkdown),
    ...(image !== undefined
      ? { image, imageAlt: headline, ...(imageAspectRatio ? { imageAspectRatio } : {}) }
      : {}),
  };
};

const packedCell = (
  cell: NotebookCell,
  colSpan?: number,
  rowSpan?: number,
): NotebookCell => ({
  entry: cell.entry,
  ...(colSpan !== undefined && colSpan > 1 ? { colSpan } : {}),
  ...(rowSpan !== undefined && rowSpan > 1 ? { rowSpan } : {}),
});

const rowsForCells = (cells: NotebookCell[]): NotebookRow[] => {
  const rows: NotebookRow[] = [];

  for (let i = 0; i < cells.length;) {
    const remaining = cells.length - i;

    if (remaining === 1) {
      rows.push({ cols: DEFAULT_COLS, cells: [packedCell(cells[i], DEFAULT_COLS)] });
      i += 1;
      continue;
    }

    if (remaining === 2) {
      rows.push({
        cols: DEFAULT_COLS,
        cells: [packedCell(cells[i], 2), packedCell(cells[i + 1], 2)],
      });
      i += 2;
      continue;
    }

    rows.push({
      cols: DEFAULT_COLS,
      rows: 2,
      cells: [
        packedCell(cells[i], 2, 2),
        packedCell(cells[i + 1], 2),
        packedCell(cells[i + 2], 2),
      ],
    });
    i += 3;
  }

  return rows;
};

const cellForNote = (note: VaultNote, index: number): NotebookCell => {
  return { entry: noteToEntry(note, index) };
};

export function notesToNotebookMonths(notes: VaultNote[]): NotebookMonth[] {
  const valid: VaultNote[] = [];
  for (const n of notes) {
    const date = n.frontmatter.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `notesToNotebookMonths: skipping note "${n.slug}" with malformed date "${date}"`,
        );
      }
      continue;
    }
    valid.push(n);
  }

  const indexBySlug = new Map<string, number>();
  [...valid]
    .sort((a, b) => {
      const cmp = a.frontmatter.date.localeCompare(b.frontmatter.date);
      return cmp !== 0 ? cmp : a.slug.localeCompare(b.slug);
    })
    .forEach((n, i) => indexBySlug.set(n.slug, i + 1));

  const byKey = new Map<string, VaultNote[]>();
  for (const n of valid) {
    const [year, month] = n.frontmatter.date.split("-");
    const key = `${year}-${month}`;
    const existing = byKey.get(key);
    if (existing) existing.push(n);
    else byKey.set(key, [n]);
  }

  const orderedKeys = Array.from(byKey.keys()).sort().reverse();

  return orderedKeys.map((key) => {
    const [year, monthNum] = key.split("-");
    const monthIdx = parseInt(monthNum, 10) - 1;
    const items = (byKey.get(key) ?? [])
      .slice()
      .sort((a, b) => {
        const dateCmp = b.frontmatter.date.localeCompare(a.frontmatter.date);
        return dateCmp !== 0 ? dateCmp : a.slug.localeCompare(b.slug);
      });

    const cells: NotebookCell[] = items.map((n) =>
      cellForNote(n, indexBySlug.get(n.slug) ?? 0),
    );
    const rows = rowsForCells(cells);

    return {
      key,
      monthLabel: MONTH_LABELS[monthIdx] ?? monthNum,
      year,
      rows,
    };
  });
}
