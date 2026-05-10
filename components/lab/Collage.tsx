import { useEffect, useMemo, useRef, useState } from "react";
import {
  prepare,
  prepareWithSegments,
  layout,
  measureNaturalWidth,
} from "@chenglou/pretext";

export interface CollageArticle {
  id: string;
  title: string;
  blurb: string;
  date: string; // "YYYY · MM · DD"
  read: string;
  tag?: string;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

interface ParsedDate {
  day: string;
  month: string;
  year: string;
  monthIdx: number;
  iso: string; // "2026-04"
}

const parseDate = (date: string): ParsedDate => {
  const parts = date.split(/[·\-/.\s]+/).filter(Boolean);
  const [y, m, d] = parts;
  const monthIdx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
  return {
    day: d.padStart(2, "0"),
    month: MONTHS[monthIdx],
    year: y,
    monthIdx,
    iso: `${y}-${m.padStart(2, "0")}`,
  };
};

interface CollageProps {
  articles: CollageArticle[];
  monoFamily: string;
  serifFamily: string;
  monoClass: string;
  serifClass: string;
  italicMonoClass?: string;
  italicSerifClass?: string;
  reseed?: number;
}

// ---- Seeded PRNG ----------------------------------------------------------
const hash32 = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length)];

// ---- Recipe (per-article typesetting) -----------------------------------
type Treatment = "plain" | "framed" | "banner" | "boxed-caps" | "hatched-bg" | "underline";

interface Recipe {
  span: number;
  titleFontSize: number;
  titleWeight: number;
  titleTransform: "none" | "uppercase" | "lowercase";
  titleStyle: "normal" | "italic";
  titleFamily: "mono" | "serif";
  treatment: Treatment;
  showBlurb: boolean;
  blurbStyle: "italic" | "normal";
  accentSlot: "title" | "index" | "meta" | "rule";
}

const buildRecipe = (article: CollageArticle, salt: number): Recipe => {
  const seed = hash32(article.id) ^ (salt >>> 0);
  const rng = mulberry(seed);

  const treatment = pick(rng, [
    "plain",
    "plain",
    "plain",
    "framed",
    "framed",
    "banner",
    "boxed-caps",
    "hatched-bg",
    "underline",
  ] as const);

  const span = pick(rng, [3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 8]);
  const isOutlier = rng() > 0.85;
  const baseSizePool =
    span >= 7 ? [32, 36, 40, 44] : span >= 5 ? [24, 26, 28, 32] : [16, 18, 20, 22];
  const outlierPool = span >= 5 ? [48, 52, 56] : [26, 28];
  const titleFontSize = pick(rng, isOutlier ? outlierPool : baseSizePool);

  const titleWeight =
    treatment === "boxed-caps"
      ? pick(rng, [700, 800, 900])
      : pick(rng, [400, 500, 600, 700, 700, 800, 800, 900]);
  const titleTransform =
    treatment === "boxed-caps"
      ? "uppercase"
      : pick(rng, ["none", "none", "none", "none", "uppercase"] as const);
  const titleStyle: "normal" | "italic" =
    treatment === "boxed-caps" ? "normal" : pick(rng, ["normal", "normal", "normal", "italic"]);
  const titleFamily: "mono" | "serif" =
    treatment === "boxed-caps" ? "mono" : pick(rng, ["mono", "mono", "mono", "serif"]);

  return {
    span,
    titleFontSize,
    titleWeight,
    titleTransform,
    titleStyle,
    titleFamily,
    treatment,
    showBlurb: rng() > 0.10,
    blurbStyle: pick(rng, ["normal", "normal", "italic"] as const),
    accentSlot: pick(rng, ["title", "title", "index", "meta", "rule"] as const),
  };
};

// ---- Pretext-driven height measurement ----------------------------------
const EYEBROW_HEIGHT = 18;
const META_HEIGHT = 16;
const PIECE_PADDING_V = 14;

const measureBlock = (
  text: string,
  family: string,
  weight: number,
  fontStyle: "normal" | "italic",
  size: number,
  width: number,
  lineHeight: number
) => {
  const fontShorthand = `${fontStyle === "italic" ? "italic " : ""}${weight} ${size}px ${family}`;
  try {
    const prepared = prepare(text, fontShorthand, { whiteSpace: "normal" });
    return layout(prepared, width, lineHeight);
  } catch {
    const approxLines = Math.max(1, Math.ceil((text.length * size * 0.55) / width));
    return { height: approxLines * lineHeight, lineCount: approxLines };
  }
};

const HORIZONTAL_PAD = 16; // .piece left+right padding combined

const measureArticleAtWidth = (
  article: CollageArticle,
  recipe: Recipe,
  monoFamily: string,
  serifFamily: string,
  widthPx: number
) => {
  const family = recipe.titleFamily === "mono" ? monoFamily : serifFamily;
  const lineHeight = recipe.titleFontSize * 1.1;
  const titleText =
    recipe.titleTransform === "uppercase"
      ? article.title.toUpperCase()
      : recipe.titleTransform === "lowercase"
        ? article.title.toLowerCase()
        : article.title;
  const innerW = Math.max(40, widthPx - HORIZONTAL_PAD);

  const titleH = measureBlock(
    titleText,
    family,
    recipe.titleWeight,
    recipe.titleStyle,
    recipe.titleFontSize,
    innerW,
    lineHeight
  ).height;

  let h = EYEBROW_HEIGHT + 6 + titleH + 8;
  if (recipe.showBlurb) {
    const blurbH = measureBlock(article.blurb, serifFamily, 400, recipe.blurbStyle, 15, innerW, 22).height;
    h += blurbH + 8;
  }
  h += META_HEIGHT + PIECE_PADDING_V;
  return h;
};

// Single pretext-derived natural width per article — title's longest natural line.
const naturalArticleWidth = (
  article: CollageArticle,
  recipe: Recipe,
  monoFamily: string,
  serifFamily: string,
  containerWidth: number
): number => {
  const family = recipe.titleFamily === "mono" ? monoFamily : serifFamily;
  const titleText =
    recipe.titleTransform === "uppercase"
      ? article.title.toUpperCase()
      : recipe.titleTransform === "lowercase"
        ? article.title.toLowerCase()
        : article.title;
  const fontShorthand = `${recipe.titleStyle === "italic" ? "italic " : ""}${recipe.titleWeight} ${recipe.titleFontSize}px ${family}`;
  let naturalW: number;
  try {
    const prepared = prepareWithSegments(titleText, fontShorthand, { whiteSpace: "normal" });
    naturalW = measureNaturalWidth(prepared);
  } catch {
    naturalW = titleText.length * recipe.titleFontSize * 0.55;
  }
  return Math.min(Math.ceil(naturalW + HORIZONTAL_PAD + 8), containerWidth);
};

// ---- Month accent palette -----------------------------------------------
const MONTH_ACCENTS = [
  "#c33548", // red
  "#1f6f8b", // teal
  "#a85a16", // ochre
  "#2c6a3a", // forest
  "#6e3a8a", // plum
  "#1d3e7a", // indigo
  "#c47b1d", // amber
  "#2a7a7a", // pine
];

// ---- Skyline pack (lowest-y, arrival order) -----------------------------
interface SkySegment {
  x: number;
  y: number;
  w: number;
}

const placeOnSkyline = (
  skyline: SkySegment[],
  containerWidth: number,
  itemW: number
): { x: number; y: number; segStart: number; segEnd: number } | null => {
  let best: { x: number; y: number; segStart: number; segEnd: number; waste: number } | null = null;
  for (let i = 0; i < skyline.length; i++) {
    const xStart = skyline[i].x;
    if (xStart + itemW > containerWidth + 0.5) break;
    let widthLeft = itemW;
    let topY = skyline[i].y;
    let j = i;
    while (j < skyline.length && widthLeft > 0.5) {
      if (skyline[j].y > topY) topY = skyline[j].y;
      widthLeft -= skyline[j].w;
      j++;
    }
    if (widthLeft > 0.5) continue;
    let waste = 0;
    for (let k = i; k < j; k++) waste += (topY - skyline[k].y) * skyline[k].w;
    if (
      best === null ||
      topY < best.y - 0.5 ||
      (Math.abs(topY - best.y) < 0.5 && waste < best.waste - 0.5) ||
      (Math.abs(topY - best.y) < 0.5 && Math.abs(waste - best.waste) < 0.5 && xStart < best.x)
    ) {
      best = { x: xStart, y: topY, segStart: i, segEnd: j, waste };
    }
  }
  return best ? { x: best.x, y: best.y, segStart: best.segStart, segEnd: best.segEnd } : null;
};

const liftSkyline = (
  skyline: SkySegment[],
  best: { x: number; y: number; segStart: number; segEnd: number },
  itemW: number,
  itemH: number,
  gap: number
): SkySegment[] => {
  const newTop = best.y + itemH + gap;
  const itemEnd = best.x + itemW;
  const lastSeg = skyline[best.segEnd - 1];
  const rightRemainder = lastSeg.x + lastSeg.w - itemEnd;

  const before = skyline.slice(0, best.segStart);
  const after = skyline.slice(best.segEnd);
  const middle: SkySegment[] = [{ x: best.x, y: newTop, w: itemW }];
  if (rightRemainder > 0.5) {
    middle.push({ x: itemEnd, y: lastSeg.y, w: rightRemainder });
  }
  const merged: SkySegment[] = [];
  for (const seg of [...before, ...middle, ...after]) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.y - seg.y) < 0.5) {
      last.w += seg.w;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
};

// ---- Item types ---------------------------------------------------------
type FlowItem =
  | {
      kind: "article";
      article: CollageArticle;
      recipe: Recipe;
      accent: string;
    }
  | {
      kind: "divider";
      monthLabel: string;
      yearLabel: string;
      accent: string;
      span: number;
      h: number;
    };

interface PackedItem {
  item: FlowItem;
  x: number;
  y: number;
  w: number;
  h: number;
}

const buildFlow = (articles: CollageArticle[]): FlowItem[] => {
  const sorted = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));
  const flow: FlowItem[] = [];
  let lastIso: string | null = null;
  let monthIdx = -1;
  for (const article of sorted) {
    const d = parseDate(article.date);
    if (d.iso !== lastIso) {
      monthIdx++;
      const accent = MONTH_ACCENTS[monthIdx % MONTH_ACCENTS.length];
      flow.push({
        kind: "divider",
        monthLabel: d.month,
        yearLabel: `'${d.year.slice(2)}`,
        accent,
        span: 4,
        h: 168,
      });
      lastIso = d.iso;
    }
    const accent = MONTH_ACCENTS[monthIdx % MONTH_ACCENTS.length];
    flow.push({
      kind: "article",
      article,
      recipe: buildRecipe(article, 0), // recipe rebuilt with salt at pack time
      accent,
    });
  }
  return flow;
};

// Cap title font size so wrapped title fits within MAX_TITLE_LINES.
// Prevents huge font + long title = runaway height.
const MAX_TITLE_LINES = 2;

const fitRecipe = (
  article: CollageArticle,
  recipe: Recipe,
  monoFamily: string,
  serifFamily: string,
  containerWidth: number
): Recipe => {
  const family = recipe.titleFamily === "mono" ? monoFamily : serifFamily;
  const titleText =
    recipe.titleTransform === "uppercase"
      ? article.title.toUpperCase()
      : recipe.titleTransform === "lowercase"
        ? article.title.toLowerCase()
        : article.title;

  let size = recipe.titleFontSize;
  while (size > 14) {
    const fontShorthand = `${recipe.titleStyle === "italic" ? "italic " : ""}${recipe.titleWeight} ${size}px ${family}`;
    try {
      const prepared = prepare(titleText, fontShorthand, { whiteSpace: "normal" });
      const result = layout(prepared, containerWidth - HORIZONTAL_PAD - 8, size * 1.1);
      if (result.lineCount <= MAX_TITLE_LINES) break;
    } catch {
      break;
    }
    size = Math.max(14, Math.floor(size * 0.85));
  }
  return size === recipe.titleFontSize ? recipe : { ...recipe, titleFontSize: size };
};

// Force a placement at x=0 (dividers stay anchored to left edge).
const placeAtX0 = (
  skyline: SkySegment[],
  itemW: number
): { x: number; y: number; segStart: number; segEnd: number } | null => {
  if (skyline.length === 0 || skyline[0].x > 0.5) return null;
  let widthLeft = itemW;
  let topY = skyline[0].y;
  let j = 0;
  while (j < skyline.length && widthLeft > 0.5) {
    if (skyline[j].y > topY) topY = skyline[j].y;
    widthLeft -= skyline[j].w;
    j++;
  }
  if (widthLeft > 0.5) return null;
  return { x: 0, y: topY, segStart: 0, segEnd: j };
};

const packFlow = (
  articles: CollageArticle[],
  monoFamily: string,
  serifFamily: string,
  containerWidth: number,
  gap: number,
  salt: number
): { packed: PackedItem[]; totalHeight: number } => {
  const flow = buildFlow(articles).map((it): FlowItem => {
    if (it.kind === "article") {
      const fitted = fitRecipe(
        it.article,
        buildRecipe(it.article, salt),
        monoFamily,
        serifFamily,
        containerWidth
      );
      return { ...it, recipe: fitted };
    }
    return it;
  });

  let skyline: SkySegment[] = [{ x: 0, y: 0, w: containerWidth }];
  const placed: PackedItem[] = [];

  for (const item of flow) {
    let w: number;
    let h: number;
    if (item.kind === "divider") {
      const label = `${item.monthLabel}${item.yearLabel}`;
      const fontShorthand = `900 132px ${monoFamily}`;
      try {
        const prepared = prepareWithSegments(label, fontShorthand, { whiteSpace: "normal" });
        w = Math.ceil(measureNaturalWidth(prepared)) + 24;
      } catch {
        w = 360;
      }
      w = Math.min(w, containerWidth);
      h = item.h;
    } else {
      w = naturalArticleWidth(item.article, item.recipe, monoFamily, serifFamily, containerWidth);
      h = measureArticleAtWidth(item.article, item.recipe, monoFamily, serifFamily, w);
    }

    const place =
      item.kind === "divider"
        ? placeAtX0(skyline, w)
        : placeOnSkyline(skyline, containerWidth, w);
    if (!place) continue;
    placed.push({ item, x: place.x, y: place.y, w, h });
    skyline = liftSkyline(skyline, place, w, h, gap);
  }

  const totalHeight = skyline.reduce((m, s) => Math.max(m, s.y), 0);
  return { packed: placed, totalHeight };
};

// ---- Component ----------------------------------------------------------
const Collage = ({
  articles,
  monoFamily,
  serifFamily,
  monoClass,
  serifClass,
  italicMonoClass,
  italicSerifClass,
  reseed = 0,
}: CollageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(960);
  const [focused, setFocused] = useState<string | null>(null);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(e.contentRect.width);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (typeof document !== "undefined" && (document as Document & { fonts?: FontFaceSet }).fonts) {
      (document as Document & { fonts?: FontFaceSet }).fonts!.ready.then(() => {
        if (!cancelled) setFontsReady(true);
      });
    } else {
      setFontsReady(true);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const gap = 12;

  const { packed, totalHeight } = useMemo(() => {
    if (!fontsReady) return { packed: [] as PackedItem[], totalHeight: 0 };
    return packFlow(articles, monoFamily, serifFamily, containerWidth, gap, reseed);
  }, [articles, monoFamily, serifFamily, containerWidth, reseed, fontsReady]);

  return (
    <div className="collageRoot">
      <div ref={containerRef} className="collageCanvas" style={{ height: totalHeight || 600 }}>
        {(() => {
          // Find focused article's month so we can dim other-month dividers.
          let focusedMonth: string | null = null;
          if (focused) {
            const f = articles.find((a) => a.id === focused);
            if (f) focusedMonth = parseDate(f.date).iso;
          }
          return packed.map((p, i) => {
          if (p.item.kind === "divider") {
            const monthIso = `${p.item.yearLabel.replace("'", "20")}-${String(MONTHS.indexOf(p.item.monthLabel) + 1).padStart(2, "0")}`;
            const dimDivider = focused !== null && focusedMonth !== monthIso;
            return (
              <header
                key={`d-${i}`}
                className={`divider ${dimDivider ? "isDim" : ""}`}
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.w,
                  height: p.h,
                  ["--month-accent" as string]: p.item.accent,
                }}
              >
                <span
                  className={`dividerBig ${monoClass}`}
                  style={{
                    fontSize: 132,
                    fontWeight: 900,
                    color: p.item.accent,
                    letterSpacing: "-0.06em",
                    lineHeight: 0.85,
                  }}
                >
                  {p.item.monthLabel}
                </span>
                <span
                  className={`dividerYear ${monoClass}`}
                  style={{
                    fontSize: 32,
                    fontWeight: 500,
                    color: p.item.accent,
                    opacity: 0.55,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {p.item.yearLabel}
                </span>
              </header>
            );
          }
          const { article, recipe, accent } = p.item;
          const isHot = focused === article.id;
          const isDim = focused !== null && !isHot;
          const family = recipe.titleFamily === "mono" ? monoClass : serifClass;
          const italicClass =
            recipe.titleStyle === "italic"
              ? recipe.titleFamily === "mono"
                ? italicMonoClass
                : italicSerifClass
              : "";
          const d = parseDate(article.date);
          const indexNum = String((hash32(article.id) % 99) + 1).padStart(2, "0");
          const t = recipe.treatment;
          const slot = recipe.accentSlot;
          return (
            <article
              key={article.id}
              className={`piece t-${t} ${isHot ? "isHot" : ""} ${isDim ? "isDim" : ""}`}
              style={{
                left: p.x,
                top: p.y,
                width: p.w,
                height: p.h,
                ["--month-accent" as string]: accent,
              }}
              onMouseEnter={() => setFocused(article.id)}
              onMouseLeave={() => setFocused(null)}
              onFocus={() => setFocused(article.id)}
              onBlur={() => setFocused(null)}
              tabIndex={0}
            >
              <span
                className={`pieceIndex ${monoClass}`}
                style={slot === "index" ? { color: accent, opacity: 1, fontWeight: 700 } : undefined}
              >
                {indexNum}
              </span>

              <p className={`pieceEyebrow ${monoClass}`}>
                {d.month} {d.day}, {d.year}
                {article.tag ? ` · ${article.tag}` : ""}
              </p>
              {t === "banner" && <hr className="bannerRule top" />}
              <h3
                className={`pieceTitle ${family} ${italicClass ?? ""}`}
                style={{
                  fontSize: recipe.titleFontSize,
                  fontWeight: recipe.titleWeight,
                  textTransform: recipe.titleTransform,
                  fontStyle: recipe.titleStyle,
                  lineHeight: 1.1,
                  color: slot === "title" ? accent : undefined,
                }}
              >
                {article.title}
              </h3>
              {t === "banner" && <hr className="bannerRule bottom" />}
              {t === "underline" && <span className="underlineBar" aria-hidden />}
              {recipe.showBlurb && (
                <p
                  className={`pieceBlurb ${serifClass} ${
                    recipe.blurbStyle === "italic" ? italicSerifClass ?? "" : ""
                  }`}
                  style={{ fontStyle: recipe.blurbStyle }}
                >
                  {article.blurb}
                </p>
              )}
              <p
                className={`pieceMeta ${monoClass}`}
                style={slot === "meta" ? { color: accent, fontWeight: 700 } : undefined}
              >
                {article.read} read
                {article.tag ? ` · ${article.tag}` : ""}
              </p>
            </article>
          );
          });
        })()}
      </div>

      <style jsx global>{`
        .collageRoot {
          width: 100%;
        }
        .collageCanvas {
          position: relative;
          width: 100%;
        }
        .divider {
          position: absolute;
          display: flex;
          align-items: baseline;
          gap: 8px;
          line-height: 1;
          padding: 8px 0 0;
          pointer-events: none;
        }
        .piece {
          position: absolute;
          padding: 6px 10px 12px;
          background: transparent;
          color: var(--ink);
          transition:
            opacity 220ms ease,
            filter 220ms ease;
          cursor: pointer;
          overflow: hidden;
        }
        .pieceIndex {
          position: absolute;
          top: 4px;
          right: 8px;
          font-size: 9px;
          letter-spacing: 0.16em;
          color: var(--ink-faint);
          opacity: 0.7;
          z-index: 1;
        }
        .piece.t-framed {
          border: 1.5px solid var(--month-accent);
          padding: 12px 14px 14px;
        }
        .piece.t-banner .bannerRule {
          margin: 4px 0;
          border: 0;
          border-top: 2px solid var(--month-accent);
        }
        .piece.t-banner .bannerRule.bottom {
          border-top: 0;
          border-bottom: 2px solid var(--month-accent);
        }
        .piece.t-banner .pieceTitle {
          padding: 4px 0;
          text-align: center;
        }
        .piece.t-boxed-caps {
          background: var(--month-accent);
          color: var(--paper);
          padding: 12px 14px 14px;
        }
        .piece.t-boxed-caps .pieceEyebrow,
        .piece.t-boxed-caps .pieceMeta,
        .piece.t-boxed-caps .pieceIndex {
          color: rgba(255, 255, 255, 0.7);
        }
        .piece.t-boxed-caps .pieceTitle {
          color: var(--paper);
        }
        .piece.t-hatched-bg {
          background-image: repeating-linear-gradient(
            -45deg,
            transparent 0,
            transparent 6px,
            rgba(22, 20, 14, 0.06) 6px,
            rgba(22, 20, 14, 0.06) 7px
          );
          padding: 10px 12px 12px;
        }
        .piece.t-underline .underlineBar {
          display: block;
          height: 6px;
          width: 60%;
          background: var(--month-accent);
          margin: 8px 0 4px;
        }
        .piece:focus {
          outline: none;
        }
        .piece .pieceEyebrow {
          color: var(--month-accent);
        }
        .piece.isDim,
        .divider.isDim {
          opacity: 0.18;
          filter: blur(0.4px) saturate(0.5);
        }
        .piece.isHot {
          z-index: 5;
        }
        .pieceEyebrow {
          margin: 0 0 6px;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        .pieceTitle {
          margin: 0;
          letter-spacing: -0.01em;
          color: inherit;
          word-break: break-word;
          hyphens: auto;
        }
        .pieceRule {
          margin: 8px 0;
          border: 0;
          border-top: 1px solid var(--ink-faint);
        }
        .pieceBlurb {
          margin: 8px 0 0;
          font-size: 15px;
          line-height: 1.45;
          color: var(--ink-soft);
        }
        .pieceMeta {
          margin: 8px 0 0;
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }

        @media (max-width: 800px) {
          .divider .dividerBig {
            font-size: 88px !important;
          }
          .divider .dividerYear {
            font-size: 22px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Collage;
