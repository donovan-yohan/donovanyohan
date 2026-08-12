import Head from "next/head";
import dynamic from "next/dynamic";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { GetStaticProps } from "next";

import Context from "../../components/context";
import SiteNav from "../../components/SiteNav";
import { HiSpan } from "../../components/Highlighter";
import PortfolioCardGrid, { type PortfolioCardItem } from "../../components/PortfolioCardGrid";
import { MarginAnchor } from "../../components/lab/system/MarginAnchor";
import { gm500, gm800, cp400 } from "../../global/fonts";
import { dotGridColor } from "../../lib/dot-grid-color";
import { measuredStickyHeight } from "../../lib/blog-month-sticky-geometry";
import { BLOG_PAGE_ENABLED } from "../../lib/flags";
import {
  PORTFOLIO_CARD_GRID_CLASS,
  getLastGridRowTop,
} from "../../lib/portfolio-card-grid-geometry";
import { themeBootstrap } from "../../lib/theme-bootstrap";
import {
  formatEntryNumber,
  getPublicNotes,
  getVaultConfig,
  getVaultTaxonomy,
  stableIndexBySlug,
} from "../../lib/vault";
import type { VaultNote } from "../../lib/vault/schema";

const DotGrid = dynamic(() => import("../../components/lab/DotGrid"), { ssr: false });

interface NotebookTagFilter {
  slug: string;
  label: string;
}

type BlogTypeKey = "article" | "case-study" | "share" | "photo" | "quote" | "video" | "note";

interface BlogCard extends PortfolioCardItem {
  typeKey: BlogTypeKey;
  tagSlugs: string[];
  /** ISO `YYYY-MM-DD`, kept so the client can regroup cards by month per filter. */
  date: string;
}

interface BlogMonthGroup {
  key: string;
  monthLabel: string;
  year: string;
  cards: BlogCard[];
}

interface BlogIndexProps {
  cards: BlogCard[];
  notebookTagFilters: NotebookTagFilter[];
  vaultSha: string;
  vaultConfigured: boolean;
}

const BLOG_LEDE =
  "Notes, half-formed arguments, build logs, and the occasional coherent thought. Basically where the rambling goes once it seems useful enough to leave in public.";

const BLOG_TYPE_META: Record<
  BlogTypeKey,
  { label: string; accent: string; ink: string; order: number }
> = {
  article: { label: "article", accent: "#78dcff", ink: "#0e0d0a", order: 1 },
  "case-study": { label: "case study", accent: "#ffe066", ink: "#0e0d0a", order: 2 },
  share: { label: "share", accent: "#ff82c8", ink: "#0e0d0a", order: 3 },
  photo: { label: "photo", accent: "#2dd4bf", ink: "#0e0d0a", order: 4 },
  quote: { label: "quote", accent: "#ea5b6f", ink: "#0e0d0a", order: 5 },
  video: { label: "video", accent: "#a78bfa", ink: "#0e0d0a", order: 6 },
  note: { label: "note", accent: "#9ca3af", ink: "#0e0d0a", order: 7 },
};

const WORDS_PER_MINUTE = 220;
const ARTICLE_NOTE_TYPES = new Set(["writing", "work"]);

const computeReadTime = (markdown: string): string => {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} MIN READ`;
};

const stringField = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const externalHrefForNote = (note: VaultNote): string | undefined => {
  const fm = note.frontmatter as Record<string, unknown>;
  const external = isRecord(fm.external)
    ? fm.external
    : isRecord(fm.url)
      ? fm.url
      : isRecord(fm.link)
        ? fm.link
        : undefined;
  return (
    stringField(external?.url) ??
    stringField(fm.sourceUrl) ??
    stringField(fm.source_url) ??
    stringField(fm.externalUrl) ??
    stringField(fm.external_url) ??
    stringField(fm.canonicalUrl) ??
    stringField(fm.canonical_url) ??
    stringField(fm.url) ??
    stringField(fm.href) ??
    stringField(fm.link)
  );
};

const sourceLabelForNote = (note: VaultNote): string | undefined => {
  const fm = note.frontmatter as Record<string, unknown>;
  const external = isRecord(fm.external)
    ? fm.external
    : isRecord(fm.url)
      ? fm.url
      : isRecord(fm.link)
        ? fm.link
        : undefined;
  return stringField(external?.source) ?? stringField(external?.kind);
};

const externalActionLabel = (href: string, source?: string): string => {
  if (/youtu\.?be|youtube\.com/i.test(href) || /youtube/i.test(source ?? "")) return "Watch";
  return "Open";
};

const blogNoteOptIn = (note: VaultNote): boolean => {
  const fm = note.frontmatter as Record<string, unknown>;
  return fm.blog === true || fm.showInBlog === true || fm.publishToBlog === true;
};

const shouldHaveBlogArticlePage = (note: VaultNote): boolean =>
  ARTICLE_NOTE_TYPES.has(note.frontmatter.type);

const shouldShowOnBlogIndex = (note: VaultNote): boolean => {
  if (note.frontmatter.type === "writing" || note.frontmatter.type === "work") return true;
  if (note.frontmatter.type === "reshare") return externalHrefForNote(note) !== undefined;
  return blogNoteOptIn(note);
};

const blogTypeForNote = (note: VaultNote): BlogTypeKey => {
  switch (note.frontmatter.type) {
    case "work":
      return "case-study";
    case "writing":
      return "article";
    case "reshare":
      return "share";
    case "note":
    default:
      switch (note.preview.kind) {
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
  }
};

const formatCardDate = (date: string): string => {
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year.slice(-2)}`;
};

// Mirrors lib/vault/to-notebook.ts so the blog's month rail reads identically
// to the homepage journal rail.
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

/**
 * Cards arrive already sorted newest-first, so a single sequential pass yields
 * newest-month-first groups without re-sorting. Runs over the *filtered* list
 * too, which is how the notebook behaves: filtering thins each month and drops
 * emptied months, it never flattens the timeline.
 */
const groupCardsByMonth = (cards: BlogCard[]): BlogMonthGroup[] => {
  const groups: BlogMonthGroup[] = [];
  let current: BlogMonthGroup | null = null;

  for (const card of cards) {
    const [year, month] = card.date.split("-");
    const key = `${year}-${month}`;
    if (!current || current.key !== key) {
      current = {
        key,
        monthLabel: MONTH_LABELS[parseInt(month, 10) - 1] ?? month,
        year,
        cards: [],
      };
      groups.push(current);
    }
    current.cards.push(card);
  }

  return groups;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const bannerImage = (note: VaultNote): string | undefined => {
  const banner = note.frontmatter.banner;
  if (!isRecord(banner)) return undefined;
  const light = banner.light;
  const dark = banner.dark;
  return typeof light === "string" ? light : typeof dark === "string" ? dark : undefined;
};

/**
 * `entryNumber` is the note's stable 1-based position in date-ascending order
 * (oldest published note = #001), not its position in this newest-first list —
 * so month grouping and the client-side filters keep showing the same number
 * for the same note, and a new post never renumbers the archive.
 */
const toBlogCard = (
  note: VaultNote,
  entryNumber: number,
  tagLabels: Record<string, string>
): BlogCard => {
  const typeKey = blogTypeForNote(note);
  const typeMeta = BLOG_TYPE_META[typeKey];
  const title = note.preview.headline ?? note.frontmatter.title;
  const image = note.preview.image ?? bannerImage(note);
  const tags = note.frontmatter.tags.map((tag) => tagLabels[tag] ?? tag).slice(0, 3);
  const externalHref = externalHrefForNote(note);
  const sourceLabel = sourceLabelForNote(note);
  const isArticle = shouldHaveBlogArticlePage(note);
  const footerLabel = isArticle
    ? computeReadTime(note.bodyMarkdown)
    : sourceLabel
      ? sourceLabel.toUpperCase()
      : typeMeta.label.toUpperCase();
  const actionLabel = externalHref ? externalActionLabel(externalHref, sourceLabel) : null;
  const links = isArticle
    ? [
        {
          href: `/blog/${note.slug}`,
          label: "Read",
          kind: "internal" as const,
          ariaLabel: `Read ${title}`,
        },
      ]
    : externalHref && actionLabel
      ? [
          {
            href: externalHref,
            label: actionLabel,
            kind: "external" as const,
            ariaLabel: `${actionLabel} ${title}`,
          },
        ]
      : [];

  return {
    id: note.slug,
    indexLabel: formatEntryNumber(entryNumber),
    categoryLabel: typeMeta.label,
    metaLabel: formatCardDate(note.frontmatter.date),
    title,
    blurb: note.preview.excerpt ?? "",
    tags,
    accent: typeMeta.accent,
    ...(image ? { image } : {}),
    ...(note.preview.imageBg ? { imageBg: note.preview.imageBg } : {}),
    footerLabel,
    ...(isArticle
      ? { primaryHref: `/blog/${note.slug}` }
      : externalHref
        ? { primaryHref: externalHref }
        : {}),
    ...(links.length > 0 ? { links } : {}),
    typeKey,
    tagSlugs: note.frontmatter.tags,
    date: note.frontmatter.date,
  };
};

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  if (!BLOG_PAGE_ENABLED) {
    return { notFound: true };
  }

  const [notes, taxonomy] = await Promise.all([getPublicNotes(), getVaultTaxonomy()]);
  const tagLabels = Object.fromEntries(
    Object.entries(taxonomy.tags).map(([slug, tag]) => [slug, tag.label])
  );
  const sorted = notes
    .slice()
    .filter(shouldShowOnBlogIndex)
    .sort((a, b) => {
      const dateCmp = b.frontmatter.date.localeCompare(a.frontmatter.date);
      return dateCmp !== 0 ? dateCmp : a.slug.localeCompare(b.slug);
    });
  // Numbered over every note this index publishes — the eligibility filter has
  // run, the client-side type/tag filters have not — so the oldest post is
  // #001, numbers are gapless, and today's post gets the next number instead
  // of pushing the archive down one.
  const entryNumbers = stableIndexBySlug(sorted);
  const notebookTagFilters = Object.entries(taxonomy.tags)
    .filter(([, tag]) => tag.showInFilters)
    .sort(([, a], [, b]) => a.order - b.order || a.label.localeCompare(b.label))
    .map(([slug, tag]) => ({ slug, label: tag.label }));

  return {
    props: {
      cards: sorted.map((note) =>
        toBlogCard(note, entryNumbers.get(note.slug) ?? 0, tagLabels)
      ),
      notebookTagFilters,
      vaultSha: process.env.BUILD_VAULT_SHA ?? "dev",
      vaultConfigured: getVaultConfig() !== null,
    },
    revalidate: 1800,
  };
};

export default function BlogIndex({
  cards,
  notebookTagFilters,
  vaultSha,
  vaultConfigured,
}: BlogIndexProps) {
  const { theme } = useContext(Context);
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const next: Record<string, number> = { all: cards.length };
    for (const card of cards) {
      next[`type:${card.typeKey}`] = (next[`type:${card.typeKey}`] ?? 0) + 1;
      for (const tag of card.tagSlugs) next[`tag:${tag}`] = (next[`tag:${tag}`] ?? 0) + 1;
    }
    return next;
  }, [cards]);

  const typeFilters = useMemo(() => {
    const present = new Set(cards.map((card) => card.typeKey));
    return Object.entries(BLOG_TYPE_META)
      .filter(([key]) => present.has(key as BlogTypeKey))
      .sort(([, a], [, b]) => a.order - b.order);
  }, [cards]);

  const visibleTagFilters = useMemo(
    () => notebookTagFilters.filter((tag) => (counts[`tag:${tag.slug}`] ?? 0) > 0),
    [counts, notebookTagFilters]
  );

  const visibleCards = useMemo(() => {
    if (filter === "all") return cards;
    if (filter.startsWith("type:")) {
      const type = filter.slice("type:".length);
      return cards.filter((card) => card.typeKey === type);
    }
    if (filter.startsWith("tag:")) {
      const tag = filter.slice("tag:".length);
      return cards.filter((card) => card.tagSlugs.includes(tag));
    }
    return cards;
  }, [cards, filter]);

  const visibleMonths = useMemo(() => groupCardsByMonth(visibleCards), [visibleCards]);
  const blogFrameRef = useRef<HTMLElement>(null);
  const blogFiltersRef = useRef<HTMLDivElement>(null);
  const blogMonthsRef = useRef<HTMLDivElement>(null);

  // The filter bar itself is sticky beneath the nav and can grow when chips
  // wrap. Keep the desktop month rail's sticky ceiling directly below that
  // real box (plus its normal-flow bottom gap) rather than assuming one row.
  useEffect(() => {
    const blogFrame = blogFrameRef.current;
    const blogFilters = blogFiltersRef.current;
    if (!blogFrame || !blogFilters || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const height = measuredStickyHeight(blogFilters.getBoundingClientRect().height);
      blogFrame.style.setProperty("--blog-filter-height", `${height}px`);
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(blogFilters);

    return () => resizeObserver.disconnect();
  }, []);

  // Measures the desktop sticky track. Below 900px the track is `display:
  // contents` (see the mobile block below), so the heights written here have no
  // box to apply to and the effect is inert — the grid observer just never has
  // anything to correct. The grid's own box is the only signal needed: a column
  // reflow or any row growing changes the grid height, which is what moves the
  // final row's top.
  useEffect(() => {
    const blogMonths = blogMonthsRef.current;
    if (!blogMonths || typeof ResizeObserver === "undefined") return;

    const zones = Array.from(
      blogMonths.querySelectorAll<HTMLElement>(".blogMonthStickyZone"),
      (zone) => ({
        track: zone.querySelector<HTMLElement>(":scope > .blogMonthStickyTrack"),
        grid: zone.querySelector<HTMLElement>(`:scope > .${PORTFOLIO_CARD_GRID_CLASS}`),
      }),
    ).filter((zone): zone is { track: HTMLElement; grid: HTMLElement } =>
      Boolean(zone.track && zone.grid),
    );

    // Read every grid before writing any height, so one write can't force a
    // reflow before the next read.
    const measure = () => {
      const heights = zones.map(({ grid }) => getLastGridRowTop(grid));
      zones.forEach(({ track }, index) => {
        track.style.height = `${heights[index]}px`;
      });
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    zones.forEach(({ grid }) => resizeObserver.observe(grid));

    return () => resizeObserver.disconnect();
  }, [visibleMonths]);

  return (
    <>
      <Head>
        <title>Blog — Donovan Yohan</title>
        <meta name="description" content={BLOG_LEDE} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="vault-sha" content={vaultSha} />
        {!vaultConfigured ? <meta name="vault-status" content="unconfigured" /> : null}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </Head>

      <SiteNav current="blog" />
      <DotGrid color={dotGridColor(theme)} />

      <main className="blogPage">
        <section ref={blogFrameRef} className="blogFrame">
          <div className="blogIntroBand">
            <header className="blogHead">
              <span className={`blogKicker ${gm500.className}`}>The bullet journal</span>
              <h1 className={`blogTitle ${gm800.className}`}>
                <HiSpan slot={2}>BLOG</HiSpan>
              </h1>
              <p className={`blogLede ${cp400.className}`}>{BLOG_LEDE}</p>
            </header>
          </div>

          <div
            ref={blogFiltersRef}
            className={`blogFilters ${gm500.className}`}
            role="group"
            aria-label="Filter blog entries"
          >
            <div className="blogFiltersInner">
              <button
                type="button"
                className={`blogChip ${filter === "all" ? "blogChipActive" : ""}`}
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
              >
                <span>●</span>
                <span>All</span>
                <span>{counts.all}</span>
              </button>
              {typeFilters.map(([key, type]) => (
                <button
                  key={key}
                  type="button"
                  className={`blogChip ${filter === `type:${key}` ? "blogChipActive" : ""}`}
                  style={{
                    ["--blog-chip-accent" as string]: type.accent,
                    ["--blog-chip-ink" as string]: type.ink,
                  }}
                  aria-pressed={filter === `type:${key}`}
                  onClick={() => setFilter(`type:${key}`)}
                >
                  <span>▤</span>
                  <span>{type.label}</span>
                  <span>{counts[`type:${key}`] ?? 0}</span>
                </button>
              ))}
              {visibleTagFilters.map((tag) => (
                <button
                  key={tag.slug}
                  type="button"
                  className={`blogChip ${filter === `tag:${tag.slug}` ? "blogChipActive" : ""}`}
                  aria-pressed={filter === `tag:${tag.slug}`}
                  onClick={() => setFilter(`tag:${tag.slug}`)}
                >
                  <span>#</span>
                  <span>{tag.label}</span>
                  <span>{counts[`tag:${tag.slug}`] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          {visibleMonths.length > 0 ? (
            <div ref={blogMonthsRef} className="blogMonths">
              {visibleMonths.map((month) => (
                <section
                  key={month.key}
                  className="blogMonth"
                  aria-labelledby={`blog-month-${month.key}`}
                >
                  <div className="blogMonthStickyZone">
                    <div className="blogMonthStickyTrack">
                      <MarginAnchor top={3} className={gm500.className}>
                        <span className="blogMonthName" id={`blog-month-${month.key}`}>
                          {month.monthLabel}
                        </span>
                        <span className="blogMonthYear">{month.year}</span>
                        <span className="blogMonthCount">
                          {month.cards.length} {month.cards.length === 1 ? "entry" : "entries"}
                        </span>
                      </MarginAnchor>
                    </div>

                    <PortfolioCardGrid
                      ariaLabel={`${month.monthLabel} ${month.year} blog entries`}
                      items={month.cards}
                    />
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <PortfolioCardGrid
              ariaLabel="Blog entries"
              items={[]}
              emptyMessage={
                vaultConfigured
                  ? "No public posts match that filter."
                  : "No posts published yet — vault not configured. See VAULT.md."
              }
            />
          )}
        </section>
      </main>

      <style jsx global>{`
        :root,
        [data-theme="light"] {
          --u: 16px;
          --paper: #fdfdf9;
          --paper-2: #ffffff;
          --ink: #16140e;
          --ink-soft: rgba(22, 20, 14, 0.78);
          --ink-mute: rgba(22, 20, 14, 0.55);
          --ink-faint: rgba(22, 20, 14, 0.32);
          --rule: rgba(22, 20, 14, 0.32);
          --accent: #c33548;
          --accent-soft: rgba(195, 53, 72, 0.12);
          --page-shell-max: 2560px;
          --page-shell-bleed-x: max(0px, calc((100vw - var(--page-shell-max)) / 2));
          --content-w: clamp(944px, round(down, 100vw - 128px, 192px), 1520px);
          --gutter-w: calc(12 * var(--u));
          --gutter-pad: var(--u);
          --content-pad-left: calc(var(--gutter-w) + var(--gutter-pad));
          --hl-1: rgba(120, 220, 255, 0.55);
          --hl-2: rgba(255, 130, 200, 0.55);
          --hl-3: rgba(180, 255, 130, 0.6);
          --hl-4: rgba(255, 224, 102, 0.55);
          --hl: var(--hl-4);
          --tab-resume: var(--hl-3);
          --tab-work: var(--hl-2);
          --tab-about: var(--hl-4);
          --tab-contact: var(--hl-1);
          --logo-bg: #e07a3c;
          --tab-ink: #fdfdf9;
        }
        [data-theme="dark"] {
          --paper: #0e0d0a;
          --paper-2: #16140f;
          --ink: #faf7ec;
          --ink-soft: rgba(250, 247, 236, 0.88);
          --ink-mute: rgba(250, 247, 236, 0.68);
          --ink-faint: rgba(250, 247, 236, 0.42);
          --rule: rgba(250, 247, 236, 0.22);
          --accent: #ea5b6f;
          --accent-soft: rgba(234, 91, 111, 0.16);
          --hl-1: rgba(60, 110, 230, 0.55);
          --hl-2: rgba(220, 70, 80, 0.55);
          --hl-3: rgba(140, 90, 230, 0.55);
          --hl-4: rgba(230, 130, 50, 0.55);
          --hl: var(--hl-4);
          --logo-bg: #c8632b;
        }
        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--paper);
          color: var(--ink);
          font-family: ui-monospace, monospace;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>

      <style jsx>{`
        .blogPage {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: var(--page-shell-max);
          margin: 0 auto;
          padding-top: 48px;
        }
        .blogFrame {
          /* One non-wrapping chip row is 62px: 16px vertical padding on both
             sides, a 29px chip, and the filter's bottom rule. This is the
             conservative SSR/no-ResizeObserver fallback; hydration replaces
             it with the bar's measured live height. */
          --blog-filter-height: calc(2 * var(--u) + 30px);
          position: relative;
          min-height: 100vh;
          padding: 40px var(--content-pad-left) 96px;
        }
        .blogFrame::before {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: calc(-1 * var(--page-shell-bleed-x));
          width: calc(var(--page-shell-bleed-x) + var(--gutter-w));
          background: var(--paper);
          pointer-events: none;
        }
        .blogFrame::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: var(--gutter-w);
          width: 1px;
          background: var(--accent);
          z-index: 25;
          pointer-events: none;
        }
        .blogIntroBand {
          position: relative;
          z-index: 2;
          margin: -40px calc(-1 * (var(--content-pad-left) + var(--page-shell-bleed-x))) 0;
          padding: 56px calc(var(--content-pad-left) + var(--page-shell-bleed-x)) 0;
          background: var(--paper);
          border-top: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }
        .blogHead {
          padding-bottom: 28px;
        }
        .blogKicker {
          display: block;
          margin-bottom: 6px;
          color: var(--ink-mute);
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .blogTitle {
          width: fit-content;
          max-width: 100%;
          margin: 0 0 10px;
          color: var(--ink);
          font-size: clamp(44px, 7vw, 92px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 0.95;
        }
        .blogLede {
          max-width: 820px;
          margin: 0;
          color: var(--ink-soft);
          font-size: clamp(19px, 1.7vw, 25px);
          line-height: 1.42;
        }
        /* Pinned under the nav so every month rail has a stable ceiling to
           stick beneath — same treatment as the homepage notebook chip bar.
           Left edge lands on the accent rule; the bar bleeds off to the right. */
        .blogFilters {
          position: sticky;
          top: var(--nav-h, 48px);
          z-index: 20;
          margin: 0 calc(-1 * (var(--content-pad-left) + var(--page-shell-bleed-x))) 24px
            calc(-1 * var(--gutter-pad));
          background: var(--paper);
          border-bottom: 1px solid var(--rule);
        }
        .blogFiltersInner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--u);
          padding: var(--u) var(--content-pad-left) var(--u) var(--gutter-pad);
        }
        .blogChip {
          --blog-chip-accent: var(--ink);
          --blog-chip-ink: var(--paper);
          appearance: none;
          background: transparent;
          border: 1px solid var(--ink-faint);
          border-radius: 2px;
          color: var(--ink-mute);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.14em;
          line-height: 1;
          padding: 8px 12px;
          text-transform: uppercase;
          transition:
            background 140ms ease,
            border-color 140ms ease,
            color 140ms ease;
        }
        .blogChip:hover {
          border-color: var(--blog-chip-accent);
          color: var(--ink);
        }
        .blogChipActive {
          background: var(--blog-chip-accent, var(--ink));
          border-color: var(--blog-chip-accent, var(--ink));
          color: var(--blog-chip-ink, #0e0d0a);
        }
        .blogMonths {
          display: flex;
          flex-direction: column;
          gap: calc(var(--u) * 3);
        }
        .blogMonthStickyZone {
          position: relative;
        }
        /* The zero-height MarginAnchor sticks inside this measured track. Its
           bottom is the top of the grid's final row, so a one-row month never
           pins and a longer month hands the label to its final row instead of
           floating over it.
           Notebook's MonthBlock gets the same boundary for free by rendering
           its last authored row outside the sticky zone. That isn't available
           here: PortfolioCardGrid's rows are implicit and breakpoint-driven, so
           "all but the final row" isn't knowable at render time — hence the
           measured height. */
        .blogMonthStickyTrack {
          position: absolute;
          inset: 0 0 auto;
          height: 0;
          pointer-events: none;
        }
        .blogMonthStickyTrack :global(.marginAnchor) {
          --margin-anchor-inner-top: 0px;
        }
        /* Anchor markup belongs to MarginAnchor, so reach it globally — but
           only ever from inside .blogMonth, never the homepage notebook. */
        .blogMonth :global(.marginAnchor) {
          /* The live filter-bar height is measured on .blogFrame. Its scoped
             fallback covers the non-wrapping row until hydration, while
             ResizeObserver handles wrapped desktop chips. */
          --margin-anchor-top: calc(
            var(--nav-h, 48px) + var(--blog-filter-height) + 24px
          );
          --margin-anchor-z-index: 30;
        }
        .blogMonthName {
          font-size: 96px;
          font-weight: 900;
          line-height: 0.85;
          letter-spacing: -0.04em;
          color: var(--ink);
        }
        .blogMonthYear {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink);
          /* MarginAnchor puts gap: var(--u) between children. Pull the year
             back flush under the month name; the count keeps its breathing
             room below. */
          margin-top: calc(var(--u) * -1);
        }
        .blogMonthCount {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        @media (max-width: 900px) {
          :global(:root),
          :global([data-theme="light"]),
          :global([data-theme="dark"]) {
            --gutter-w: 0px;
            --gutter-pad: 0px;
            --page-pad-x: clamp(16px, 4vw, 20px);
            --content-pad-left: var(--page-pad-x);
            --content-w: calc(100vw - (2 * var(--content-pad-left)));
            --page-shell-max: 100vw;
            --page-shell-bleed-x: 0px;
          }
          .blogPage {
            padding: 0 var(--page-pad-x) 72px;
          }
          .blogFrame {
            /* Chip-bar height, so month rails know where to pin beneath it. */
            --blog-chips-h: 57px;
            margin-left: calc(-1 * var(--page-pad-x));
            margin-right: calc(-1 * var(--page-pad-x));
            padding: 32px var(--page-pad-x) 72px;
          }
          .blogFrame::before,
          .blogFrame::after {
            display: none;
          }
          .blogIntroBand {
            margin: -32px calc(-1 * var(--page-pad-x)) 0;
            padding: 32px var(--page-pad-x) 0;
          }
          .blogFilters {
            margin: 0 calc(-1 * var(--page-pad-x)) 20px;
          }
          .blogFiltersInner {
            flex-wrap: nowrap;
            gap: 8px;
            overflow-x: auto;
            overscroll-behavior-x: contain;
            padding: 10px var(--page-pad-x);
            scrollbar-width: none;
          }
          .blogFiltersInner::-webkit-scrollbar {
            display: none;
          }
          .blogChip {
            flex: 0 0 auto;
            min-height: 36px;
            padding: 8px 10px;
          }
          .blogMonths {
            gap: calc(var(--u) * 1.5);
          }
          .blogMonthStickyZone {
            display: flex;
            flex-direction: column;
            gap: var(--u);
          }
          /* Mobile month strips remain in normal flow. The measured desktop
             track has no box here, so MarginAnchor keeps using the whole month
             section as its sticky containing block. */
          .blogMonthStickyTrack {
            display: contents;
          }
          /* The gutter is gone on mobile, so the rail becomes a full-bleed
             sticky strip that pins directly under the chip bar and slides
             beneath it (z 18 < chips' 20) when its month scrolls out. */
          .blogMonth :global(.marginAnchor) {
            --margin-anchor-position: sticky;
            --margin-anchor-top: calc(var(--nav-h, 0px) + var(--blog-chips-h, 57px));
            --margin-anchor-height: auto;
            --margin-anchor-margin-left: calc(-1 * var(--page-pad-x));
            --margin-anchor-margin-right: calc(-1 * var(--page-pad-x));
            --margin-anchor-padding-left: 0;
            --margin-anchor-z-index: 18;
            --margin-anchor-pointer-events: auto;
          }
          .blogMonth :global(.marginAnchorInner) {
            --margin-anchor-inner-position: static;
            --margin-anchor-inner-width: auto;
            --margin-anchor-inner-padding: 10px var(--page-pad-x) 8px;
            --margin-anchor-inner-display: grid;
            --margin-anchor-inner-grid-template-columns: auto minmax(0, 1fr) auto;
            --margin-anchor-inner-align-items: baseline;
            --margin-anchor-inner-gap: 8px;
            background: var(--paper);
            border-bottom: 1px solid var(--rule);
          }
          .blogMonthName {
            font-size: 22px;
            letter-spacing: 0.08em;
            line-height: 1;
          }
          .blogMonthYear {
            margin-top: 0;
            font-size: 11px;
            letter-spacing: 0.12em;
            color: var(--ink-mute);
          }
          .blogMonthCount {
            font-size: 10px;
            letter-spacing: 0.1em;
            text-align: right;
          }
        }
        @media (max-width: 560px) {
          .blogMonthName {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}
