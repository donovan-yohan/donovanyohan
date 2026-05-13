/**
 * to-notebook.ts — maps the vault's public note shape into the Notebook
 * component's declarative `NotebookMonth[]` content tree.
 *
 * Pure function, no I/O. Called from page-level `getStaticProps` after
 * `getPublicNotes()` resolves, so the Notebook renders straight from the
 * vault without any client-side fetching.
 *
 * Grouping: notes are bucketed by `YYYY-MM` from frontmatter.date, then
 * each bucket becomes one NotebookMonth. Within a month, notes sort by
 * date desc and pack into rows of `DEFAULT_COLS` cells. The Notebook can
 * still receive bespoke layouts (custom rows/spans) via a future authored
 * override, but the auto layout keeps "drop a note in dy-journal → see it
 * in the bullet journal" working with zero per-note layout boilerplate.
 *
 * Entry type derivation maps `preview.kind` → Notebook EntryType:
 *   text  → essay     (uses headline + excerpt)
 *   image → photo     (uses image + caption from excerpt)
 *   quote → quote     (uses excerpt as quote text)
 *   embed → video     (uses headline + excerpt as blurb)
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

// Default packing width when the vault doesn't dictate a layout. 2-up reads
// well at the homepage scale; tighter packings (3, 4, 5) can come from
// per-row authoring overrides later.
const DEFAULT_COLS: ColsMode = 2;

// Reading speed for read-time estimates. Standard 200–250 WPM range; 220
// is a comfortable middle ground for technical prose. Result is always at
// least "1 min read" so tiny notes don't show "0 min read".
const WORDS_PER_MINUTE = 220;

const computeReadTime = (markdown: string): string => {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
};

const kindToEntryType = (kind: PreviewKind | undefined): EntryType => {
  switch (kind) {
    case "image":
      return "photo";
    case "quote":
      return "quote";
    case "embed":
      return "video";
    case "text":
    default:
      return "essay";
  }
};

const noteToEntry = (note: VaultNote, index: number): Entry => {
  const fm = note.frontmatter;
  const preview = note.preview;
  const type = kindToEntryType(preview.kind);
  const headline = preview.headline ?? fm.title;
  const excerpt = preview.excerpt ?? "";

  // Conditional spread: Next.js getStaticProps rejects `undefined` values
  // during JSON serialization, so optional visual tokens are only included
  // when set.
  const base = {
    id: note.slug,
    date: fm.date,
    index,
    ...(preview.accent !== undefined ? { accent: preview.accent } : {}),
    ...(preview.tint !== undefined ? { tint: preview.tint } : {}),
  } as const;

  if (type === "photo") {
    return {
      ...base,
      type: "photo",
      caption: excerpt || headline,
      fig: `FIG.${index.toString().padStart(2, "0")}`,
    };
  }
  if (type === "quote") {
    return { ...base, type: "quote", text: excerpt || headline };
  }
  if (type === "video") {
    return { ...base, type: "video", title: headline, blurb: excerpt };
  }
  // Default: essay-like card. Reads from preview.headline + preview.excerpt
  // (which the adapter already filled in via applyPreviewDefaults). The
  // `read` field surfaces in the card footer as the estimated read time.
  return {
    ...base,
    type: "essay",
    title: headline,
    blurb: excerpt,
    read: computeReadTime(note.bodyMarkdown),
  };
};

/**
 * Group a sorted list of public notes into NotebookMonth buckets keyed by
 * `YYYY-MM`. The output is sorted newest-month-first to match the bullet
 * journal "most recent month on top" reading order.
 */
export function notesToNotebookMonths(notes: VaultNote[]): NotebookMonth[] {
  const byKey = new Map<string, VaultNote[]>();
  for (const n of notes) {
    const [year, month] = n.frontmatter.date.split("-");
    if (!year || !month) continue;
    const key = `${year}-${month}`;
    const existing = byKey.get(key);
    if (existing) existing.push(n);
    else byKey.set(key, [n]);
  }

  const orderedKeys = Array.from(byKey.keys()).sort().reverse();
  let runningIndex = 1;

  return orderedKeys.map((key) => {
    const [year, monthNum] = key.split("-");
    const monthIdx = parseInt(monthNum, 10) - 1;
    const items = (byKey.get(key) ?? [])
      .slice()
      .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));

    const cells: NotebookCell[] = items.map((n) => ({
      entry: noteToEntry(n, runningIndex++),
    }));

    const rows: NotebookRow[] = [];
    for (let i = 0; i < cells.length; i += DEFAULT_COLS) {
      rows.push({ cols: DEFAULT_COLS, cells: cells.slice(i, i + DEFAULT_COLS) });
    }

    return {
      key,
      monthLabel: MONTH_LABELS[monthIdx] ?? monthNum,
      year,
      rows,
    };
  });
}
