import dynamic from "next/dynamic";
import Head from "next/head";
import { useEffect, useState } from "react";
import { Geist_Mono, Crimson_Pro } from "next/font/google";
import { Box, Stack } from "../components/lab/system";

const DotGrid = dynamic(() => import("../components/lab/DotGrid"), { ssr: false });
const HatchScene = dynamic(() => import("../components/lab/HatchScene"), { ssr: false });

const gm500 = Geist_Mono({ subsets: ["latin"], weight: "500", style: "normal" });
const gm800 = Geist_Mono({ subsets: ["latin"], weight: "800", style: "normal" });
const cp400 = Crimson_Pro({ subsets: ["latin"], weight: "400", style: "normal" });

const DY_PATHS: readonly string[] = [
  "M 1371.48 700.4 L 1371.67 1013.54 L 1371.67 1063.38 C 1371.67 1238.53 1229.69 1380.51 1054.54 1380.51 L 990.63 1380.51",
  "M 736.58 50.74 L 736.58 380.47 L 736.58 702.5",
  "M 486.58 1021.04 L 420.25 1021.04 C 245.1 1021.04 103.11 879.05 103.11 703.89 C 103.11 528.74 245.1 386.76 420.25 386.76 C 595.4 386.76 737.39 528.74 737.39 703.89 C 737.39 879.05 879.38 1021.04 1054.53 1021.04 C 1229.68 1021.04 1371.67 879.05 1371.67 703.89 L 1371.67 411.42",
];

const SKETCH_DURATION_MS = 900;
const SKETCH_STAGGER_MS = 100;
const HATCH_FADE_MS = 400;

const HATCH_PATTERN_ID = "heroHatch";

const HatchPatternDefs = () => (
  <defs>
    <pattern
      id={HATCH_PATTERN_ID}
      patternUnits="userSpaceOnUse"
      width="14"
      height="14"
      patternTransform="rotate(45)"
    >
      <line x1="0" y1="0" x2="0" y2="14" stroke="var(--ink)" strokeWidth="2" />
    </pattern>
    <pattern
      id={`${HATCH_PATTERN_ID}-cross`}
      patternUnits="userSpaceOnUse"
      width="14"
      height="14"
      patternTransform="rotate(-45)"
    >
      <rect width="14" height="14" fill={`url(#${HATCH_PATTERN_ID})`} />
      <line x1="0" y1="0" x2="0" y2="14" stroke="var(--ink)" strokeWidth="2" />
    </pattern>
  </defs>
);

interface SketchedSvgLogoProps {
  className?: string;
}

const SketchedSvgLogo = ({ className }: SketchedSvgLogoProps) => {
  const [hatched, setHatched] = useState(false);
  useEffect(() => {
    const total = SKETCH_DURATION_MS + SKETCH_STAGGER_MS * (DY_PATHS.length - 1);
    const t = window.setTimeout(() => setHatched(true), total);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={`sketchLogo ${className ?? ""}`}>
      <svg
        viewBox="0 0 1500 1500"
        className={`sketchLogoSvg ${hatched ? "is-off" : ""}`}
        aria-hidden
      >
        {DY_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={130}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            style={{
              strokeDasharray: 5000,
              strokeDashoffset: 5000,
              animation: `sketchDraw ${SKETCH_DURATION_MS}ms ${i * SKETCH_STAGGER_MS}ms ease-out forwards`,
            }}
          />
        ))}
      </svg>
      <div className={`sketchLogoHatch ${hatched ? "is-on" : ""}`} aria-hidden>
        <HatchScene
          mask={{ kind: "svg", src: "/img/dy.svg" }}
          height="100%"
          padding={0}
        />
      </div>
      <style jsx>{`
        .sketchLogo {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
        }
        .sketchLogoSvg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          opacity: 1;
          transition: opacity ${HATCH_FADE_MS}ms ease;
        }
        .sketchLogoSvg.is-off {
          opacity: 0;
        }
        .sketchLogoHatch {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity ${HATCH_FADE_MS}ms ease;
        }
        .sketchLogoHatch.is-on {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

interface SketchedHatchTextProps {
  text: string;
  delayMs?: number;
  fontFamily?: string;
  fontWeight?: number;
  widthChars?: number;
}

const SketchedHatchText = ({
  text,
  delayMs = 0,
  fontFamily = "Geist Mono, ui-monospace, monospace",
  fontWeight = 800,
  widthChars,
}: SketchedHatchTextProps) => {
  const [hatched, setHatched] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setHatched(true), delayMs + SKETCH_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  const fontSize = 200;
  const charW = fontSize * 0.62;
  const effectiveChars = widthChars ?? text.length;
  const vbW = Math.max(60, effectiveChars * charW);
  // vbH = cap height (≈ 0.7 × fontSize) so the viewBox tightly wraps the
  // caps. With dominantBaseline="text-before-edge" and y=0, caps sit at y=0
  // and the baseline lands at y=fontSize — well outside vbH, which is fine
  // since DONOVAN/YOHAN have no descenders.
  const vbH = fontSize * 0.7;

  return (
    <div className="sketchHatchText">
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="xMinYMid meet"
        className={`sketchHatchTextSvg ${hatched ? "is-off" : ""}`}
        aria-hidden
      >
        <text
          x={vbW * 0.012}
          y={vbH}
          textAnchor="start"
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fontSize={fontSize}
          letterSpacing={-8}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={3}
          style={{
            strokeDasharray: 8000,
            strokeDashoffset: 8000,
            animation: `sketchDraw ${SKETCH_DURATION_MS}ms ${delayMs}ms ease-out forwards`,
          }}
        >
          {text}
        </text>
      </svg>
      <div
        className={`sketchHatchTextHatch ${hatched ? "is-on" : ""}`}
        aria-hidden
      >
        <HatchScene
          mask={{
            kind: "text",
            text,
            fontFamily: "Geist Mono",
            fontWeight,
            align: "start",
            widthChars: effectiveChars,
          }}
          height="100%"
          padding={6}
        />
      </div>
      <style jsx>{`
        .sketchHatchText {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .sketchHatchTextSvg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          opacity: 1;
          transition: opacity ${HATCH_FADE_MS}ms ease;
        }
        .sketchHatchTextSvg.is-off {
          opacity: 0;
        }
        .sketchHatchTextHatch {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity ${HATCH_FADE_MS}ms ease;
        }
        .sketchHatchTextHatch.is-on {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

interface SketchedTextProps {
  text: string;
  delayMs?: number;
  fontFamily?: string;
  fontWeight?: number;
  italic?: boolean;
  letterSpacing?: number;
  fillKind?: "ink" | "hatch" | "none";
  widthChars?: number;
  className?: string;
}

const SketchedText = ({
  text,
  delayMs = 0,
  fontFamily = "Geist Mono, ui-monospace, monospace",
  fontWeight = 800,
  italic = false,
  letterSpacing = -8,
  fillKind = "hatch",
  widthChars,
  className,
}: SketchedTextProps) => {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setFilled(true), delayMs + SKETCH_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  const fontSize = 200;
  const charW = fontSize * 0.62;
  const effectiveChars = widthChars ?? text.length;
  const vbW = Math.max(60, effectiveChars * charW);
  const vbH = fontSize * 1.2;

  const fillVal =
    !filled
      ? "transparent"
      : fillKind === "ink"
        ? "var(--ink)"
        : fillKind === "hatch"
          ? `url(#${HATCH_PATTERN_ID}-cross)`
          : "transparent";

  return (
    <div className={`sketchText ${className ?? ""}`}>
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="xMinYMid meet"
        className="sketchTextSvg"
        aria-hidden
      >
        <HatchPatternDefs />
        <text
          x="0"
          y={fontSize}
          textAnchor="start"
          fontFamily={fontFamily}
          fontStyle={italic ? "italic" : "normal"}
          fontWeight={fontWeight}
          fontSize={fontSize}
          letterSpacing={letterSpacing}
          fill={fillVal}
          stroke="var(--ink)"
          strokeWidth={filled ? 0 : 3}
          style={{
            strokeDasharray: 8000,
            strokeDashoffset: 8000,
            animation: `sketchDraw ${SKETCH_DURATION_MS}ms ${delayMs}ms ease-out forwards`,
            transition: `fill 200ms ease, stroke-width 200ms ease`,
          }}
        >
          {text}
        </text>
      </svg>
      <style jsx>{`
        .sketchText {
          width: 100%;
          line-height: 0;
        }
        .sketchTextSvg {
          width: 100%;
          height: auto;
          display: block;
        }
      `}</style>
    </div>
  );
};

const Index = () => {
  return (
    <>
      <Head>
        <title>Donovan Yohan · Senior full-stack engineer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
            <span className="navTitle">Donovan Yohan</span>
          </a>
          <span className="navSpacer" aria-hidden />
          <a
            className={`navLink ${gm500.className}`}
            href="/DonovanYohanResume.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Resume
          </a>
          <a className={`navLink ${gm500.className}`} href="/#work">
            Work
          </a>
          <a className={`navLink ${gm500.className}`} href="/about">
            About
          </a>
          <a className={`navLink ${gm500.className}`} href="#footer">
            Contact
          </a>
        </Stack>
      </Box>

      <DotGrid spacing={16} maxRadiusBoost={1.1} />

      <Box as="main" className="page">
        <Box className="hero">
          <Box className="heroLeft">
            <Box className="logoSlot">
              <SketchedSvgLogo />
            </Box>
            <Box className="nameSlot">
              <Box className="nameRow">
                <SketchedHatchText text="DONOVAN" delayMs={150} widthChars={7} />
              </Box>
              <Box className="nameRow">
                <SketchedHatchText text="YOHAN" delayMs={350} widthChars={7} />
              </Box>
            </Box>
          </Box>

          <Box className="heroRight">
            <div className={`heroLine ${cp400.className}`}>
              <SketchedText
                text="Senior full-stack engineer."
                delayMs={500}
                fontFamily="Crimson Pro, serif"
                fontWeight={400}
                letterSpacing={-2}
                fillKind="ink"
              />
            </div>
            <div className={`heroLine ${cp400.className}`}>
              <SketchedText
                text="Building agentic systems"
                delayMs={1000}
                fontFamily="Crimson Pro, serif"
                fontWeight={400}
                letterSpacing={-2}
                fillKind="ink"
              />
            </div>
            <div className={`heroLine ${cp400.className}`}>
              <SketchedText
                text="that ship faster than they break."
                delayMs={1400}
                fontFamily="Crimson Pro, serif"
                fontWeight={400}
                letterSpacing={-2}
                fillKind="ink"
              />
            </div>
          </Box>
        </Box>
      </Box>

      <style jsx global>{`
        :root {
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
        @keyframes sketchDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      <style jsx global>{`
        .topnav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--paper);
          border-bottom: 1px solid var(--rule);
        }
        .topnavInner {
          max-width: var(--page-max);
          margin: 0 auto;
          padding: 16px 32px;
        }
        .navHome {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: var(--ink);
          text-decoration: none;
        }
        .navHomeMark {
          width: 28px;
          height: 28px;
          display: block;
        }
        .navTitle {
          font-size: 16px;
          letter-spacing: -0.01em;
          font-weight: 800;
        }
        .navSpacer {
          flex: 1 1 auto;
        }
        .navLink {
          font-size: 13px;
          letter-spacing: 0.04em;
          color: var(--ink-soft);
          text-decoration: none;
          transition: color 140ms ease;
        }
        .navLink:hover {
          color: var(--ink);
        }

        .page {
          position: relative;
          z-index: 1;
          max-width: var(--page-max);
          margin: 0 auto;
          padding: 32px;
          min-height: calc(100vh - 56px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
          gap: 64px;
          align-items: center;
          width: 100%;
        }

        .heroLeft {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 32px;
          align-items: start;
          min-width: 0;
        }
        .logoSlot {
          width: clamp(220px, 28vw, 380px);
          flex-shrink: 0;
        }
        .nameSlot {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          width: 100%;
          /* Push the name stack down to sit next to the top of the y-stem in
             the DY logo. */
          margin-top: 108px;
        }
        .nameRow {
          position: relative;
          width: 100%;
          /* Slightly taller than the pure cap-aspect (6/1) so each row has
             a small vertical buffer above/below the letters — Canvas mask
             centres the caps, SVG uses preserveAspectRatio="xMinYMid meet"
             which also centres. */
          aspect-ratio: 5 / 1;
        }

        .heroRight {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .heroLine {
          margin: 0;
          color: var(--ink);
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .heroLeft {
            grid-template-columns: 160px 1fr;
          }
          .logoSlot {
            width: 160px;
          }
        }
      `}</style>
    </>
  );
};

export default Index;
