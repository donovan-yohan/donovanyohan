/**
 * pages/work/[slug].tsx — public note detail page (Slice 0, P14 + P27).
 *
 * getStaticPaths returns fallback: false (P27) — prevents on-demand generation
 * of unknown slugs at request time, which is a privacy-edge attack vector.
 * Only build-time-enumerated public slugs are reachable.
 *
 * Imports ONLY from lib/vault/index (never adapter-local or adapter-github
 * directly — ESLint import/no-restricted-paths enforces this per AGENTS.md).
 */

import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useContext } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import type { VaultNote } from "../../lib/vault/schema";
import SiteNav from "../../components/SiteNav";
import { getPublicNotes, getNoteBySlug } from "../../lib/vault";
import Context from "../../components/context";
import { BLOG_PAGE_ENABLED } from "../../lib/flags";
import { themeBootstrap } from "../../lib/theme-bootstrap";
import { gm500, gm800, cp400 } from "../../global/fonts";
import { dotGridColor } from "../../lib/dot-grid-color";

const DotGrid = dynamic(() => import("../../components/lab/DotGrid"), { ssr: false });

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

const formatMonthYear = (date: string): string => {
  const [year, month] = date.split("-");
  const monthLabel = MONTH_LABELS[parseInt(month, 10) - 1] ?? month;
  return `${monthLabel} ${year}`;
};

const formatFullDate = (date: string): string => {
  const [year, month, day] = date.split("-");
  const monthLabel = MONTH_LABELS[parseInt(month, 10) - 1] ?? month;
  return `${monthLabel} ${parseInt(day, 10)}, ${year}`;
};

interface Props {
  note: VaultNote;
}

export const getStaticPaths: GetStaticPaths = async () => {
  if (!BLOG_PAGE_ENABLED) {
    return { paths: [], fallback: false };
  }

  const notes = await getPublicNotes();
  return {
    paths: notes.map((n) => ({ params: { slug: n.slug } })),
    // P27: fallback: false prevents on-demand SSR for unknown slugs —
    // a privacy-edge attack vector (request a private slug → SSR runs → cached).
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async (context) => {
  if (!BLOG_PAGE_ENABLED) {
    return { notFound: true };
  }

  const slug = context.params?.slug as string;
  const note = await getNoteBySlug(slug);

  if (!note) {
    return { notFound: true };
  }

  return { props: { note } };
};

export default function WorkSlug({ note }: Props) {
  const { theme } = useContext(Context);
  const router = useRouter();
  const isBlogRoute = router.pathname.startsWith("/blog") || router.asPath.startsWith("/blog/");
  const indexHref = isBlogRoute ? "/blog" : "/#work";

  // Format date as MAY 2026 etc. — same monospace badge convention used
  // on the bullet-journal homepage.
  const formattedDate = formatMonthYear(note.frontmatter.date);
  const updated =
    typeof note.frontmatter.updated === "string" && note.frontmatter.updated !== note.frontmatter.date
      ? note.frontmatter.updated
      : null;
  // Pull the article's accent slot off of preview so the h2 dot + title
  // underline pick up the right highlighter colour.
  const accentSlot = ((note.preview.accent || "yellow").toLowerCase().charCodeAt(0) % 4) + 1;

  return (
    <>
      <Head>
        <title>{note.frontmatter.title} — Donovan Yohan</title>
        <meta name="description" content={note.preview.excerpt ?? note.frontmatter.title} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </Head>

      <SiteNav current={isBlogRoute ? "blog" : "work"} />

      <DotGrid
        spacing={20}
        maxRadiusBoost={1.1}
        color={dotGridColor(theme)}
      />

      <main className="articlePage">
        <div className="articleHead">
          <a href={indexHref} className={`backLink ${gm500.className}`}>
            ← {isBlogRoute ? "Blog" : "Index"}
          </a>
          <div className={`articleDates ${gm500.className}`}>
            <span>Published {formattedDate}</span>
            {updated ? <span>Updated {formatFullDate(updated)}</span> : null}
          </div>
        </div>

        <h1 className={`articleTitle ${gm800.className}`}>
          {note.frontmatter.title}
        </h1>

        {note.preview.excerpt ? (
          <p className={`articleLede ${cp400.className}`}>{note.preview.excerpt}</p>
        ) : null}

        <hr className="articleRule" aria-hidden />

        {/*
         * dangerouslySetInnerHTML is required here because `note.body` is
         * pre-sanitized HTML produced by lib/vault/render.ts (which applies
         * rehype-sanitize to strip <script>, <iframe>, onclick=, etc.).
         * The sanitization happens upstream in the adapter pipeline (P22);
         * rendering it as a string here is safe.
         */}
        <article
          className={`articleBody prose ${cp400.className}`}
          data-accent={`hl-${accentSlot}`}
          dangerouslySetInnerHTML={{ __html: note.body }}
        />
      </main>

      {/*
       * Global styles. Duplicates the theme + nav rules from pages/index.tsx
       * intentionally — the long-form Layout extraction lands in a separate
       * pass. Until then both pages share the same vars + nav so they read
       * as one site.
       */}
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
          --gutter-w: calc(12 * var(--u));
          --gutter-pad: var(--u);
          --content-pad-left: calc(var(--gutter-w) + var(--gutter-pad));

          --hl-1: rgba(120, 220, 255, 0.55);
          --hl-2: rgba(255, 130, 200, 0.55);
          --hl-3: rgba(180, 255, 130, 0.6);
          --hl-4: rgba(255, 224, 102, 0.55);

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
          /* Brighter ink in dark mode — Crimson Pro 400 has thin serifs
             that need higher contrast against the deep paper. */
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

          --logo-bg: #c8632b;
        }
        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--paper);
          color: var(--ink);
          font-family: ui-monospace, monospace;
          transition: background-color 200ms ease, color 200ms ease;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>

      {/* Article body typography */}
      <style jsx global>{`
        .articlePage {
          position: relative;
          z-index: 1;
          max-width: 760px;
          margin: 0 auto;
          padding: 64px 32px 128px;
        }
        .articleHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .backLink {
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-mute);
          text-decoration: none;
          transition: color 140ms ease;
        }
        .backLink:hover {
          color: var(--ink);
        }
        .articleDates {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 8px 16px;
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-mute);
          text-align: right;
        }
        .articleTitle {
          margin: 0 0 16px;
          font-size: clamp(36px, 5vw, 56px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          font-weight: 800;
          color: var(--ink);
        }
        .articleLede {
          margin: 0 0 32px;
          font-size: clamp(18px, 1.8vw, 22px);
          line-height: 1.5;
          color: var(--ink-soft);
        }
        .articleRule {
          border: 0;
          border-top: 1px solid var(--rule);
          margin: 32px 0 40px;
        }

        /* Long-form body — Crimson Pro reading column. Headings stay mono
           so the rhythm matches the bullet-journal cards. Body type is set
           to 20px with line-height 2.0 so every line lands on a clean
           row of the 20px dot grid behind the article. */
        .articleBody {
          color: var(--ink);
          font-size: 20px;
          line-height: 2;
          --article-heading-highlight: var(--hl-4);
        }
        .articleBody p {
          margin: 0 0 20px;
        }
        .articleBody h2 {
          margin: 56px 0 16px;
          font-family:
            "Geist Mono",
            ui-monospace,
            monospace;
          font-size: clamp(22px, 2vw, 28px);
          line-height: 1.2;
          letter-spacing: -0.01em;
          font-weight: 800;
          color: var(--ink);
        }
        /* Markdown headings render with an inline child span from
           lib/vault/render.ts. Put the marker on that inline span instead
           of h2::before so wrapped headings get one highlighter stroke per
           visual line rather than a single full-block stripe. */
        .articleBody h2 .articleHeadingText {
          display: inline;
          padding: 0 0.12em;
          margin: 0 -0.12em;
          background-image: linear-gradient(
            to right,
            var(--article-heading-highlight),
            var(--article-heading-highlight)
          );
          background-position: 0 0.62em;
          background-size: 100% 0.52em;
          background-repeat: no-repeat;
          -webkit-box-decoration-break: clone;
          box-decoration-break: clone;
        }
        .articleBody[data-accent="hl-1"] {
          --article-heading-highlight: var(--hl-1);
        }
        .articleBody[data-accent="hl-2"] {
          --article-heading-highlight: var(--hl-2);
        }
        .articleBody[data-accent="hl-3"] {
          --article-heading-highlight: var(--hl-3);
        }
        .articleBody[data-accent="hl-4"] {
          --article-heading-highlight: var(--hl-4);
        }
        .articleBody h3 {
          margin: 32px 0 12px;
          font-family:
            "Geist Mono",
            ui-monospace,
            monospace;
          font-size: clamp(16px, 1.4vw, 18px);
          letter-spacing: 0;
          font-weight: 700;
          color: var(--ink);
        }
        .articleBody ul,
        .articleBody ol {
          margin: 0 0 24px;
          padding-left: 24px;
        }
        .articleBody li {
          margin: 0 0 8px;
        }
        .articleBody li::marker {
          color: var(--ink-mute);
        }
        .articleBody a {
          color: var(--ink);
          text-decoration: underline;
          text-decoration-color: var(--ink-faint);
          text-underline-offset: 3px;
          transition: text-decoration-color 140ms ease;
        }
        .articleBody a:hover {
          text-decoration-color: var(--ink);
        }
        .articleBody code {
          font-family:
            "Geist Mono",
            ui-monospace,
            monospace;
          font-size: 0.92em;
          padding: 1px 6px;
          background: var(--paper-2);
          border: 1px solid var(--rule);
          border-radius: 2px;
        }
        .articleBody pre {
          margin: 24px 0;
          padding: 16px 20px;
          background: var(--paper-2);
          border: 1px solid var(--rule);
          border-radius: 2px;
          overflow-x: auto;
          font-size: 0.92em;
          line-height: 1.55;
        }
        .articleBody pre code {
          padding: 0;
          background: transparent;
          border: 0;
        }
        .articleBody blockquote {
          margin: 24px 0;
          padding: 4px 0 4px 20px;
          border-left: 2px solid var(--accent);
          color: var(--ink-soft);
          font-style: italic;
        }
        .articleBody strong {
          color: var(--ink);
          font-weight: 700;
        }
        .articleBody em {
          font-style: italic;
        }
        .articleBody img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 32px auto;
          border-radius: 2px;
        }
        .articleBody hr {
          border: 0;
          border-top: 1px solid var(--rule);
          margin: 40px 0;
        }

        @media (max-width: 900px) {
          .articlePage {
            padding: 32px 24px 112px;
          }
          .articleHead {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }
          .articleDates {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
            text-align: left;
          }
        }
        @media (max-width: 420px) {
          .articlePage {
            padding-left: 20px;
            padding-right: 20px;
          }
          .articleTitle {
            font-size: clamp(40px, 13vw, 58px);
          }
        }
      `}</style>
    </>
  );
}
