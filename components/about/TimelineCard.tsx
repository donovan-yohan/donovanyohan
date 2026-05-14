/**
 * TimelineCard — one beat on the horizontally-scrolling about timeline.
 * Graphic-design poster comp: hard-edged frame, an accent color strip
 * along the top with the dateline reversed out of it, the media sitting in
 * a clean frame on top of an offset geometric shape, and a serif body with
 * a highlighter-marked keyword in the title. No tilt, no cursive — every
 * element is grid-aligned and typographically serious.
 *
 * Each card stages its entry through framer-motion when its parent flips
 * `drawn` (the IntersectionObserver in `pages/about.tsx` controls that). The
 * rough-sketch corner doodle plays the existing draw-on after the geometry
 * has landed so the ink lands last.
 */

import Image from "next/image";
import { CSSProperties, useContext, useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

import type { TimelineAccent, TimelineEvent } from "../../global/timeline";
import Context from "../context";
import { HiSpan, type HiSlot } from "../Highlighter";
import { RoughSketch } from "./RoughSketch";

interface TimelineCardProps {
  event: TimelineEvent;
  monoClass: string;
  monoBoldClass: string;
  serifClass: string;
  italicSerifClass: string;
  drawn: boolean;
  seed: number;
}

interface AccentSpec {
  /** Solid color used on bands, sticker, frame outline. */
  band: string;
  /** Highlighter slot 1..4 for HiSpan palette lookup. Falls back to
   *  `markColor` when a colour outside the palette is needed. */
  markSlot?: HiSlot;
  /** Theme-keyed explicit mark colour for off-palette accents. */
  markColor?: { light: string; dark: string };
  /** Soft shape colour used on the offset background block. */
  shape: string;
  /** Whether the offset background shape should render as a circle. */
  shapeCircle: boolean;
}

const accentMap: Record<TimelineAccent, AccentSpec> = {
  red: {
    band: "var(--accent)",
    markColor: {
      light: "rgba(195, 53, 72, 0.18)",
      dark: "rgba(234, 91, 111, 0.2)",
    },
    shape: "var(--accent-soft)",
    shapeCircle: false,
  },
  yellow: {
    band: "var(--hl-4)",
    markSlot: 4,
    shape: "var(--hl-4)",
    shapeCircle: true,
  },
  pink: {
    band: "var(--hl-2)",
    markSlot: 2,
    shape: "var(--hl-2)",
    shapeCircle: false,
  },
  green: {
    band: "var(--hl-3)",
    markSlot: 3,
    shape: "var(--hl-3)",
    shapeCircle: true,
  },
  blue: {
    band: "var(--hl-1)",
    markSlot: 1,
    shape: "var(--hl-1)",
    shapeCircle: false,
  },
  purple: {
    band: "rgba(160, 100, 220, 0.85)",
    markColor: {
      light: "rgba(160, 100, 220, 0.4)",
      dark: "rgba(160, 100, 220, 0.4)",
    },
    shape: "rgba(160, 100, 220, 0.28)",
    shapeCircle: true,
  },
  orange: {
    band: "rgba(230, 130, 50, 0.92)",
    markColor: {
      light: "rgba(230, 130, 50, 0.42)",
      dark: "rgba(230, 130, 50, 0.42)",
    },
    shape: "rgba(230, 130, 50, 0.3)",
    shapeCircle: false,
  },
};

const defaultAccent: AccentSpec = {
  band: "var(--ink)",
  markSlot: 4,
  shape: "var(--ink-faint)",
  shapeCircle: false,
};

/**
 * Pick a word in the title to wear the highlighter mark. Picks the longest
 * word that isn't the first article-y word, so the mark lands somewhere
 * meaningful. Deterministic per title — no randomness across renders.
 */
const splitTitleForMark = (title: string): { lead: string; mark: string; tail: string } => {
  const words = title.split(/(\s+)/);
  let bestIdx = -1;
  let bestLen = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (/^\s+$/.test(w)) continue;
    if (i < 2 && w.length <= 3) continue;
    const len = w.replace(/[^\p{L}\p{N}]/gu, "").length;
    if (len > bestLen) {
      bestLen = len;
      bestIdx = i;
    }
  }
  if (bestIdx < 0) return { lead: title, mark: "", tail: "" };
  return {
    lead: words.slice(0, bestIdx).join(""),
    mark: words[bestIdx],
    tail: words.slice(bestIdx + 1).join(""),
  };
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const riseVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 0.61, 0.36, 1] } },
};

const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] } },
};

const slideVariants: Variants = {
  hidden: { opacity: 0, x: -12, y: 12 },
  visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] } },
};

export const TimelineCard = ({
  event,
  monoClass,
  monoBoldClass,
  serifClass,
  italicSerifClass,
  drawn,
  seed,
}: TimelineCardProps) => {
  const reduce = useReducedMotion();
  const { theme } = useContext(Context);
  const accent = event.accent ? accentMap[event.accent] : defaultAccent;
  const markColorValue = accent.markColor
    ? accent.markColor[theme === "dark" ? "dark" : "light"]
    : undefined;

  const { lead, mark, tail } = useMemo(
    () => splitTitleForMark(event.title),
    [event.title],
  );

  const dateline = event.stamp
    ? `${event.stamp} · ${event.year}`
    : `${event.year}`;

  const frameStyle: CSSProperties = {
    borderColor: accent.band,
  };
  const bandStyle: CSSProperties = {
    background: accent.band,
  };
  const shapeStyle: CSSProperties = {
    background: accent.shape,
    borderRadius: accent.shapeCircle ? "50%" : 0,
  };

  return (
    <motion.article
      className="tCard"
      variants={containerVariants}
      initial={reduce ? "visible" : "hidden"}
      animate={drawn || reduce ? "visible" : "hidden"}
    >
      <div className="tCardFrame" style={frameStyle}>
        {/* Top accent band — date stamp reversed out of it. */}
        <motion.div className="tCardBand" style={bandStyle} variants={slideVariants}>
          <span className={`tCardBandText ${monoBoldClass}`}>{dateline}</span>
          <span className={`tCardBandIndex ${monoClass}`}>
            {String(seed).padStart(2, "0")}
          </span>
        </motion.div>

        {/* Media — clean frame, offset geometric shape behind. */}
        <div className="tCardMediaWrap">
          <motion.span
            className="tCardShape"
            style={shapeStyle}
            variants={popVariants}
            aria-hidden
          />
          <motion.div className="tCardMediaFrame" variants={popVariants}>
            {event.media.kind === "img" && event.media.src ? (
              <Image
                src={event.media.src}
                alt={event.media.alt}
                width={event.media.width ?? 480}
                height={event.media.height ?? 360}
                className="tCardImg"
                sizes="(max-width: 800px) 70vw, 420px"
              />
            ) : (
              <div className="tCardSketchHolder">
                <RoughSketch
                  sketch={event.media.sketch}
                  stroke={accent.band}
                  strokeWidth={2}
                  roughness={2.2}
                  bowing={1.6}
                  seed={seed}
                  drawn={drawn}
                  drawMs={900}
                  drawDelayMs={300}
                  ariaLabel={event.media.alt}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Body. */}
        <motion.div className="tCardBody" variants={riseVariants}>
          <h3 className={`tCardTitle ${serifClass}`}>
            {lead}
            {mark ? (
              <HiSpan
                slot={accent.markSlot ?? 4}
                color={markColorValue}
                style={{
                  backgroundSize: "100% 0.7em",
                  backgroundPosition: "0 80%",
                }}
              >
                <em className={italicSerifClass}>{mark}</em>
              </HiSpan>
            ) : null}
            {tail}
          </h3>
          <p className={`tCardCopy ${serifClass}`}>{event.body}</p>
        </motion.div>

        {/* Corner sketch decoration — zine accent. */}
        {event.decorations && event.decorations.length > 0 ? (
          <span className="tCardDeco" aria-hidden>
            <RoughSketch
              sketch={event.decorations[0]}
              stroke="var(--ink-mute)"
              strokeWidth={1.4}
              roughness={2.6}
              bowing={1.8}
              seed={seed * 13}
              drawn={drawn}
              drawMs={900}
              drawDelayMs={520}
              style={{ width: "100%", height: "100%" }}
            />
          </span>
        ) : null}
      </div>

      <style jsx>{`
        .tCard {
          flex: 0 0 auto;
          width: calc(28 * var(--u));
          height: 100%;
          display: flex;
          align-items: center;
        }
        .tCardFrame {
          position: relative;
          width: 100%;
          max-height: 100%;
          border: 1.5px solid;
          background: var(--paper-2);
          box-shadow:
            6px 6px 0 0 var(--ink),
            0 0 0 1px var(--ink) inset;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        :global([data-theme="dark"]) .tCardFrame {
          box-shadow:
            6px 6px 0 0 rgba(250, 247, 236, 0.12),
            0 0 0 1px rgba(250, 247, 236, 0.18) inset;
        }
        .tCardBand {
          flex: 0 0 auto;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: var(--ink);
        }
        .tCardBandText {
          font-size: 12px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .tCardBandIndex {
          font-size: 11px;
          letter-spacing: 0.24em;
          color: var(--ink-soft);
        }
        .tCardMediaWrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          max-height: 55%;
          flex: 0 0 auto;
          padding: calc(0.75 * var(--u));
          display: flex;
        }
        .tCardShape {
          position: absolute;
          left: 8%;
          top: 12%;
          width: 78%;
          height: 78%;
        }
        .tCardMediaFrame {
          position: relative;
          z-index: 1;
          width: 86%;
          height: 100%;
          margin-left: auto;
          background: var(--paper);
          border: 1.5px solid var(--ink);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        :global(.tCardImg) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .tCardSketchHolder {
          width: 72%;
          height: 72%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tCardBody {
          display: flex;
          flex-direction: column;
          gap: calc(0.4 * var(--u));
          padding: calc(0.5 * var(--u)) calc(0.9 * var(--u)) calc(0.9 * var(--u));
          flex: 1 1 auto;
          min-height: 0;
          overflow: hidden;
        }
        .tCardTitle {
          margin: 0;
          font-size: 22px;
          line-height: 1.12;
          font-weight: 400;
          color: var(--ink);
          flex: 0 0 auto;
        }
        .tCardCopy {
          margin: 0;
          font-size: 14px;
          line-height: 1.45;
          color: var(--ink-soft);
          flex: 1 1 auto;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
        }
        .tCardDeco {
          position: absolute;
          right: -14px;
          bottom: -14px;
          width: 56px;
          height: 56px;
          pointer-events: none;
          z-index: 2;
        }
      `}</style>
    </motion.article>
  );
};

export default TimelineCard;
