import Head from "next/head";
import dynamic from "next/dynamic";
import { useContext, useEffect, useRef, useState } from "react";
import type { GetStaticProps } from "next";
import { Box, Stack } from "../components/lab/system";
import Context from "../components/context";
import { getPublicNotes } from "../lib/vault";
import { notesToNotebookMonths } from "../lib/vault/to-notebook";
import type { NotebookMonth } from "../components/lab/Notebook";
import wannaOutline from "../lib/text-outlines/wanna.json";
import chatOutline from "../lib/text-outlines/chat.json";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { themeBootstrap } from "../lib/theme-bootstrap";
import { gm500, gm800, cp400, cp400i } from "../global/fonts";
import { dotGridColor } from "../lib/dot-grid-color";

const DotGrid = dynamic(() => import("../components/lab/DotGrid"), { ssr: false });
const HatchScene = dynamic(() => import("../components/lab/HatchScene"), { ssr: false });
const Notebook = dynamic(() => import("../components/lab/Notebook"), { ssr: false });
const RoughIcon = dynamic(() => import("../components/lab/RoughIcon"), { ssr: false });
import DrawBox from "../components/DrawBox";

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
            /* `butt` caps — `round` would paint a half-disc even when the
               dash length is 0, leaving a visible dot at each slice's start
               point before the animation kicks in. */
            strokeLinecap="butt"
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

interface CurrentWeather {
  temperatureC: number;
  weathercode: number;
  fetchedAt: string;
}

interface ContactFrameProps {
  monoClass: string;
  serifClass: string;
  hatchInk: string;
  weather: CurrentWeather | null;
}

/**
 * `DrawnTitle` — one line of the contact hero. Renders the word twice:
 *
 *   1. An SVG `<text>` outline that draws on via `strokeDasharray` once the
 *      parent section enters the viewport (mirrors the hero DY outline).
 *   2. A `HatchScene` with a text-mask overlay that fades in after the
 *      outline completes, picking up the cross-hatch pencil treatment.
 *
 * HatchScene only mounts after the section is in view, so its internal
 * per-line draw-on intro is synced to when the user can actually see it.
 */
interface DrawnTitleProps {
  outline: { viewBox: string; width: number; height: number; d: string };
  /** Path to the matching filled-silhouette SVG used as the HatchScene mask. */
  maskSrc: string;
  text: string;
  activate: boolean;
  hatchInk: string;
  /** ms after the section enters view before this line starts drawing. */
  delay: number;
}

const TITLE_OUTLINE_MS = 1300;

const DrawnTitle = ({
  outline,
  maskSrc,
  text,
  activate,
  hatchInk,
  delay,
}: DrawnTitleProps) => {
  return (
    <span
      className={`drawnTitle ${activate ? "is-on" : ""}`}
      style={{
        // Animation delay cascades off this inline custom prop so the
        // outline draw + hatch fade-in for each line stay in lock-step.
        ["--drawn-delay" as string]: `${delay}ms`,
        aspectRatio: `${outline.width} / ${outline.height}`,
      }}
    >
      <svg
        className="drawnTitleSvg"
        viewBox={outline.viewBox}
        preserveAspectRatio="xMidYMid meet"
        aria-label={text}
      >
        {/* Same 4-slice pencil draw used on the hero DY mark — each
            slice traces 25 % of the perimeter with its own start time
            so the lines feel hand-drawn rather than zipped together.
            opentype.js baked the path with outer + counter contours, so
            stroking traces the full glyph silhouette including the A
            triangle, R hole, etc. */}
        {activate
          ? Array.from({ length: OUTLINE_SLICES }, (_, k) => (
              <path
                key={k}
                d={outline.d}
                fill="none"
                stroke="currentColor"
                strokeWidth={6}
                strokeLinecap="butt"
                strokeLinejoin="round"
                pathLength={1}
                style={{
                  strokeDasharray: "0 1",
                  strokeDashoffset: -k / OUTLINE_SLICES,
                  animation: `sketchDrawSlice ${OUTLINE_SLICE_MS}ms ${
                    delay + OUTLINE_BASE_DELAY_MS + k * OUTLINE_STAGGER_MS
                  }ms ease-in-out forwards`,
                }}
              />
            ))
          : null}
      </svg>
      {activate ? (
        <span className="drawnTitleHatch" aria-hidden>
          <HatchScene
            mask={{ kind: "svg", src: maskSrc }}
            height="100%"
            padding={0}
            outlineWidth={0}
            mouseRadius={500}
            inkColor={hatchInk}
            introMs={1000}
            /* Wait for the per-line outline slice draw to finish before
               the cross-hatch fades in over it. */
            introDelayMs={
              delay +
              OUTLINE_BASE_DELAY_MS +
              OUTLINE_SLICE_MS +
              (OUTLINE_SLICES - 1) * OUTLINE_STAGGER_MS -
              200
            }
          />
        </span>
      ) : null}
    </span>
  );
};

const SOCIAL_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "GitHub", href: "https://github.com/donovan-yohan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/donovan-yohan/" },
  { label: "Instagram", href: "https://www.instagram.com/donovan.yohan/" },
  { label: "YouTube", href: "https://www.youtube.com/donovanyohan" },
];

/**
 * Live wall clock — re-renders every second. Pure client-side; SSR
 * renders "--:--" so hydration doesn't mismatch with whatever second the
 * server happened to be on.
 */
/**
 * `FlipCard` — one side of the flip-board clock. When `value` changes, the
 * previous value slides down off-screen (clipped by the card's bg) while
 * the new value slides in from the top at the same speed. Overflow on
 * the card hides the off-screen parts. First render does NOT animate;
 * subsequent value swaps do.
 */
const FlipCard = ({ value, badge }: { value: string; badge?: string }) => {
  const prev = useRef(value);
  const [outgoing, setOutgoing] = useState<string | null>(null);
  useEffect(() => {
    if (prev.current !== value) {
      const old = prev.current;
      prev.current = value;
      setOutgoing(old);
      const t = window.setTimeout(() => setOutgoing(null), 500);
      return () => window.clearTimeout(t);
    }
  }, [value]);
  return (
    <span className="flipCard" aria-hidden>
      <span
        key={value}
        className={`flipDigit ${outgoing !== null ? "flipIncoming" : ""}`}
      >
        {value}
      </span>
      {outgoing !== null ? (
        <span className="flipDigit flipOutgoing">{outgoing}</span>
      ) : null}
      <span className="flipSeam" />
      {badge ? <span className="flipAmpm">{badge}</span> : null}
    </span>
  );
};

const useClock = () => {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let interval: number | null = null;
    const tick = () => setNow(new Date());
    const start = () => {
      tick();
      if (interval === null) interval = window.setInterval(tick, 1000);
    };
    const stop = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);
  return now;
};

/**
 * Open-Meteo WMO weather code → emoji + label. Codes follow the WMO
 * Weather interpretation table (open-meteo.com/en/docs#weathervariables).
 * We collapse the long-tail into the six categories most useful for a
 * one-line "what's it doing outside" widget.
 */
type WeatherIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

const WEATHER_CATEGORIES: Array<{
  test: (c: number) => boolean;
  Icon: WeatherIcon;
  label: string;
}> = [
  { test: (c) => c === 0, Icon: Sun, label: "clear" },
  { test: (c) => c >= 1 && c <= 3, Icon: CloudSun, label: "partly cloudy" },
  { test: (c) => c === 45 || c === 48, Icon: CloudFog, label: "fog" },
  {
    test: (c) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82),
    Icon: CloudRain,
    label: "rain",
  },
  { test: (c) => c >= 71 && c <= 77, Icon: CloudSnow, label: "snow" },
  { test: (c) => c >= 95 && c <= 99, Icon: CloudLightning, label: "storms" },
];

const weatherFromCode = (code: number) =>
  WEATHER_CATEGORIES.find((w) => w.test(code)) ?? {
    Icon: Cloud as WeatherIcon,
    label: "clouds",
  };

const ContactFrame = ({
  monoClass,
  serifClass,
  hatchInk,
  weather,
}: ContactFrameProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [hatchDrawing, setHatchDrawing] = useState(false);
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const now = useClock();

  // Trigger draw-on animations once the contact section enters the
  // viewport. One-shot — once it's run, we don't reverse on scroll-out.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // 12-hour wall time. Hours 0 → 12 (midnight reads as 12 AM), 13–23
  // wrap back into 1–11 PM. The AM/PM marker sits in the card corner so
  // the big numerals stay clean.
  let hh = "--";
  let mm = "--";
  let ampm = "";
  if (now) {
    const h24 = now.getHours();
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    // Hours render 1–12 without a leading zero, centered in a fixed-
    // width card. Minutes always pad to two digits (00–59).
    hh = h12.toString();
    mm = now.getMinutes().toString().padStart(2, "0");
    ampm = h24 >= 12 ? "PM" : "AM";
  }
  const colonOn = now ? now.getSeconds() % 2 === 0 : true;

  const monthShort = now
    ? ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][now.getMonth()]
    : "···";
  const dayNum = now ? now.getDate().toString().padStart(2, "0") : "--";
  const yearStr = now ? now.getFullYear().toString() : "----";

  return (
    <section
      ref={sectionRef}
      id="footer"
      className={`contactFrame ${inView ? "is-in" : ""} ${hatchDrawing ? "is-hatch-drawing" : ""}`}
    >
      <div className="contactPage">
        <div className="contactGrid">
          {/* Hero panel — big mono headline + lede + email + socials. */}
          {/* Centerpiece — HatchScene luminance render. Goes FIRST in
              the DOM so the surrounding scraps below paint on top of its
              edges without needing z-index layering. */}
          <div className="contactPanel panelImage">
            <DrawBox drawn={inView} drawMs={900} drawDelayMs={120} />
            <div className="panelImageInner">
              {/* Dark-mode reveal: starts as a solid black slab covering
                  the freshly-mounted HatchScene so users coming from a
                  dark page never get flash-banged by the white paper.
                  Once `is-in` flips, the overlay fades away while the
                  HatchScene's own line draw-on plays, so the panel
                  appears to peel back from fully-hatched to artwork.
                  In light mode the overlay's opacity stays 0 — no-op. */}
              <div className="panelImageReveal" aria-hidden />
              {/* Mount only once the contact section enters the viewport
                  so the HatchScene's own intro animation begins WHEN the
                  user actually sees the panel, not at page load. Before
                  inView the panel reads as plain white paper (light) or
                  the dark reveal overlay (dark). */}
              {inView ? (
                <HatchScene
                  mask={{ kind: "svg", src: "/img/manga/dy-studies-gray.png" }}
                  height="100%"
                  padding={0}
                  outlineWidth={0}
                  /* Tighter hatchScale + thicker line halfWidth on THIS
                     one instance — gives the centerpiece a wider tonal
                     range without affecting the rest of the site's
                     HatchScene usages, which keep their default props. */
                  hatchScale={7}
                  halfWidthV={0.11}
                  mouseRadius={500}
                  peakDensity={1}
                  densityMode="luminance"
                  luminanceBoost={1.0}
                  /* Pinned to light-mode colours regardless of theme so the
                     manga panel always reads as a halftone on white paper.
                     Cursor *removes* hatching in a wide, low-intensity
                     radius (subtle flashlight feel) instead of densifying. */
                  inkColor="#1a1814"
                  paperColor="#ffffff"
                  invertProximity={0.4}
                  introMs={1200}
                  introDelayMs={600}
                  onIntroStart={() => setHatchDrawing(true)}
                />
              ) : null}
            </div>
          </div>

          <div className="contactPanel panelHero">
            <DrawBox drawn={inView} drawMs={900} drawDelayMs={240} />
            <div className="contactHeroTop">
              <div className={`contactTitle ${monoClass}`}>
                <DrawnTitle
                  outline={wannaOutline}
                  maskSrc="/img/wanna-mask.svg"
                  text="WANNA"
                  activate={inView}
                  hatchInk={hatchInk}
                  delay={0}
                />
                <DrawnTitle
                  outline={chatOutline}
                  maskSrc="/img/chat-mask.svg"
                  text="CHAT?"
                  activate={inView}
                  hatchInk={hatchInk}
                  delay={400}
                />
              </div>
              <p className={`contactLede ${serifClass}`}>
                If you are building something with agents, prototyping a
                workflow, or just want to compare notes on tea, I would love
                to hear about what you are working on, and how I can be a
                part of it.
              </p>
            </div>

            <div className="contactGridFooter">
              <div className="contactCol">
                <span className={`contactColLabel ${monoClass}`}>Email</span>
                <a
                  className={`contactPrimary ${monoClass}`}
                  href="mailto:donovanyohan@gmail.com"
                >
                  donovanyohan@gmail.com
                </a>
              </div>
              <div className="contactCol">
                <span className={`contactColLabel ${monoClass}`}>Elsewhere</span>
                <ul className={`contactSocial ${monoClass}`}>
                  {SOCIAL_LINKS.map((s) => (
                    <li key={s.href}>
                      <a href={s.href} target="_blank" rel="noreferrer">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Combined date + clock panel in the top right — calendar
              block sits on top, flip clock directly underneath, sharing
              one wrapping card with no separator gap. */}
          <div className="contactPanel panelDateTime">
            <DrawBox drawn={inView} drawMs={900} drawDelayMs={340} />
            <div className={`dateBox ${monoClass}`}>
              <span className="dateMonth" aria-hidden>
                {monthShort.split("").map((ch, i) => (
                  <span key={i}>{ch}</span>
                ))}
              </span>
              <div className="dateMain">
                <div className="dateStack">
                  <span className="dateDay">{dayNum}</span>
                  <span className="dateYear">
                    {yearStr.split("").map((c, i) => (
                      <span key={i}>{c}</span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
            <div className={`flipClock ${monoClass}`}>
              <FlipCard value={hh} badge={ampm} />
              <span
                className={`flipColon ${colonOn ? "is-on" : ""}`}
                aria-hidden
              >
                :
              </span>
              <FlipCard value={mm} />
            </div>
            <span className="srOnly">
              Today is {monthShort} {dayNum}, {yearStr}. {hh}:{mm} {ampm} in
              Toronto.
            </span>
          </div>

          {/* Weather panel — Open-Meteo current weather for Toronto,
              pulled at build time with ISR revalidate every 30 min. */}
          <div className="contactPanel panelWeather">
            <DrawBox drawn={inView} drawMs={900} drawDelayMs={440} />
            {weather ? (
              (() => {
                const w = weatherFromCode(weather.weathercode);
                const tC = weather.temperatureC;
                const t = Math.round(tempUnit === "C" ? tC : tC * 9 / 5 + 32);
                return (
                  <>
                    <span className={`weatherBar ${monoClass}`}>
                      Toronto · {w.label}
                    </span>
                    <div className="weatherBody">
                      <span className="weatherGlyph">
                        <w.Icon size={56} strokeWidth={1.4} />
                      </span>
                      <span className={`weatherTemp ${monoClass}`}>{t}°</span>
                    </div>
                  </>
                );
              })()
            ) : (
              <>
                <span className={`weatherBar ${monoClass}`}>Toronto · offline</span>
                <div className="weatherBody">
                  <span className={`weatherTemp ${monoClass}`}>—</span>
                </div>
              </>
            )}
            <button
              type="button"
              className={`weatherUnitToggle ${monoClass}`}
              aria-label={`Temperature unit: ${tempUnit}, click to toggle`}
              onClick={() => setTempUnit((u) => (u === "C" ? "F" : "C"))}
            >
              <span className={`weatherUnit ${tempUnit === "C" ? "is-active" : ""}`}>C</span>
              <span aria-hidden>/</span>
              <span className={`weatherUnit ${tempUnit === "F" ? "is-active" : ""}`}>F</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

interface IndexProps {
  notebookMonths: NotebookMonth[];
  weather: CurrentWeather | null;
}

const Index = ({ notebookMonths, weather }: IndexProps) => {
  const { theme, toggleTheme } = useContext(Context);
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
        color={dotGridColor(theme)}
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

        <Box className="historyFrame" id="work">
          <header className="historyHead">
            <span className={`historyKicker ${gm500.className}`}>The bullet journal</span>
            <h2 className={`historyTitle ${gm800.className}`}>MY JOURNAL</h2>
            <p className={`historyLede ${cp400.className}`}>
              Long-form case studies, working essays, and the occasional
              field note. Filter by type below.
            </p>
          </header>

          <Notebook
            monoClass={gm500.className}
            serifClass={cp400.className}
            italicSerifClass={cp400i.className}
            months={notebookMonths.length > 0 ? notebookMonths : undefined}
            cardHrefBuilder={
              notebookMonths.length > 0
                ? (e) => `/work/${e.id}`
                : undefined
            }
          />
        </Box>

        <ContactFrame
          monoClass={gm500.className}
          serifClass={cp400.className}
          hatchInk={hatchInk}
          weather={weather}
        />
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
          /* Four highlighter colours shared across tabs + article titles +
             hero bold spans. Light mode uses classic Stabilo highlighters
             (cyan/pink/lime/yellow); dark mode swaps to darker, saturated
             tones (blue/red/purple/orange) so highlights still read against
             cream-on-dark text. --logo-bg is the brand orange used for the
             nav DY chip, with its own light/dark pair. */
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
          /* Brighter ink in dark mode — Crimson Pro 400 has thin serifs
             that need higher contrast against the deep paper. Soft/mute
             tiers also lift so the lede + meta don't fade. */
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
          /* Full-width row with space-between so the logo chip pins to the
             left padding gutter (matching the history rule) and the tabs +
             theme toggle pin to the right padding gutter. */
          max-width: none;
          margin: 0;
          width: 100%;
          padding: 0 var(--gutter-w);
          height: var(--nav-h);
          justify-content: space-between;
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
        /* History section: solid paper bg across the whole frame so the
           dot grid doesn't bleed through behind the heading or the chip
           bar. The left margin still holds sticky MAY/APR labels; the
           vertical accent rule runs the full height of the section. */
        .historyFrame {
          position: relative;
          padding: 40px var(--content-pad-left) 96px;
          /* Single horizontal rule cleanly separating hero from history. */
          border-top: 1px solid var(--rule);
          /* Offset for the sticky topnav when #work is the scroll target. */
          scroll-margin-top: 48px;
        }
        .historyHead {
          position: relative;
          margin-bottom: 0;
          /* Paper bg bleeds left/right past the historyFrame padding AND
             up through the frame's top padding so the entire band above
             the chip bar is solid — no dots above the bar's bottom rule. */
          background: var(--paper);
          margin-top: -40px;
          margin-left: calc(-1 * var(--content-pad-left));
          margin-right: calc(-1 * var(--content-pad-left));
          padding: 40px var(--content-pad-left) 24px;
        }
        .historyKicker,
        .historyTitle,
        .historyLede {
          max-width: 720px;
        }
        .historyKicker {
          display: block;
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-mute);
          margin-bottom: 6px;
        }
        .historyTitle {
          position: relative;
          isolation: isolate;
          margin: 0 0 10px;
          font-size: clamp(36px, 4.5vw, 56px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          font-weight: 800;
          color: var(--ink);
          /* fit-content so the pink highlighter stripe behind only spans
             the text, not the full column. */
          width: fit-content;
          max-width: 100%;
        }
        .historyTitle::before {
          content: "";
          position: absolute;
          left: -8px;
          right: -8px;
          /* Anchor from baseline-ish: ride the lower half of the cap height
             so the stripe overlaps text instead of dropping below it. */
          bottom: 18%;
          height: 0.45em;
          background: var(--hl-2);
          z-index: -1;
        }
        .historyLede {
          margin: 0;
          font-size: clamp(18px, 1.6vw, 22px);
          line-height: 1.45;
          color: var(--ink-soft);
        }

        /* Contact / footer — tabloid sketchbook layout. Cards float in
           absolute positions, slightly rotated, overlapping like scraps
           pasted onto a journal page. Each card has a paper bg so it
           reads as collage rather than as a transparent grid panel. */
        .contactFrame {
          position: relative;
          min-height: 100vh;
          padding: 96px var(--content-pad-left);
          border-top: 1px solid var(--rule);
          display: flex;
          align-items: center;
        }
        .contactPage {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
        }
        .contactGrid {
          position: relative;
          width: 100%;
          min-height: 80vh;
        }
        /* Flat panels — solid paper bg, simple 1px ink border, no
           rotation, no shadow, no hover lift. They surround the
           HatchScene centerpiece and overlap its edges with the same
           visual weight as the hatched image itself. */
        .contactPanel {
          position: absolute;
          padding: 24px;
          background: var(--paper);
          color: var(--ink);
          /* Border is rendered by an inline RoughBox so it can ink-draw
             on entry. The legacy 1px solid var(--ink) border is dropped;
             the SVG strokes are the only visible edge. */
          opacity: 0;
          transform: translateY(14px);
          transition:
            opacity 700ms ease,
            transform 700ms ease;
        }
        .contactFrame.is-in .contactPanel {
          opacity: 1;
          transform: translateY(0);
        }
        .contactPanel:nth-of-type(1) {
          transition-delay: 120ms;
        }
        .contactPanel:nth-of-type(2) {
          transition-delay: 240ms;
        }
        .contactPanel:nth-of-type(3) {
          transition-delay: 340ms;
        }
        .contactPanel:nth-of-type(4) {
          transition-delay: 440ms;
        }
        .contactPanel:nth-of-type(5) {
          transition-delay: 540ms;
        }
        .contactPanel:nth-of-type(6) {
          transition-delay: 640ms;
        }

        /* Hero copy panel — wide card on the bottom right, overlapping
           the centerpiece's bottom-right corner. Holds title + lede +
           email/social grid. */
        .panelHero {
          right: -2%;
          bottom: -5%;
          width: 64%;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        /* Combined date + clock panel — calendar block stacked above the
           flip clock with no gap. Container-type inline-size lets the
           interior parts scale to the panel's own width via container
           queries (cqi) instead of viewport units. */
        .panelDateTime {
          left: 2%;
          top: 6%;
          width: fit-content;
          padding: 0;
          display: flex;
          flex-direction: column;
          font-size: clamp(11px, 0.95vw, 15px);
        }
        .panelDateTime > .dateBox,
        .panelDateTime > .flipClock {
          width: 100%;
        }
        .panelDateTime > .flipClock {
          border-top: 1px solid var(--ink);
          padding: 8px;
          box-sizing: border-box;
          font-size: 2.6em;
          justify-content: center;
          align-items: center;
          gap: 0.1em;
        }
        .dateBox {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: stretch;
        }
        /* Vertical month slab — black background, cream cut-out letters
           stacked top-to-bottom. Letter-spacing controls vertical rhythm. */
        .dateMonth {
          align-self: stretch;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-around;
          padding: 8px;
          background: var(--ink);
          color: var(--paper);
          font-size: 3.4em;
          font-weight: 800;
          letter-spacing: 0;
          line-height: 0.85;
          text-transform: uppercase;
        }
        .dateMonth span {
          display: block;
        }
        .dateMain {
          align-self: stretch;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          min-width: 0;
        }
        .dateStack {
          display: inline-flex;
          flex-direction: column;
          align-items: stretch;
          max-width: 100%;
        }
        .dateDay {
          align-self: center;
          font-size: 10em;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 0.85;
          font-variant-numeric: tabular-nums;
          color: var(--ink);
        }
        .dateYear {
          margin: 0.15em auto 0;
          width: 65%;
          display: flex;
          justify-content: space-between;
          font-size: 1.3em;
          font-weight: 700;
          letter-spacing: 0;
          color: var(--ink-mute);
          font-variant-numeric: tabular-nums;
        }
        .dateYear span {
          display: inline-block;
        }
        .srOnly {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        /* Retro flip-board alarm clock — two black cards (HH + MM) with
           a horizontal seam line through the middle (the flip line).
           Card size is bounded so the pair fits the panel width without
           overflow. Each card slides old value out / new value in. */
        /* font-size scales with the panel's inline (width) size via
           container queries, so the flip cards always fit the wrapping
           card with consistent margin. Clamped so the type never gets
           cartoonishly small or large. */
        .flipClock {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.1em;
          font-size: clamp(20px, 14cqi, 44px);
          line-height: 1;
        }
        /* Internal flip-clock parts inherit font-size from the .flipClock
           container and size in em so everything scales together with
           the container query above. Single source of truth at the
           container level — no inner clamp/px values fighting it. */
        .flipAmpm {
          position: absolute;
          bottom: 0.45em;
          left: 0.22em;
          font-size: 0.28em;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--paper);
          text-transform: lowercase;
          z-index: 4;
          pointer-events: none;
          line-height: 1;
        }
        .flipCard {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          box-sizing: border-box;
          width: 2.4em;
          height: 1.4em;
          background: var(--ink);
          color: var(--paper);
          border-radius: 0.12em;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          line-height: 1;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        }
        .flipDigit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          line-height: 1;
        }
        /* Slide-in / slide-out keyframes — old value translates down off
           the card, new value drops in from above, simultaneously. */
        .flipIncoming {
          animation: flipIn 500ms cubic-bezier(0.6, 0.05, 0.36, 1) both;
        }
        .flipOutgoing {
          position: absolute;
          inset: 0;
          animation: flipOut 500ms cubic-bezier(0.6, 0.05, 0.36, 1) both;
        }
        @keyframes flipIn {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes flipOut {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100%);
          }
        }
        .flipSeam {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: var(--paper);
          opacity: 0.35;
          transform: translateY(-0.5px);
          pointer-events: none;
          z-index: 3;
        }
        .flipColon {
          font-size: 0.8em;
          font-weight: 800;
          color: var(--ink);
          line-height: 1;
          padding: 0;
          margin: 0 -0.05em;
          opacity: 0;
          transition: opacity 80ms linear;
        }
        .flipColon.is-on {
          opacity: 1;
        }

        /* Weather panel layout — black header bar (theme-aware) with
           location + condition, then big icon + temperature row. */
        .weatherBar {
          display: block;
          background: var(--ink);
          color: var(--paper);
          padding: 10px 16px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .weatherBody {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 16px 44px;
          min-width: 0;
        }
        .weatherGlyph {
          display: inline-flex;
          align-items: center;
          color: var(--ink);
          flex: 0 0 auto;
        }
        .weatherTemp {
          font-size: clamp(48px, 6.2vw, 88px);
          font-weight: 800;
          letter-spacing: -0.06em;
          line-height: 0.85;
          color: var(--ink);
          font-variant-numeric: tabular-nums;
          flex: 1 1 auto;
          min-width: 0;
          text-align: right;
        }
        .weatherUnitToggle {
          position: absolute;
          right: 12px;
          bottom: 10px;
          appearance: none;
          background: transparent;
          border: 0;
          outline: 0;
          box-shadow: none;
          padding: 4px 6px;
          margin: 0;
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          color: var(--ink-mute);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          line-height: 1;
          cursor: pointer;
        }
        .weatherUnitToggle:focus-visible {
          outline: 1px dashed var(--ink-mute);
          outline-offset: 2px;
        }
        .weatherUnit {
          line-height: 1;
        }
        .weatherUnit.is-active {
          color: var(--ink);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        /* Weather — bottom-left, overlapping the centerpiece. */
        .panelWeather {
          left: 6%;
          bottom: -3%;
          width: fit-content;
          max-width: 32%;
          padding: 0;
        }
        /* Centerpiece — HatchScene luminance-mapped render of the codex
           source. Sits centered behind / over the other scraps depending
           on z. Larger than any other panel so the contact section reads
           as the photo first, supporting widgets second. */
        /* Centerpiece — HatchScene luminance render. Flat, centered,
           dominant. Other panels overlap its edges with no z layering
           tricks; whoever paints last in document order wins. */
        .panelImage {
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translateY(0);
          width: 82%;
          max-width: 1300px;
          aspect-ratio: 5 / 4;
          padding: 0;
          overflow: hidden;
        }
        .panelImageInner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 2px;
          overflow: hidden;
          /* The manga panel ignores theme — always white paper so the
             black hatching reads as a print on a sheet, even in dark
             mode. The HatchScene's own paperColor handles the canvas
             fill; this is the fallback for the wrapper edges. */
          background: #ffffff;
        }
        /* Dark-mode reveal mask. Sits above the HatchScene, fully opaque
           by default so the panel starts as a black slab. Transitions to
           transparent once the section flips to .is-in, mirroring the
           timing of the HatchScene's own line-draw intro (introDelayMs +
           introMs). Light mode keeps it at opacity 0 — invisible no-op. */
        .panelImageReveal {
          position: absolute;
          inset: 0;
          background: #000;
          opacity: 0;
          pointer-events: none;
          z-index: 2;
        }
        [data-theme="dark"] .panelImageReveal {
          opacity: 1;
          /* Overlay fades only once HatchScene fires onIntroStart — i.e.
             the mask texture has loaded AND introDelayMs has elapsed,
             so the very first ink strokes are appearing this frame.
             That kills the flash of blank white paper that used to show
             between mount and first hatch frame. */
          transition: opacity 1200ms ease 0ms;
        }
        [data-theme="dark"] .contactFrame.is-hatch-drawing .panelImageReveal {
          opacity: 0;
        }
        .contactHeroTop {
          display: flex;
          align-items: flex-start;
          gap: 28px;
        }
        .contactHeroTop > .contactTitle {
          flex: 0 0 auto;
        }
        .contactHeroTop > .contactLede {
          flex: 1 1 0;
        }
        .contactTitle {
          margin: 0;
          /* DrawnTitle renders SVGs that scale to fill width via their
             baked aspect ratio. Cap the title block's max-width so the
             SVG can't blow up to the full panel width. */
          max-width: 360px;
          font-size: clamp(36px, 4.5vw, 64px);
          line-height: 0.92;
          letter-spacing: -0.04em;
          font-weight: 800;
          color: var(--ink);
          text-transform: uppercase;
          display: flex;
          flex-direction: column;
        }
        /* DrawnTitle wrapper — block-level, aspect ratio set inline from
           the baked outline geometry so the SVG and the overlay hatch
           share the exact same box. */
        .drawnTitle {
          position: relative;
          display: block;
          width: 100%;
          color: var(--ink);
        }
        .drawnTitleSvg {
          display: block;
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        /* Hatch overlay registered with the SVG outline — same container,
           same aspect — so the cross-hatch fades in exactly inside the
           glyph silhouette. Fades in after the slice-draw finishes; the
           shader's own intro animation handles the per-line pencil draw. */
        .drawnTitleHatch {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 700ms ease;
          transition-delay: var(--hatch-fade-delay, 0ms);
          pointer-events: none;
        }
        .drawnTitle.is-on .drawnTitleHatch {
          opacity: 1;
        }
        .contactLede {
          margin: 0;
          max-width: 640px;
          font-size: clamp(16px, 1.4vw, 19px);
          line-height: 1.5;
          color: var(--ink-soft);
        }
        .contactGridFooter {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 24px;
          margin-top: auto;
          padding-top: 16px;
        }
        .contactCol {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .contactColLabel {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        /* Email — same scale as body type with a yellow marker
           highlight stripe behind, like the bold spans in the hero copy.
           background-image + box-decoration-break: clone so the stripe
           clones per line if the address wraps. */
        .contactPrimary {
          font-size: clamp(13px, 1.1vw, 16px);
          letter-spacing: 0.02em;
          color: var(--ink);
          text-decoration: none;
          width: fit-content;
          background-image: linear-gradient(
            to right,
            var(--hl),
            var(--hl)
          );
          background-position: 0 0.65em;
          background-size: 100% 0.55em;
          background-repeat: no-repeat;
          padding: 0 0.1em;
          margin: 0 -0.1em;
          -webkit-box-decoration-break: clone;
          box-decoration-break: clone;
          transition: filter 140ms ease;
        }
        .contactPrimary:hover {
          filter: brightness(1.05);
        }
        .contactSocial {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 6px 16px;
        }
        .contactSocial a {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-soft);
          text-decoration: none;
          transition: color 140ms ease;
        }
        .contactSocial a:hover {
          color: var(--ink);
        }

        @media (max-width: 900px) {
          .contactFrame {
            padding: 64px clamp(24px, 6vw, 64px);
            min-height: auto;
          }
          .contactGrid {
            display: flex;
            flex-direction: column;
            gap: 20px;
            min-height: 0;
          }
          /* Collapse the tabloid offsets so the scraps stack cleanly on
             narrow screens. Tilts get reduced but kept for personality. */
          .contactPanel {
            position: relative;
            left: auto;
            right: auto;
            top: auto;
            bottom: auto;
            width: 100% !important;
            aspect-ratio: auto;
            min-height: auto;
          }
          .panelHero {
            --tilt: 0deg;
            min-height: auto;
          }
          .contactHeroTop {
            flex-direction: column;
            gap: 20px;
          }
          .contactGridFooter {
            grid-template-columns: 1fr;
          }
        }
        /* Left gutter mask — paper bg behind APR/MAY labels for the full
           height of the section. Dots only show in the actual card grid
           column to the right of the rule. */
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
        /* Vertical accent rule running the full height of the section.
           z-index 25 sits above the sticky chip bar (z 20) so the line
           reads as continuous as you scroll past it. */
        .historyFrame::after {
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

        .hero {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0;
          align-items: center;
          width: 95%;
          max-width: 1700px;
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
          /* Sharp ease-in-out so the marker reads as one decisive swipe
             — quick mid-stroke, settles hard at the end. */
          animation: heroHighlight 420ms cubic-bezier(0.9, 0, 0.1, 1) forwards;
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

const loadNotebookMonths = async (): Promise<NotebookMonth[]> => {
  try {
    const notes = await getPublicNotes();
    const surfaced = notes.filter(
      (n) =>
        n.frontmatter.type === "work" || n.frontmatter.type === "writing",
    );
    return notesToNotebookMonths(surfaced);
  } catch (err) {
    console.warn(
      "[index] getPublicNotes() failed, falling back to Notebook mock data:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
};

const loadCurrentWeather = async (): Promise<CurrentWeather | null> => {
  try {
    const r = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832&current_weather=true&temperature_unit=celsius",
      { signal: AbortSignal.timeout(5000) },
    );
    if (!r.ok) return null;
    const data = await r.json();
    const cw = data?.current_weather;
    if (
      cw &&
      typeof cw.temperature === "number" &&
      typeof cw.weathercode === "number"
    ) {
      return {
        temperatureC: cw.temperature,
        weathercode: cw.weathercode,
        fetchedAt: new Date().toISOString(),
      };
    }
    return null;
  } catch (err) {
    console.warn(
      "[index] Open-Meteo fetch failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
};

export const getStaticProps: GetStaticProps<IndexProps> = async () => {
  // Vault walk + Open-Meteo are independent — run them concurrently so
  // build time is max(vault, meteo) rather than the sum. ISR refreshes
  // every 30min, and Open-Meteo can be slow; parallelizing here matters.
  const [notebookMonths, weather] = await Promise.all([
    loadNotebookMonths(),
    loadCurrentWeather(),
  ]);
  return {
    props: { notebookMonths, weather },
    revalidate: 1800,
  };
};

export default Index;
