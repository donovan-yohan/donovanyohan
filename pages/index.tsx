import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Geist_Mono, Crimson_Pro } from "next/font/google";
import { Box, Stack } from "../components/lab/system";

type Theme = "light" | "dark";

// Inline script: runs before React hydrates so we can set `data-theme` on
// <html> from localStorage (or system preference) before first paint —
// prevents the "wrong-theme flash".
const themeBootstrap = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

const DotGrid = dynamic(() => import("../components/lab/DotGrid"), { ssr: false });
const HatchScene = dynamic(() => import("../components/lab/HatchScene"), { ssr: false });
const Notebook = dynamic(() => import("../components/lab/Notebook"), { ssr: false });

const gm500 = Geist_Mono({ subsets: ["latin"], weight: "500", style: "normal" });
const gm800 = Geist_Mono({ subsets: ["latin"], weight: "800", style: "normal" });
const cp400 = Crimson_Pro({ subsets: ["latin"], weight: "400", style: "normal" });
const cp400i = Crimson_Pro({ subsets: ["latin"], weight: "400", style: "italic" });

// Original DY centerlines (used only by the nav home mark, which renders
// the glyph as a solid stroked silhouette at small size).
const DY_PATHS: readonly string[] = [
  "M 1371.48 700.4 L 1371.67 1013.54 L 1371.67 1063.38 C 1371.67 1238.53 1229.69 1380.51 1054.54 1380.51 L 990.63 1380.51",
  "M 736.58 50.74 L 736.58 380.47 L 736.58 702.5",
  "M 486.58 1021.04 L 420.25 1021.04 C 245.1 1021.04 103.11 879.05 103.11 703.89 C 103.11 528.74 245.1 386.76 420.25 386.76 C 595.4 386.76 737.39 528.74 737.39 703.89 C 737.39 879.05 879.38 1021.04 1054.53 1021.04 C 1229.68 1021.04 1371.67 879.05 1371.67 703.89 L 1371.67 411.42",
];

// True silhouette outline of the DY mark, traced from the rasterised glyph
// via potrace. Single closed contour — animating its dash gives a continuous
// pencil-stroke draw of the perimeter.
const DY_OUTLINE_PATH =
  "M 671.5 233.05 l 0 182.6 -1.45 -1.2 c -25.2 -20.6 -39.45 -30.65 -60.3 -42.55 -67.75 -38.75 -147.15 -55.95 -224.5 -48.6 -64.3 6.1 -123.9 27.1 -176.75 62.4 -61.7 41.15 -110.55 99.75 -139.55 167.45 -16.45 38.3 -26 77 -29.8 120.5 -1.05 12 -1.2 45.8 -0.25 57.35 1.95 24.2 5.2 44.35 10.65 66.15 21.35 85.3 71.75 160.65 142.7 213.5 55.5 41.35 120.8 66.65 190 73.6 14.85 1.5 24.65 1.75 64.15 1.75 l 40.1 0 0 -64.95 0 -64.95 -41.35 -0.25 c -45.7 -0.25 -48.45 -0.4 -67.4 -3.6 -105.25 -17.85 -188.45 -101.2 -205.95 -206.25 -6.8 -40.9 -3.6 -83.15 9.3 -121.75 16.3 -48.85 46.9 -91.1 88.75 -122.55 33.85 -25.4 75.45 -42.25 117.75 -47.7 24.95 -3.15 52.25 -2.55 76.9 1.75 85.35 14.95 158.05 74.4 190.15 155.55 10.5 26.5 16.2 53.4 16.7 78.8 0.15 6.85 0.45 12.4 0.65 12.4 0.2 0 0.5 5.9 0.65 13.1 1.55 70.2 24.25 141.2 64 200.65 23.85 35.65 54.35 67.75 89.25 93.95 53.05 39.85 117.55 65.6 183.6 73.25 17.6 2.05 22.9 2.3 45 2.3 22.9 0 29.35 -0.35 47 -2.55 15.9 -1.95 27.9 -4.1 42.75 -7.7 58.65 -14.05 113.05 -42.05 160.15 -82.3 l 2.15 -1.85 -0.2 45.2 c -0.2 48.75 -0.25 49.6 -3.1 67.4 -7.35 45.05 -26.1 85.9 -56 121.8 -6.45 7.75 -21.8 23.15 -29.75 29.85 -36.25 30.45 -78.95 49.95 -124.55 56.85 -16.5 2.5 -19.95 2.65 -62.3 2.9 l -40.15 0.25 0 65 0 65 44.15 -0.25 c 45.65 -0.2 47.9 -0.3 66.85 -2.6 42.65 -5.2 84.4 -17.8 123.5 -37.3 29 -14.5 53.7 -30.9 78.95 -52.4 8.6 -7.35 30.65 -29.2 38.2 -37.95 45.1 -51.85 74.6 -112.2 87.8 -179.6 2.75 -14 4.85 -30.45 6.1 -47.75 0.35 -5.25 0.6 -107.85 0.75 -341.9 l 0.2 -334.35 -65.25 0 -65.2 0 -0.2 155.35 c -0.15 170.9 0.1 157.9 -3.1 177.6 -7.45 45.8 -27 87.85 -57.65 123.8 -5.9 6.9 -21.65 22.5 -28.6 28.3 -60.6 50.6 -139.15 70.15 -216 53.65 -81 -17.4 -149.4 -75.2 -180.4 -152.45 -8.9 -22.15 -14.2 -43.9 -16.85 -69 -1.8 -16.65 -1.9 -36.75 -2.1 -360.15 l -0.15 -318.1 -65 0 -65 0 0 182.55 z";

// Each of the 4 slice strokes takes OUTLINE_SLICE_MS to draw its 25% of the
// perimeter. Stroke k starts OUTLINE_STAGGER_MS later than stroke k-1, so the
// reveal feels hand-drawn rather than perfectly synchronised.
const OUTLINE_SLICE_MS = 1500;
const OUTLINE_STAGGER_MS = 180;
const OUTLINE_BASE_DELAY_MS = 100;
const OUTLINE_SLICES = 4;
const OUTLINE_TOTAL_MS =
  OUTLINE_BASE_DELAY_MS + OUTLINE_SLICE_MS + (OUTLINE_SLICES - 1) * OUTLINE_STAGGER_MS;

// Hero copy is rendered char-by-char so each glyph fades + drops + un-rotates
// into place, mimicking ink being laid down by a pen.
const HW_START_MS = 100;
const HW_STAGGER_MS = 20;
const HW_DUR_MS = 280;
const HERO_TOKENS: ReadonlyArray<{ text: string; bold: boolean }> = [
  { text: "Hi, I’m Donovan; a ", bold: false },
  { text: "senior full-stack engineer", bold: true },
  { text: " designing and building ", bold: false },
  { text: "agentic systems", bold: true },
  { text: ".", bold: false },
];

interface SketchedSvgLogoProps {
  className?: string;
  inkColor?: string;
}

const SketchedSvgLogo = ({ className, inkColor = "#1a1814" }: SketchedSvgLogoProps) => {
  return (
    <div className={`sketchLogo ${className ?? ""}`}>
      <div className="sketchLogoHatch" aria-hidden>
        <HatchScene
          mask={{ kind: "svg", src: "/img/dy-mask.svg" }}
          height="100%"
          padding={0}
          outlineWidth={0}
          mouseRadius={750}
          inkColor={inkColor}
          introMs={1400}
          introDelayMs={OUTLINE_TOTAL_MS}
        />
      </div>
      <svg
        viewBox="-80 -80 1660 1660"
        className="sketchLogoSvg"
        aria-hidden
        overflow="visible"
      >
        <defs>
          <filter
            id="pencilWobble"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        {Array.from({ length: OUTLINE_SLICES }, (_, k) => (
          <path
            key={k}
            d={DY_OUTLINE_PATH}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#pencilWobble)"
            pathLength={1}
            style={{
              strokeDasharray: "0 1",
              strokeDashoffset: -k / OUTLINE_SLICES,
              animation: `sketchDrawSlice ${OUTLINE_SLICE_MS}ms ${
                OUTLINE_BASE_DELAY_MS + k * OUTLINE_STAGGER_MS
              }ms ease-in-out forwards`,
            }}
          />
        ))}
      </svg>
      <style jsx>{`
        .sketchLogo {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
        }
        .sketchLogoHatch {
          position: absolute;
          inset: 0;
        }
        .sketchLogoSvg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

const Index = () => {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined"
      ? (localStorage.getItem("theme") as Theme | null)
      : null);
    const initial: Theme =
      stored ??
      (typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage may be unavailable; theme just won't persist. */
    }
  };

  const hatchInk = theme === "dark" ? "#ffffff" : "#1a1814";

  return (
    <>
      <Head>
        <title>Donovan Yohan · Senior full-stack engineer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </Head>

      <Box as="nav" className="topnav">
        <Stack
          as="div"
          direction="row"
          align="center"
          gap={2}
          className="topnavInner"
        >
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
            <a className={`navTab tabContact ${gm500.className}`} href="#footer">
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
        </Stack>
      </Box>

      <DotGrid
        spacing={16}
        maxRadiusBoost={1.1}
        color={
          theme === "dark"
            ? "rgba(244, 240, 228, 0.22)"
            : "rgba(40, 38, 32, 0.32)"
        }
      />

      <Box as="main" className="page">
        <Box className="heroFrame">
        <Box className="hero">
          <Box className="logoSlot">
            <SketchedSvgLogo inkColor={hatchInk} />
          </Box>

          <Box className="heroRight">
            <p className={`heroCopy ${cp400.className}`}>
              {(() => {
                let charIndex = 0;
                return HERO_TOKENS.map((tok, ti) => {
                  // Split on whitespace runs so each word stays atomic in an
                  // inline-block .hwWord — only the inter-word spaces are
                  // legal line-break points, so words never split mid-glyph.
                  const segments = tok.text.split(/(\s+)/);
                  const nodes: React.ReactNode[] = [];
                  segments.forEach((seg, si) => {
                    if (seg.length === 0) return;
                    if (/^\s+$/.test(seg)) {
                      charIndex += seg.length;
                      nodes.push(seg);
                      return;
                    }
                    const wordChars = Array.from(seg).map((ch, ci) => {
                      const delay = HW_START_MS + charIndex * HW_STAGGER_MS;
                      charIndex += 1;
                      return (
                        <span
                          className="hw"
                          key={ci}
                          style={{ animationDelay: `${delay}ms` }}
                        >
                          {ch}
                        </span>
                      );
                    });
                    nodes.push(
                      <span className="hwWord" key={si}>
                        {wordChars}
                      </span>
                    );
                  });
                  return tok.bold ? (
                    <strong key={ti}>{nodes}</strong>
                  ) : (
                    <span key={ti}>{nodes}</span>
                  );
                });
              })()}
            </p>
          </Box>
        </Box>
        </Box>

        <hr className="heroRule" aria-hidden />

        <Box className="historyFrame">
          <Notebook
            monoClass={gm500.className}
            serifClass={cp400.className}
            italicSerifClass={cp400i.className}
          />
        </Box>
      </Box>

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
          --content-w: clamp(944px, round(down, 100vw - 128px, 192px), 1520px);
          --page-max: calc(var(--content-w) + 64px);
          /* Left gutter: sticky month labels (MAY, APR…) live here, with a
             vertical accent rule on its right edge. Matches the lab page. */
          --gutter-w: calc(12 * var(--u));
          --gutter-pad: var(--u);
          --content-pad-left: calc(var(--gutter-w) + var(--gutter-pad));
          --hl: rgba(255, 224, 102, 0.55);
          /* Hobonichi-techo palette — muted blocks for tabs + logo frame. */
          --tab-resume: #4f6b3a;
          --tab-work: #b04a3c;
          --tab-about: #c89e3c;
          --tab-contact: #6b7fa3;
          --tab-ink: #fdfdf9;
          --logo-bg: #e07a3c;
        }
        [data-theme="dark"] {
          --paper: #0e0d0a;
          --paper-2: #16140f;
          --ink: #f4f0e4;
          --ink-soft: rgba(244, 240, 228, 0.78);
          --ink-mute: rgba(244, 240, 228, 0.55);
          --ink-faint: rgba(244, 240, 228, 0.32);
          --rule: rgba(244, 240, 228, 0.18);
          --accent: #ea5b6f;
          --accent-soft: rgba(234, 91, 111, 0.16);
          --hl: rgba(180, 130, 255, 0.45);
          --tab-resume: #6a8a4f;
          --tab-work: #d36657;
          --tab-about: #e4b658;
          --tab-contact: #8b9fc3;
          --tab-ink: #0e0d0a;
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
        /* Each slice clone has dasharray "0 1" (no dash visible) and a unique
           dashoffset that positions where its dash will appear on the unit-
           length path. Growing the dash from 0 to 1/N reveals exactly that
           slice; clones stagger their start times to feel hand-drawn. */
        @keyframes sketchDrawSlice {
          from {
            stroke-dasharray: 0 1;
          }
          to {
            stroke-dasharray: 0.25 0.75;
          }
        }
      `}</style>

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
          max-width: var(--page-max);
          margin: 0 auto;
          /* Logo box left edge aligns with the history gutter rule (at
             var(--gutter-w) from viewport). Right side matches for symmetry. */
          padding: 0 var(--gutter-w);
          height: var(--nav-h);
        }
        /* Hobonichi-techo home block: square orange chip bleeds top-to-bottom
           of the nav bar. Brand name sits beside it on the cream paper. */
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
        .navLink {
          font-size: 13px;
          letter-spacing: 0.08em;
          color: var(--ink-soft);
          text-decoration: none;
          text-transform: uppercase;
          transition: color 140ms ease;
        }
        .navLink:hover {
          color: var(--ink);
        }
        /* Manilla-folder file tabs: trapezoidal blocks that hang from the
           nav bar top, slant inward as they descend, and meet at their
           bottom bases. --tab-slant controls both the side inset and the
           negative margin between adjacent tabs so the seams line up. */
        .navTabs {
          display: inline-flex;
          align-items: stretch;
          gap: 0;
          height: 100%;
        }
        /* Tab cells: label sits centred over a coloured underline that
           anchors to the nav-bar bottom. Underlines from adjacent tabs are
           flush (no gap), so the nav reads as a continuous striped rail of
           Hobonichi colour blocks. Hover lifts the whole cell + thickens
           its underline so the active route reads as "pulled forward".  */
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
          /* Drop 1px past the tab's bottom edge so the underline covers
             the topnav's bottom border underneath — no visible gap. */
          bottom: -1px;
          height: 8px;
          background: var(--tab-c);
          transition: height 140ms ease;
        }
        /* Lift = growth amount, so the label and the top of the coloured
           underline travel together. Underline base stays anchored to the
           nav-bar bottom; only its top edge rises into the lifted space. */
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
        /* Show only the icon that represents the theme you'd switch TO. */
        [data-theme="light"] .themeIcon.sun,
        :root:not([data-theme="dark"]) .themeIcon.sun {
          display: none;
        }
        [data-theme="dark"] .themeIcon.moon {
          display: none;
        }

        .page {
          position: relative;
          z-index: 1;
          margin: 0 auto;
        }
        /* Hero takes the full first viewport below the nav, centred. */
        .heroFrame {
          min-height: calc(100vh - 48px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px var(--content-pad-left);
        }
        /* Single Hobonichi-style ruled line separating hero from the
           working-notebook history below. */
        .heroRule {
          border: 0;
          border-top: 1px solid var(--rule);
          margin: 0;
        }
        /* History section: gutter on the left for sticky MAY/APR labels.
           ::before masks the left --gutter-w with --paper so the dot grid
           doesn't bleed through. ::after lays a 1px accent rule along the
           gutter's right edge between the mask and the content column. */
        .historyFrame {
          position: relative;
          padding: 64px var(--content-pad-left) 96px;
        }
        .historyFrame::before {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: var(--gutter-w);
          background: var(--paper);
          pointer-events: none;
        }
        .historyFrame::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: var(--gutter-w);
          width: 1px;
          background: var(--accent);
          pointer-events: none;
        }

        .hero {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0;
          align-items: center;
          width: 80%;
          max-width: 1500px;
          margin: 0 auto;
        }

        .logoSlot {
          width: min(56vh, 38vw);
          flex-shrink: 0;
        }

        .heroRight {
          min-width: 0;
        }
        .heroCopy {
          margin: 0;
          color: var(--ink);
          font-size: clamp(28px, 2.6vw, 46px);
          line-height: 1.25;
          letter-spacing: -0.01em;
          font-weight: 400;
        }
        /* Each glyph drops + rotates + fades into place, staggered, so the
           sentence reads as ink being laid down by a pen. */
        /* Each word is an atomic inline-block so the per-character spans
           inside can never split across lines — line breaks only happen at
           the inter-word whitespace text nodes between .hwWord boxes. */
        .heroCopy .hwWord {
          display: inline-block;
          white-space: nowrap;
        }
        .heroCopy .hw {
          display: inline-block;
          opacity: 0;
          transform: translateY(0.18em) rotate(-4deg);
          animation: handwrite ${HW_DUR_MS}ms ease-out both;
        }
        @keyframes handwrite {
          to {
            opacity: 1;
            transform: translateY(0) rotate(0);
          }
        }
        /* Marker-style highlight. Uses linear-gradient + box-decoration-break
           so the stripe clones per line when the bold word wraps. Animating
           background-size width grows the stripe left-to-right. */
        .heroCopy strong {
          font-weight: 700;
          background-image: linear-gradient(
            to right,
            var(--hl),
            var(--hl)
          );
          background-position: 0 0.55em;
          background-size: 0% 0.55em;
          background-repeat: no-repeat;
          -webkit-box-decoration-break: clone;
          box-decoration-break: clone;
          padding: 0 0.05em;
          margin: 0 -0.05em;
          animation: heroHighlight 760ms ease-out forwards;
        }
        .heroCopy strong:nth-of-type(1) {
          animation-delay: 2200ms;
        }
        .heroCopy strong:nth-of-type(2) {
          animation-delay: 2520ms;
        }
        @keyframes heroHighlight {
          to {
            background-size: 100% 0.55em;
          }
        }

        @media (max-width: 900px) {
          .page {
            padding: 32px clamp(24px, 6vw, 64px);
          }
          .hero {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .logoSlot {
            width: min(40vh, 70vw);
          }
          .heroCopy {
            font-size: clamp(22px, 5vw, 32px);
          }
        }
      `}</style>
    </>
  );
};

export default Index;
