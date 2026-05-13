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
import dynamic from "next/dynamic";
import { useContext } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import type { VaultNote } from "../../lib/vault/schema";
import { getPublicNotes, getNoteBySlug } from "../../lib/vault";
import Context from "../../components/context";
import { themeBootstrap } from "../../lib/theme-bootstrap";
import { gm500, gm800, cp400 } from "../../global/fonts";
import { dotGridColor } from "../../lib/dot-grid-color";

const DotGrid = dynamic(() => import("../../components/lab/DotGrid"), { ssr: false });

const DY_PATHS: readonly string[] = [
  "M 1371.48 700.4 L 1371.67 1013.54 L 1371.67 1063.38 C 1371.67 1238.53 1229.69 1380.51 1054.54 1380.51 L 990.63 1380.51",
  "M 736.58 50.74 L 736.58 380.47 L 736.58 702.5",
  "M 486.58 1021.04 L 420.25 1021.04 C 245.1 1021.04 103.11 879.05 103.11 703.89 C 103.11 528.74 245.1 386.76 420.25 386.76 C 595.4 386.76 737.39 528.74 737.39 703.89 C 737.39 879.05 879.38 1021.04 1054.53 1021.04 C 1229.68 1021.04 1371.67 879.05 1371.67 703.89 L 1371.67 411.42",
];

interface Props {
  note: VaultNote;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const notes = await getPublicNotes();
  return {
    paths: notes.map((n) => ({ params: { slug: n.slug } })),
    // P27: fallback: false prevents on-demand SSR for unknown slugs —
    // a privacy-edge attack vector (request a private slug → SSR runs → cached).
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const note = await getNoteBySlug(slug);

  if (!note) {
    return { notFound: true };
  }

  return { props: { note } };
};

export default function WritingSlug({ note }: Props) {
  const { theme, toggleTheme } = useContext(Context);

  // Format date as MAY 2026 etc. — same monospace badge convention used
  // on the bullet-journal homepage.
  const [year, month] = note.frontmatter.date.split("-");
  const monthLabels = [
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
  ];
  const monthLabel = monthLabels[parseInt(month, 10) - 1] ?? month;
  const formattedDate = `${monthLabel} ${year}`;

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

      {/* Top nav — same orange-chip + tab system as the homepage */}
      <nav className="topnav">
        <div className="topnavInner">
          <a href="/" className={`navHome ${gm800.className}`} aria-label="Home">
            <span className="navMarkBox" aria-hidden>
              <svg viewBox="0 0 1500 1500" className="navHomeMark" aria-hidden>
                {DY_PATHS.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={130}
                    strokeLinecap="butt"
                    strokeLinejoin="miter"
                  />
                ))}
              </svg>
            </span>
            <span className="navTitle">Donovan Yohan</span>
          </a>
          <span className="navSpacer" aria-hidden />
          <div className="navTabs">
            <a
              className={`navTab tabResume ${gm500.className}`}
              href="/DonovanYohanResume.pdf"
              target="_blank"
              rel="noreferrer"
            >
              <span className="navTabLabel">Resume</span>
            </a>
            <a className={`navTab tabWork ${gm500.className}`} href="/#work">
              <span className="navTabLabel">Work</span>
            </a>
            <a className={`navTab tabAbout ${gm500.className}`} href="/about">
              <span className="navTabLabel">About</span>
            </a>
            <a className={`navTab tabContact ${gm500.className}`} href="/#footer">
              <span className="navTabLabel">Contact</span>
            </a>
          </div>
          <button
            type="button"
            className="themeToggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <svg
              className="themeIcon sun"
              viewBox="0 0 24 24"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            <svg
              className="themeIcon moon"
              viewBox="0 0 24 24"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
        </div>
      </nav>

      <DotGrid
        spacing={20}
        maxRadiusBoost={1.1}
        color={dotGridColor(theme)}
      />

      <main className="articlePage">
        <div className="articleHead">
          <a href="/#work" className={`backLink ${gm500.className}`}>
            ← Index
          </a>
          <span className={`articleStamp ${gm500.className}`}>{formattedDate}</span>
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

      {/* Nav + article styles */}
      <style jsx global>{`
        .topnav {
          --nav-h: 48px;
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--paper);
          border-bottom: 1px solid var(--rule);
        }
        .topnavInner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          width: 100%;
          padding: 0 var(--gutter-w);
          height: var(--nav-h);
        }
        .navHome {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          color: var(--ink);
          text-decoration: none;
          height: 100%;
        }
        .navMarkBox {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--nav-h);
          height: var(--nav-h);
          flex: 0 0 var(--nav-h);
          background: var(--logo-bg);
          color: var(--tab-ink);
        }
        .navHomeMark {
          width: 60%;
          height: 60%;
          display: block;
        }
        .navTitle {
          font-size: 14px;
          letter-spacing: 0.12em;
          font-weight: 800;
          text-transform: uppercase;
        }
        .navSpacer {
          flex: 1 1 auto;
        }
        .navTabs {
          display: inline-flex;
          align-items: stretch;
          gap: 0;
          height: 100%;
        }
        .navTab {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: var(--nav-h);
          padding: 0 16px;
          font-size: 12px;
          letter-spacing: 0.12em;
          font-weight: 700;
          text-transform: uppercase;
          text-decoration: none;
          color: var(--ink);
        }
        .navTabLabel {
          display: inline-block;
          transition: transform 140ms ease;
        }
        .navTab::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 8px;
          background: var(--tab-c);
          transition: height 140ms ease;
        }
        .navTab:hover .navTabLabel {
          transform: translateY(-4px);
        }
        .navTab:hover::after {
          height: 12px;
        }
        .tabResume {
          --tab-c: var(--tab-resume);
        }
        .tabWork {
          --tab-c: var(--tab-work);
        }
        .tabAbout {
          --tab-c: var(--tab-about);
        }
        .tabContact {
          --tab-c: var(--tab-contact);
        }
        .themeToggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          margin-left: 8px;
          padding: 0;
          border: 1px solid var(--rule);
          border-radius: 50%;
          background: transparent;
          color: var(--ink-soft);
          cursor: pointer;
          transition:
            color 140ms ease,
            border-color 140ms ease,
            background-color 140ms ease;
        }
        .themeToggle:hover {
          color: var(--ink);
          border-color: var(--ink-faint);
        }
        .themeIcon {
          width: 16px;
          height: 16px;
          display: block;
        }
        [data-theme="light"] .themeIcon.sun,
        :root:not([data-theme="dark"]) .themeIcon.sun {
          display: none;
        }
        [data-theme="dark"] .themeIcon.moon {
          display: none;
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
        .articleStamp {
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-mute);
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
        }
        .articleBody p {
          margin: 0 0 20px;
        }
        .articleBody h2 {
          position: relative;
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
        /* Highlighter swatch sitting beneath h2 — picks the article's
           accent slot via data-accent on the wrapper. Subtle stripe across
           the lower half of the line, matching the hero copy treatment. */
        .articleBody h2::before {
          content: "";
          position: absolute;
          left: -6px;
          top: 60%;
          width: calc(100% + 12px);
          height: 0.5em;
          z-index: -1;
          background: var(--hl-4);
          opacity: 0.75;
        }
        .articleBody h2 {
          isolation: isolate;
          /* Shrink h2 to text width so the highlight ::before doesn't run
             past the actual heading. Block still forces a line break before
             and after. */
          width: fit-content;
          max-width: 100%;
        }
        .articleBody[data-accent="hl-1"] h2::before {
          background: var(--hl-1);
        }
        .articleBody[data-accent="hl-2"] h2::before {
          background: var(--hl-2);
        }
        .articleBody[data-accent="hl-3"] h2::before {
          background: var(--hl-3);
        }
        .articleBody[data-accent="hl-4"] h2::before {
          background: var(--hl-4);
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
            padding: 32px 24px 96px;
          }
          .topnavInner {
            padding: 0 24px;
          }
        }
      `}</style>
    </>
  );
}
