import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { HiSpan, type HiSlot } from "../Highlighter";
import { Box, Card, Grid, MarginAnchor, Stack } from "./system";

// =============================================================================
// AUTHORING GUIDE — for agents writing notebook entries
// =============================================================================
//
// NOTEBOOK is an ordered list of months, newest first.
// Each month groups rows. Each row picks a base column count: 2 | 3 | 4 | 5.
// Cells inside a row can colSpan or rowSpan within that base.
//
// Sizing rules — write content TO FIT the row density (don't resize the grid):
//   - 2-up rows: hero essays + photos. Title up to ~60 chars. Blurb 1–3 sentences.
//   - 3-up rows: short essays / photos / quotes. Title up to ~40 chars. Blurb 1 sentence.
//   - 4-up rows: notes / links / mini-photos. One short line per card. Title <= 30 chars.
//   - 5-up rows: "stamps." Note text or link label only. Single short phrase.
//
// Multi-row blocks: set row.rows = 2 (or 3) plus rowSpan/colSpan on cells to
// build feature blocks. Common pattern: cols:3 rows:2 with one cell rowSpan:2
// (tall feature on the left), and the remaining 4 grid spots filled by smaller
// cells. Cells with colSpan: cols (full width) make a single-card row.
//
// Always pick a column count that the content fills cleanly. If a card looks
// half-empty, swap to a denser column count or shorter content.
// =============================================================================

export type EntryType =
  | "essay"
  | "project"
  | "caseStudy"
  | "note"
  | "photo"
  | "quote"
  | "link"
  | "video"
  | "list"
  | "gallery"
  | "mixed";

interface BaseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  index: number;
  type: EntryType;
  accent?: string;
  tint?: string;
  meta?: string;
}

interface EssayLike extends BaseEntry {
  type: "essay" | "project" | "caseStudy" | "mixed";
  title: string;
  blurb?: string;
  read?: string;
}

interface NoteEntry extends BaseEntry {
  type: "note";
  text: string;
}

interface PhotoEntry extends BaseEntry {
  type: "photo" | "gallery";
  caption: string;
  fig: string;
  swatches?: string[];
}

interface QuoteEntry extends BaseEntry {
  type: "quote";
  text: string;
  attribution?: string;
}

interface LinkEntry extends BaseEntry {
  type: "link";
  label: string;
  url: string;
}

interface VideoEntry extends BaseEntry {
  type: "video";
  title: string;
  duration?: string;
  blurb?: string;
}

interface ListEntry extends BaseEntry {
  type: "list";
  title: string;
  items: { text: string; done?: boolean }[];
}

export type Entry =
  | EssayLike
  | NoteEntry
  | PhotoEntry
  | QuoteEntry
  | LinkEntry
  | VideoEntry
  | ListEntry;

/**
 * Caller-supplied resolver that turns an entry into a clickable URL.
 * Returns null to leave the card non-interactive (lab page mocks, notes
 * without detail routes, etc.). Threaded through Month/Row → EntryCard.
 */
export type CardHrefBuilder = (entry: Entry) => string | null;

// Notebook layout primitives -------------------------------------------------

export type ColsMode = 2 | 3 | 4 | 5;

export interface NotebookCell {
  entry: Entry;
  colSpan?: number; // default 1
  rowSpan?: number; // default 1
}

export interface NotebookRow {
  cols: ColsMode;
  rows?: number; // sub-rows within this block, default 1
  cells: NotebookCell[];
}

export interface NotebookMonth {
  key: string;
  monthLabel: string;
  year: string;
  rows: NotebookRow[];
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const TYPE_LABEL: Record<EntryType, string> = {
  essay: "essay",
  project: "project",
  caseStudy: "case study",
  note: "note",
  photo: "photo",
  quote: "quote",
  link: "link",
  video: "video",
  list: "list",
  gallery: "gallery",
  mixed: "mixed",
};

const TYPE_GLYPH: Record<EntryType, string> = {
  essay: "▤",
  project: "▣",
  caseStudy: "◫",
  note: "·",
  photo: "▦",
  quote: "❝",
  link: "↳",
  video: "▶",
  list: "▤",
  gallery: "▥",
  mixed: "✦",
};

// Entries — building blocks referenced from NOTEBOOK rows.
const E = {
  agentsLoop: {
    id: "agents-loop",
    date: "2026-05-09",
    index: 1,
    type: "essay",
    accent: "#FFE96B",
    title: "What I've learned shipping with agents in the loop.",
    blurb:
      "A working journal — half portfolio, half lab notebook — for what I learn while shipping with agents in the loop.",
    read: "7 min",
  } as EssayLike,
  studioMay: {
    id: "studio-may",
    date: "2026-05-08",
    index: 4,
    type: "photo",
    fig: "fig 1",
    caption: "Studio in May. Two windows open, one ceiling fan, one cat.",
    swatches: ["#c8b89a", "#9ba78c", "#5a4a3a"],
  } as PhotoEntry,
  kettleNote: {
    id: "kettle-note",
    date: "2026-05-07",
    index: 2,
    type: "note",
    text: "The kettle whistle is a g sharp.",
  } as NoteEntry,
  saulBass: {
    id: "saul-bass",
    date: "2026-05-04",
    index: 3,
    type: "link",
    label: "fontsinuse · saul bass",
    url: "fontsinuse.com/saul-bass",
  } as LinkEntry,
  teaTemp: {
    id: "tea-temp",
    date: "2026-05-03",
    index: 17,
    type: "note",
    text: "Tea temp matters more than steep time.",
  } as NoteEntry,
  ycLink: {
    id: "yc-link",
    date: "2026-05-01",
    index: 18,
    type: "link",
    label: "ycombinator · 2026 batch",
    url: "ycombinator.com/companies",
  } as LinkEntry,
  iridescent: {
    id: "iridescent",
    date: "2026-04-28",
    index: 5,
    type: "project",
    accent: "#A8C2FF",
    title: "Iridescent — a generative swatch tool.",
    blurb: "Pick a base, get 12 colour-paired ramps. Built in a weekend, kept for a year.",
    meta: "project · launched",
  } as EssayLike,
  stopTests: {
    id: "stop-tests",
    date: "2026-04-22",
    index: 6,
    type: "essay",
    title: "Why I stopped writing tests first.",
    blurb:
      "After a year of test-first I switched. Tests are still there — they just arrive in a different order, and they're better for it.",
    read: "4 min",
  } as EssayLike,
  barthesQuote: {
    id: "barthes-quote",
    date: "2026-04-18",
    index: 7,
    type: "quote",
    text: "A diary is the daily practice of becoming a stranger to yourself.",
    attribution: "barthes",
  } as QuoteEntry,
  harness200: {
    id: "harness-200",
    date: "2026-04-14",
    index: 8,
    type: "project",
    accent: "#A99BE3",
    title: "Building a tiny harness in 200 lines.",
    blurb:
      "Most agent harnesses are over-engineered. Here's a single-file no-deps harness that handles tools, retries, and streaming.",
    read: "9 min",
  } as EssayLike,
  fig4Photo: {
    id: "fig4-photo",
    date: "2026-04-11",
    index: 25,
    type: "photo",
    fig: "fig 4",
    caption: "Desk corner, mid-essay.",
    swatches: ["#e3d7bf", "#a89b7f"],
  } as PhotoEntry,
  fikaNote: {
    id: "fika-note",
    date: "2026-04-09",
    index: 26,
    type: "note",
    text: "Fika at 10:30 every day. Non-negotiable.",
  } as NoteEntry,
  winterBooks: {
    id: "winter-books",
    date: "2026-03-26",
    index: 9,
    type: "list",
    title: "Books finished this winter.",
    items: [
      { text: "tomb of sand", done: true },
      { text: "solenoid", done: true },
      { text: "discomfort of evening", done: true },
      { text: "klara and the sun" },
      { text: "live safely in a sci-fi" },
      { text: "swim in a pond" },
      { text: "time shelter" },
    ],
  } as ListEntry,
  scaffolding: {
    id: "scaffolding",
    date: "2026-03-18",
    index: 10,
    type: "essay",
    title: "Notes on prompt scaffolding.",
    blurb:
      "Hardest part isn't the model — it's the harness around it. Six patterns I keep coming back to.",
    read: "6 min",
  } as EssayLike,
  coldMorning: {
    id: "cold-morning",
    date: "2026-03-11",
    index: 11,
    type: "photo",
    fig: "fig 2",
    caption: "Cold morning, kept window open.",
    swatches: ["#dfe5e8", "#bcc4c8"],
  } as PhotoEntry,
  bujoCli: {
    id: "bujo-cli",
    date: "2026-03-04",
    index: 12,
    type: "link",
    accent: "#C8E27A",
    label: "github · bujo-cli",
    url: "github.com/donovan-y/bujo-cli",
  } as LinkEntry,
  yearClaude: {
    id: "year-claude",
    date: "2026-02-28",
    index: 13,
    type: "essay",
    accent: "#F2A0A8",
    title: "A year with Claude Code.",
    blurb:
      "Twelve months of agent-assisted shipping. What worked, what didn't, what I'm betting on next.",
    read: "12 min",
  } as EssayLike,
  letterboxd: {
    id: "letterboxd",
    date: "2026-02-19",
    index: 14,
    type: "photo",
    fig: "fig 3",
    caption: "Letterboxd recap card · 2025.",
    swatches: ["#0b1116", "#28323a", "#5d6f7d"],
  } as PhotoEntry,
  fig5Photo: {
    id: "fig5-photo",
    date: "2026-02-08",
    index: 19,
    type: "photo",
    fig: "fig 5",
    caption: "Workshop bench at midnight. Three half-finished projects, one done.",
    swatches: ["#1a2230", "#3b4760", "#6f7a91", "#a3aac0"],
  } as PhotoEntry,
  severance: {
    id: "severance",
    date: "2026-01-26",
    index: 15,
    type: "video",
    accent: "#9FD8B4",
    title: "Watched Severance s2 finale. The lighting design.",
    duration: "02:14",
    blurb: "Cold key, warm fill, no practicals. Notes on what the grade is doing.",
  } as VideoEntry,
  typeFeature: {
    id: "type-feature",
    date: "2026-01-14",
    index: 16,
    type: "essay",
    title: "Why typography is a feature.",
    blurb:
      "Most apps treat type as decoration. The good ones treat it as part of the product surface.",
    read: "4 min",
  } as EssayLike,
  workshopStamp: {
    id: "workshop-stamp",
    date: "2026-01-12",
    index: 20,
    type: "note",
    text: "rule first, then exception.",
  } as NoteEntry,
  soundtrackStamp: {
    id: "soundtrack-stamp",
    date: "2026-01-10",
    index: 21,
    type: "link",
    label: "soundtrack · oct 2025",
    url: "open.spotify.com/playlist",
  } as LinkEntry,
  waveStamp: {
    id: "wave-stamp",
    date: "2026-01-08",
    index: 22,
    type: "note",
    text: "the wave breaks where it breaks.",
  } as NoteEntry,
  paperStamp: {
    id: "paper-stamp",
    date: "2026-01-06",
    index: 23,
    type: "link",
    label: "paper · attention is all you need",
    url: "arxiv.org/abs/1706.03762",
  } as LinkEntry,
  capStamp: {
    id: "cap-stamp",
    date: "2026-01-04",
    index: 24,
    type: "quote",
    text: "good fences, good neighbours.",
    attribution: "frost",
  } as QuoteEntry,
} satisfies Record<string, Entry>;

// NOTEBOOK — declarative content map. Authors edit this. ---------------------

const NOTEBOOK: NotebookMonth[] = [
  {
    key: "2026-05",
    monthLabel: "MAY",
    year: "2026",
    rows: [
      // 2-up: hero essay + photo
      { cols: 2, cells: [{ entry: E.agentsLoop }, { entry: E.studioMay }] },
      // 4-up: short notes + links
      {
        cols: 4,
        cells: [
          { entry: E.kettleNote },
          { entry: E.saulBass },
          { entry: E.teaTemp },
          { entry: E.ycLink },
        ],
      },
    ],
  },
  {
    key: "2026-04",
    monthLabel: "APR",
    year: "2026",
    rows: [
      // 2-up: paired projects/essays
      { cols: 2, cells: [{ entry: E.iridescent }, { entry: E.stopTests }] },
      // 3-cols × 2-rows feature block: tall quote + 4 stacked cells
      {
        cols: 3,
        rows: 2,
        cells: [
          { entry: E.barthesQuote, rowSpan: 2 },
          { entry: E.harness200, colSpan: 2 },
          { entry: E.fig4Photo },
          { entry: E.fikaNote },
        ],
      },
    ],
  },
  {
    key: "2026-03",
    monthLabel: "MAR",
    year: "2026",
    rows: [
      // 4-up: list / essay / photo / link
      {
        cols: 4,
        cells: [
          { entry: E.winterBooks },
          { entry: E.scaffolding },
          { entry: E.coldMorning },
          { entry: E.bujoCli },
        ],
      },
    ],
  },
  {
    key: "2026-02",
    monthLabel: "FEB",
    year: "2026",
    rows: [
      // 2-up: hero essay + photo
      { cols: 2, cells: [{ entry: E.yearClaude }, { entry: E.letterboxd }] },
      // full-bleed photo: cols:2 with one cell colSpan:2
      { cols: 2, cells: [{ entry: E.fig5Photo, colSpan: 2 }] },
    ],
  },
  {
    key: "2026-01",
    monthLabel: "JAN",
    year: "2026",
    rows: [
      // 2-up: video + essay
      { cols: 2, cells: [{ entry: E.severance }, { entry: E.typeFeature }] },
      // 5-up: stamps row
      {
        cols: 5,
        cells: [
          { entry: E.workshopStamp },
          { entry: E.soundtrackStamp },
          { entry: E.waveStamp },
          { entry: E.paperStamp },
          { entry: E.capStamp },
        ],
      },
    ],
  },
];

// Helpers --------------------------------------------------------------------

// Highlighter rotates through the four colour slots by entry index for
// variety. Path variant is chosen deterministically by index too so a
// given card always gets the same wobble.
const highlightSlot = (index: number): HiSlot =>
  ((index % 4) + 1) as HiSlot;

const formatIndex = (n: number) => n.toString().padStart(3, "0");

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
};

const ACTION_LABEL: Partial<Record<EntryType, string>> = {
  essay: "read →",
  project: "read →",
  caseStudy: "read →",
  mixed: "read →",
  list: "read →",
  link: "open →",
  video: "watch →",
  photo: "view →",
  gallery: "view →",
};

const cardAuxMeta = (e: Entry): string | null => {
  switch (e.type) {
    case "essay":
    case "project":
    case "caseStudy":
    case "mixed":
      return e.read ?? e.meta ?? null;
    case "video":
      return e.duration ?? null;
    case "photo":
    case "gallery":
      return e.fig;
    case "list":
      return `${e.items.length} items`;
    case "quote":
      return e.attribution ?? null;
    case "link":
    case "note":
    default:
      return null;
  }
};

const flattenEntries = (nb: NotebookMonth[]): Entry[] => {
  const out: Entry[] = [];
  for (const m of nb) for (const r of m.rows) for (const c of r.cells) out.push(c.entry);
  return out;
};

// Components -----------------------------------------------------------------

interface NotebookProps {
  monoClass: string;
  serifClass: string;
  italicSerifClass: string;
  /**
   * Optional content tree. When omitted the component renders its internal
   * mock data — useful for the lab page and for booting before the vault
   * adapter is wired. Production callers (homepage) pass the vault-derived
   * months from `notesToNotebookMonths()`.
   */
  months?: NotebookMonth[];
  /**
   * Optional href resolver. When provided, every card is wrapped with a
   * stretched-link anchor so clicking anywhere on the card navigates.
   * Omitted on the lab page so mock entries don't link to missing routes.
   */
  cardHrefBuilder?: CardHrefBuilder;
}

const Notebook = ({
  monoClass,
  serifClass,
  italicSerifClass,
  months,
  cardHrefBuilder,
}: NotebookProps) => {
  const [filter, setFilter] = useState<EntryType | "all">("all");
  const [chipsStuck, setChipsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const data = months ?? NOTEBOOK;
  const allEntries = useMemo(() => flattenEntries(data), [data]);

  // Toggle a `.is-stuck` class on the chip bar once it actually sticks to
  // the top of the viewport. A 1px sentinel above the bar tells us when
  // the bar has crossed the sticky offset — we shrink the row + tighten
  // type so the active filter stays visible while the user scrolls the
  // notebook itself.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setChipsStuck(!entry.isIntersecting),
      { rootMargin: "-49px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allEntries.length };
    for (const e of allEntries) c[e.type] = (c[e.type] ?? 0) + 1;
    return c;
  }, [allEntries]);

  const types: EntryType[] = useMemo(() => {
    const seen = new Set<EntryType>();
    for (const e of allEntries) seen.add(e.type);
    return Array.from(seen);
  }, [allEntries]);

  const filtered = filter === "all" ? null : allEntries.filter((e) => e.type === filter);

  return (
    <>
      {/* Sentinel lives OUTSIDE the Stack so the parent's flex gap can't
          insert a dotted band between it and the chip bar — and so the
          chip bar's sticky range still spans the rest of the section. */}
      <div ref={sentinelRef} className="chipsSentinel" aria-hidden />
      <Stack gap={1}>
        <div className={`chipsBar ${chipsStuck ? "is-stuck" : ""} ${monoClass}`}>
          <div className="chipsInner">
            <button
              type="button"
              className={`chip ${filter === "all" ? "chipActive" : ""}`}
              onClick={() => setFilter("all")}
            >
              <span className="chipGlyph">●</span>
              <span className="chipLabel">all</span>
              <span className="chipCount">{counts.all}</span>
            </button>
            {types.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${filter === t ? "chipActive" : ""}`}
                onClick={() => setFilter(t)}
              >
                <span className="chipGlyph">{TYPE_GLYPH[t]}</span>
                <span className="chipLabel">{TYPE_LABEL[t]}</span>
                <span className="chipCount">{counts[t] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

      {filtered ? (
        <Stack gap={1}>
          {filtered.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              monoClass={monoClass}
              serifClass={serifClass}
              italicSerifClass={italicSerifClass}
              cardHrefBuilder={cardHrefBuilder}
            />
          ))}
        </Stack>
      ) : (
        data.map((m) => (
          <MonthBlock
            key={m.key}
            month={m}
            monoClass={monoClass}
            serifClass={serifClass}
            italicSerifClass={italicSerifClass}
            cardHrefBuilder={cardHrefBuilder}
          />
        ))
      )}

      <style jsx global>{`
        /* Sentinel + chip bar share a wrapper that's a single Stack child,
           so the parent Stack's gap doesn't insert a dotted band between
           them. Sentinel stays in normal flow at the top of the wrapper
           so IntersectionObserver fires when the chip bar pins. */
        .chipsWrap {
          position: relative;
        }
        .chipsSentinel {
          width: 100%;
          height: 1px;
          /* Collapse the 1px tracking row visually so no dotted strip
             appears between the header bg and the chip bar. The element
             still occupies layout space for IntersectionObserver. */
          margin-bottom: -1px;
          pointer-events: none;
        }
        /* Chip bar starts flush with the vertical accent rule (left edge
           pulled back by --gutter-pad so the bar's left aligns with
           --gutter-w) and bleeds right to the viewport edge. The bg +
           bottom border end at the rule line — left gutter stays clear. */
        .chipsBar {
          position: sticky;
          top: var(--nav-h, 48px);
          z-index: 20;
          background: var(--paper);
          border-bottom: 1px solid var(--rule);
          margin-left: calc(-1 * var(--gutter-pad));
          margin-right: calc(-1 * var(--content-pad-left));
        }
        .chipsInner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--u);
          padding: var(--u) var(--content-pad-left) var(--u)
            var(--gutter-pad);
        }

        .chip {
          appearance: none;
          background: transparent;
          border: 1px solid var(--ink-faint);
          border-radius: 2px;
          padding: 8px 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-mute);
          cursor: pointer;
          line-height: 1;
          transition:
            background 140ms ease,
            color 140ms ease,
            border-color 140ms ease;
        }
        .chip:hover {
          color: var(--ink);
          border-color: var(--ink-soft);
        }
        .chipActive {
          background: var(--ink);
          color: var(--paper);
          border-color: var(--ink);
        }
        .chipGlyph {
          font-size: 12px;
          line-height: 1;
        }
        .chipCount {
          font-variant-numeric: tabular-nums;
          opacity: 0.7;
        }
        .chipActive .chipCount {
          opacity: 0.85;
        }
      `}</style>
      </Stack>
    </>
  );
};

interface MonthBlockProps {
  month: NotebookMonth;
  monoClass: string;
  serifClass: string;
  italicSerifClass: string;
  cardHrefBuilder?: CardHrefBuilder;
}

const MonthBlock = ({
  month,
  monoClass,
  serifClass,
  italicSerifClass,
  cardHrefBuilder,
}: MonthBlockProps) => {
  const lastIdx = month.rows.length - 1;
  const head = month.rows.slice(0, lastIdx);
  const tail = lastIdx >= 0 ? month.rows[lastIdx] : null;
  const cellCount = month.rows.reduce((n, r) => n + r.cells.length, 0);

  return (
    <section className="monthSection">
      <div className="stickyZone">
        <MarginAnchor
          top={3}
          className={monoClass}
          style={{ zIndex: 30 }}
        >
          <span className="monthName">{month.monthLabel}</span>
          <span className="monthYear">{month.year}</span>
          <span className="monthCount">
            {cellCount} {cellCount === 1 ? "entry" : "entries"}
          </span>
        </MarginAnchor>

        {head.map((row, i) => (
          <RowBlock
            key={`${month.key}-r${i}`}
            row={row}
            monoClass={monoClass}
            serifClass={serifClass}
            italicSerifClass={italicSerifClass}
            cardHrefBuilder={cardHrefBuilder}
          />
        ))}
      </div>

      {tail ? (
        <RowBlock
          row={tail}
          monoClass={monoClass}
          serifClass={serifClass}
          italicSerifClass={italicSerifClass}
          cardHrefBuilder={cardHrefBuilder}
        />
      ) : null}

      <style jsx global>{`
        .monthSection {
          display: flex;
          flex-direction: column;
          gap: var(--u);
        }
        .stickyZone {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: var(--u);
        }
        .monthName {
          font-size: 96px;
          font-weight: 900;
          line-height: 0.85;
          letter-spacing: -0.04em;
          color: var(--ink);
        }
        .monthYear {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink);
          /* MarginAnchor adds gap: var(--u) between children. Pull the year
             back to sit flush under the month name; the entry count keeps
             its 1u breathing room below. */
          margin-top: calc(var(--u) * -1);
        }
        .monthCount {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        @media (max-width: 900px) {
          .monthName {
            font-size: 64px;
          }
          .monthHeader {
            top: 48px;
          }
        }
        @media (max-width: 560px) {
          .monthName {
            font-size: 48px;
          }
        }
      `}</style>
    </section>
  );
};

interface RowBlockProps {
  row: NotebookRow;
  monoClass: string;
  serifClass: string;
  italicSerifClass: string;
  cardHrefBuilder?: CardHrefBuilder;
}

const RowBlock = ({
  row,
  monoClass,
  serifClass,
  italicSerifClass,
  cardHrefBuilder,
}: RowBlockProps) => (
  <Grid cols={row.cols} rows={row.rows ?? 1} gap={1} dense data-cols={row.cols}>
    {row.cells.map((cell, i) => (
      <EntryCard
        key={`${cell.entry.id}-${i}`}
        entry={cell.entry}
        colSpan={cell.colSpan}
        rowSpan={cell.rowSpan}
        monoClass={monoClass}
        serifClass={serifClass}
        italicSerifClass={italicSerifClass}
        cardHrefBuilder={cardHrefBuilder}
      />
    ))}
  </Grid>
);

interface EntryCardProps {
  entry: Entry;
  colSpan?: number;
  rowSpan?: number;
  monoClass: string;
  serifClass: string;
  italicSerifClass: string;
  cardHrefBuilder?: CardHrefBuilder;
}

const EntryCard = ({
  entry,
  colSpan,
  rowSpan,
  monoClass,
  serifClass,
  italicSerifClass,
  cardHrefBuilder,
}: EntryCardProps) => {
  const accent = entry.accent;
  const tint = entry.tint;
  const aux = cardAuxMeta(entry);
  const action = ACTION_LABEL[entry.type] ?? null;
  const accentColor = accent ?? "var(--ink)";
  // Card-wide link: caller decides (homepage maps to /writing/{slug}); link
  // entries always use their own external URL even when no builder is set.
  // Scheme-less `link.url` values (e.g. "example.com/foo") get an https://
  // prefix so the anchor doesn't navigate to a same-origin relative path.
  const rawHref =
    cardHrefBuilder?.(entry) ?? (entry.type === "link" ? entry.url : null);
  const href = rawHref
    ? rawHref.startsWith("/") || /^(https?:|mailto:|tel:|#)/i.test(rawHref)
      ? rawHref
      : `https://${rawHref}`
    : null;
  const isExternal = href ? /^https?:\/\//i.test(href) : false;
  const cardStyle: React.CSSProperties = {
    background: tint,
    ["--card-accent" as string]: accentColor,
    gridColumn: colSpan && colSpan > 1 ? `span ${colSpan}` : undefined,
    gridRow: rowSpan && rowSpan > 1 ? `span ${rowSpan}` : undefined,
    position: "relative",
  };

  return (
    <Card
      as="article"
      p={0}
      minH={14}
      snap
      className="card"
      style={cardStyle}
      data-type={entry.type}
    >
      <Stack gap={0} style={{ height: "100%" }}>
        <header className={`cardTopBar ${monoClass}`}>
          <span className="cardTopLeft">
            <span className="cardIndex">#{formatIndex(entry.index)}</span>
            <span className="cardSep">·</span>
            <span className="cardType">{TYPE_LABEL[entry.type]}</span>
          </span>
          <span className="cardDate">{formatDate(entry.date)}</span>
        </header>

        <Box className="cardInner" style={{ flex: "1 1 auto" }}>
          <EntryBody
            entry={entry}
            monoClass={monoClass}
            serifClass={serifClass}
            italicSerifClass={italicSerifClass}
          />
        </Box>

        <footer className={`cardBottomBar ${monoClass}`}>
          <span className="cardBottomLeft">
            {/* Footer auxiliary line. Falls back to the type label when no
                richer aux (read time, duration, fig, attribution) is set,
                so non-essay cards still anchor a left-side caption. */}
            <span>{aux ?? TYPE_LABEL[entry.type]}</span>
          </span>
          {action ? <span className="cardAction">{action}</span> : null}
        </footer>
      </Stack>

      {href ? (
        isExternal ? (
          <a
            className="cardStretchedLink"
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={
              "title" in entry
                ? entry.title
                : "label" in entry
                  ? entry.label
                  : "text" in entry
                    ? entry.text
                    : "caption" in entry
                      ? entry.caption
                      : "Read entry"
            }
          />
        ) : (
          <Link
            className="cardStretchedLink"
            href={href}
            aria-label={
              "title" in entry
                ? entry.title
                : "label" in entry
                  ? entry.label
                  : "text" in entry
                    ? entry.text
                    : "caption" in entry
                      ? entry.caption
                      : "Read entry"
            }
          />
        )
      ) : null}

      <style jsx global>{`
        .cardTopBar {
          background: transparent;
          color: var(--ink);
          padding: 8px var(--u);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          line-height: 16px;
          height: 32px;
          border-bottom: 1px solid var(--rule);
        }
        .cardTopLeft {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .cardIndex {
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .cardSep {
          opacity: 0.55;
        }
        .cardDate {
          font-variant-numeric: tabular-nums;
          opacity: 0.85;
        }
        .cardInner {
          padding: calc(var(--u) * 1.5) var(--u);
          display: flex;
          flex-direction: column;
          gap: var(--u);
          flex: 1 1 auto;
        }
        .cardBottomBar {
          padding: 8px var(--u);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          line-height: 16px;
          height: 32px;
          color: var(--ink-mute);
          border-top: 1px solid var(--rule);
        }
        .cardBottomLeft {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .cardAction {
          font-weight: 600;
        }
        /* Full-card click target. Sits above the static content so anywhere
           on the card navigates, but doesn't paint anything visible. Text
           selection still works because pointer events on the rest of the
           card stay enabled via the link's transparent overlay. */
        .cardStretchedLink {
          position: absolute;
          inset: 0;
          z-index: 1;
          text-decoration: none;
          color: inherit;
        }
        .cardStretchedLink:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: -2px;
        }
        .card:has(.cardStretchedLink) {
          cursor: pointer;
        }
      `}</style>
    </Card>
  );
};

interface EntryBodyProps {
  entry: Entry;
  monoClass: string;
  serifClass: string;
  italicSerifClass: string;
}

const EntryBody = ({ entry, monoClass, serifClass, italicSerifClass }: EntryBodyProps) => {
  switch (entry.type) {
    case "essay":
    case "project":
    case "caseStudy":
    case "mixed":
      return (
        <>
          <h3 className={`title ${monoClass}`}>
            {entry.accent ? (
              <HiSpan
                slot={highlightSlot(entry.index)}
                pathIndex={entry.index}
              >
                {entry.title}
              </HiSpan>
            ) : (
              entry.title
            )}
          </h3>
          {entry.blurb ? <p className={`blurb ${serifClass}`}>{entry.blurb}</p> : null}
          <Body />
        </>
      );

    case "note":
      return (
        <>
          <p className={`noteText ${italicSerifClass}`}>{entry.text}</p>
          <Body />
        </>
      );

    case "photo":
    case "gallery":
      return (
        <>
          <div className="photoStrip" aria-hidden>
            {(entry.swatches ?? ["#c8b89a", "#9ba78c", "#5a4a3a"]).map((s, i) => (
              <span key={i} className="photoSwatch" style={{ background: s }} />
            ))}
          </div>
          <p className={`figLine ${monoClass}`}>
            <span className="figTag">{entry.fig}</span>
            <span className="figCaption">{entry.caption}</span>
          </p>
          <Body />
        </>
      );

    case "quote":
      return (
        <>
          <blockquote className={`quoteText ${italicSerifClass}`}>“{entry.text}”</blockquote>
          {entry.attribution ? (
            <span className={`quoteAttr ${monoClass}`}>— {entry.attribution}</span>
          ) : null}
          <Body />
        </>
      );

    case "link":
      return (
        <>
          <p className={`linkLabel ${monoClass}`}>↳ {entry.label}</p>
          <a
            className={`linkUrl ${monoClass}`}
            href={`https://${entry.url}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {entry.url} →
          </a>
          <Body />
        </>
      );

    case "video":
      return (
        <>
          <div className="videoFrame" aria-hidden>
            <span className="videoPlay">▶</span>
            <span className={`videoStamp ${monoClass}`}>{entry.duration}</span>
          </div>
          <h3 className={`title ${monoClass}`}>{entry.title}</h3>
          {entry.blurb ? <p className={`blurb ${serifClass}`}>{entry.blurb}</p> : null}
          <Body />
        </>
      );

    case "list":
      return (
        <>
          <h3 className={`title ${monoClass}`}>{entry.title}</h3>
          <ul className={`listBlock ${monoClass}`}>
            {entry.items.map((it) => (
              <li key={it.text} className={it.done ? "listDone" : "listOpen"}>
                <span className="listBox">{it.done ? "[x]" : "[ ]"}</span>
                <span className="listText">{it.text}</span>
              </li>
            ))}
          </ul>
          <Body />
        </>
      );
  }
};

const Body = () => (
  <style jsx>{`
    :global(.title) {
      margin: 0;
      font-size: 22px;
      line-height: 32px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--ink);
    }
    :global(.blurb) {
      margin: 0;
      font-size: 16px;
      line-height: 24px;
      color: var(--ink-soft);
    }
    :global(.noteText) {
      margin: 0;
      font-size: 20px;
      line-height: 28px;
      color: var(--ink);
    }
    :global(.photoStrip) {
      display: flex;
      gap: 4px;
      height: 144px;
      border-radius: 1px;
      overflow: hidden;
    }
    :global(.photoSwatch) {
      flex: 1;
    }
    :global(.figLine) {
      margin: 0;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ink-mute);
      display: flex;
      gap: 12px;
    }
    :global(.figTag) {
      color: var(--ink);
      font-weight: 700;
    }
    :global(.quoteText) {
      margin: 0;
      font-size: 28px;
      line-height: 36px;
      color: var(--ink);
    }
    :global(.quoteAttr) {
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ink-mute);
    }
    :global(.linkLabel) {
      margin: 0;
      font-size: 18px;
      line-height: 24px;
      color: var(--ink);
      font-weight: 600;
    }
    :global(.linkUrl) {
      font-size: 12px;
      letter-spacing: 0.08em;
      color: var(--ink-mute);
      text-decoration: none;
      border-bottom: 1px solid var(--rule);
      padding-bottom: 4px;
      transition:
        color 140ms ease,
        border-color 140ms ease;
    }
    :global(.linkUrl:hover) {
      color: var(--ink);
      border-color: var(--ink);
    }
    :global(.videoFrame) {
      position: relative;
      height: 192px;
      background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
      border-radius: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :global(.videoPlay) {
      color: rgba(255, 255, 255, 0.85);
      font-size: 32px;
    }
    :global(.videoStamp) {
      position: absolute;
      bottom: 8px;
      right: 8px;
      font-size: 10px;
      letter-spacing: 0.14em;
      color: rgba(255, 255, 255, 0.7);
    }
    :global(.listBlock) {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 14px;
      line-height: 24px;
      color: var(--ink);
    }
    :global(.listBlock .listBox) {
      display: inline-block;
      width: 28px;
      color: var(--ink-mute);
    }
    :global(.listDone .listText) {
      text-decoration: line-through;
      color: var(--ink-mute);
    }
  `}</style>
);

export default Notebook;
