/**
 * HeroComposition — illustration-led landing card for /about. Centered
 * full-body illustration sits on a paper rectangle; geometric multiply
 * blocks (circle, triangle, striped/lined fills) interact with the figure
 * and the surrounding web UI chrome (chips, index labels, scroll CTA, dot
 * matrix). Palette pulled from the colours in the illustration itself —
 * NASA red + blue — so the comp reads as one piece rather than UI over art.
 *
 * Hard rules: no rotated polaroids, no cursive. Multiply layers flip to
 * screen blend in dark mode so the shapes don't disappear against the dark
 * paper.
 */

import { RefObject, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { HeroFlipbook } from "./HeroFlipbook";
import { RoughSketch } from "./RoughSketch";

const WALK_FRAMES: readonly string[] = [
  "/img/photos/about/hero_animation/walk_1.png",
  "/img/photos/about/hero_animation/walk_2.png",
  "/img/photos/about/hero_animation/walk_3.png",
  "/img/photos/about/hero_animation/walk_4.png",
  "/img/photos/about/hero_animation/walk_5.png",
  "/img/photos/about/hero_animation/walk_6.png",
];

/**
 * Per-frame horizontal offset, as a fraction of the hero panel's width.
 * First few frames sit at 0 (character is turning around in place); the
 * later frames step right as they walk off panel. Position interpolates
 * only inside the crossfade transition band, so the figure reads as
 * "anchored, anchored, anchored, jump, anchored, jump, anchored" —
 * matching how a real flipbook reveals discrete positions instead of
 * a smooth continuous slide.
 *
 * Keep length in sync with WALK_FRAMES.
 */
const FRAME_POSITIONS: readonly number[] = [
  0, // walk_1 — turning, in place
  0, // walk_2 — turning, in place
  0, // walk_3 — turning, now facing right
  0.2, // walk_4 — first step
  0.45, // walk_5 — mid stride
  0.75, // walk_6 — walked out of the frame
];

/**
 * How wide the crossfade band is across one segment (0..1). Smaller
 * = more abrupt frame swap. Both the opacity crossfade and the
 * position interpolation share this band so the two effects stay
 * synchronised.
 */
const TRANSITION_BAND = 0.5;

/**
 * Smoothstep across the transition band; mirrors HeroFlipbook's
 * bandBlend so the position interpolation matches the opacity fade.
 */
const bandBlend = (segLocal: number, band: number) => {
  const half = band / 2;
  const start = 0.5 - half;
  if (segLocal <= start) return 0;
  if (segLocal >= 0.5 + half) return 1;
  const t = (segLocal - start) / band;
  return t * t * (3 - 2 * t);
};

/**
 * Map raw scroll progress 0..1 to the figure's current x offset
 * (as a fraction of hero panel width). Outside the transition band
 * the offset is locked to the current frame's slot; inside the band
 * it interpolates between the current and next frame's slot.
 */
const walkOffsetForProgress = (p: number): number => {
  const N = FRAME_POSITIONS.length;
  if (N === 0) return 0;
  const framePos = p * (N - 1);
  const lo = Math.min(Math.floor(framePos), N - 1);
  const hi = Math.min(lo + 1, N - 1);
  const segLocal = framePos - lo;
  const blend = lo === hi ? 0 : bandBlend(segLocal, TRANSITION_BAND);
  return FRAME_POSITIONS[lo] + (FRAME_POSITIONS[hi] - FRAME_POSITIONS[lo]) * blend;
};

interface HeroCompositionProps {
  monoClass: string;
  monoBoldClass: string;
  serifClass: string;
  italicSerifClass: string;
  /**
   * Horizontal scroller that contains this hero. Used to read
   * `scrollLeft` and map it to flipbook progress so the figure walks
   * forward as the user scrolls right.
   */
  scrollerRef?: RefObject<HTMLElement | null>;
}

const ease = [0.22, 0.61, 0.36, 1] as const;

export const HeroComposition = ({
  monoClass,
  monoBoldClass,
  serifClass,
  italicSerifClass,
  scrollerRef,
}: HeroCompositionProps) => {
  const reduce = useReducedMotion();
  const [drawn, setDrawn] = useState(false);
  const [flipProgress, setFlipProgress] = useState(0);
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDrawn(true), reduce ? 0 : 900);
    return () => window.clearTimeout(t);
  }, [reduce]);

  // Track horizontal scroll progress over the hero panel. Maps
  // scrollLeft / heroWidth into 0..1 and pushes it to the flipbook.
  // rAF-throttled so high-frequency wheel events don't cause render
  // storms on the figure stack.
  useEffect(() => {
    if (reduce) return;
    const scroller = scrollerRef?.current;
    const hero = heroRef.current;
    if (!scroller || !hero) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const w = hero.offsetWidth || 1;
      // hero is the first child of the scroller, so its left edge in
      // the scroll content is at offsetLeft (typically 0). Subtract
      // it anyway to be safe if the layout grows a leading pad later.
      const heroLeft = hero.offsetLeft;
      const local = scroller.scrollLeft - heroLeft;
      const p = Math.max(0, Math.min(1, local / w));
      setFlipProgress(p);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };
    compute();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollerRef, reduce]);

  const fade = (delay: number, y = 24) => ({
    initial: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease },
  });

  // Plain fade-in. The previous version scaled 0.86 → 1 which produced
  // a visible "jump from small to large" right after hydration — the
  // framer-motion transform animated through actual layout sizes, so the
  // figure/frame visibly grew on every mount. Removed the scale step
  // entirely; opacity-only entry has no layout impact.
  const pop = (delay: number) => ({
    initial: reduce ? { opacity: 1 } : { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, delay, ease },
  });

  return (
    <section ref={heroRef} className="heroComp" aria-labelledby="aboutHeroTitle">
      <div className="heroCompInner">
        {/* LEFT — editorial type stack. */}
        <div className="heroType">
          <motion.span className={`heroIndex ${monoClass}`} {...fade(0.05, 12)}>
            <span className={`heroIndexNum ${monoBoldClass}`}>021</span>
            <span className="heroIndexDivider" aria-hidden />
            ABOUT · INDEX · DONOVAN YOHAN
          </motion.span>

          <motion.h1 id="aboutHeroTitle" className={`heroTitle ${monoBoldClass}`} {...fade(0.18)}>
            <span className="heroTitleRow heroTitleKicker">
              ISSUE 021 &nbsp;/&nbsp; SIDE-QUEST GAZETTE
            </span>
            <span className="heroTitleRow heroTitleMega">
              <span className="heroTitleMark heroTitleMarkRed">DONOVAN</span>
            </span>
            <span className="heroTitleRow heroTitleMega">
              <span className="heroTitleMark heroTitleMarkBlue">YOHAN</span>
              <span className="heroTitleSlash" aria-hidden>
                /
              </span>
            </span>
            <span className="heroTitleRow heroTitleDeck">
              THE LONG VERSION, SCROLLED SIDEWAYS &mdash; <br />
              EIGHTEEN BEATS, NEWEST FIRST.
            </span>
          </motion.h1>

          <motion.p className={`heroLead ${serifClass}`} {...fade(0.35)}>
            Senior front-end engineer. Hobby-collector. What follows is{" "}
            <em className={italicSerifClass}>the long version</em> &mdash; one card per beat, newest
            first.
          </motion.p>

          <motion.div className="heroCta" {...fade(0.5, 18)}>
            <span className={`heroCtaPill ${monoBoldClass}`}>
              SCROLL
              <span className="heroCtaPillArrow" aria-hidden>
                <RoughSketch
                  sketch="arrow"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  roughness={2.2}
                  bowing={1.2}
                  seed={11}
                  drawn={drawn}
                  drawMs={700}
                  drawDelayMs={200}
                  style={{ width: "100%", height: "100%" }}
                />
              </span>
            </span>
            <span className={`heroCtaHint ${monoClass}`}>
              <span className="heroCtaHintDesktop">wheel down · or drag</span>
              <span className="heroCtaHintTouch">swipe / drag sideways</span>
            </span>
          </motion.div>

          {/* Dot-matrix anchor, bottom-left corner UI chrome. */}
          <span className="heroDots" aria-hidden />
        </div>

        {/* RIGHT — illustration stage. */}
        <div className="heroStage">
          {/* Striped background block, top-right corner of frame. */}
          <motion.div
            className="bgStripesRed"
            aria-hidden
            initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease }}
          />
          {/* Vertical line column, left of frame. */}
          <motion.div
            className="bgLinesBlue"
            aria-hidden
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
          />

          {/* Paper rectangle frame holding the figure. Frame + shapes +
              chips stay put as scroll progresses; only the figure stack
              inside translates (see .figureImgWrap inline style). Frame
              uses overflow: visible so the walking figure isn't clipped
              when it walks past the right edge of the frame. */}
          <motion.div className="figureFrame" {...pop(0.12)}>
            {/* Multiply shapes that overlap the figure. */}
            <span className="shapeRedCircle" aria-hidden />
            <span className="shapeBlueTriangle" aria-hidden />
            <span className="shapeStripeBlock" aria-hidden />
            <span className="shapeRedBar" aria-hidden />

            {/* Figure stack. translate3d on the wrap (not the frame)
                walks the character horizontally past the frame edge
                while shapes + chips stay anchored to the frame. The
                distance is driven by a CSS custom property so we don't
                have to mirror the panel width in component state — the
                browser does the unit math on every paint. */}
            <div
              className="figureImgWrap"
              style={
                {
                  ["--walk-offset" as string]: walkOffsetForProgress(flipProgress),
                } as React.CSSProperties
              }
            >
              <HeroFlipbook
                progress={flipProgress}
                frames={WALK_FRAMES}
                transitionBand={TRANSITION_BAND}
                alt="Donovan Yohan, illustrated full-body portrait walking"
              />
            </div>

            {/* Web-UI sticker chips on the frame. */}
            <span className={`frameChipTopLeft ${monoBoldClass}`}>
              <span className="chipArrow" aria-hidden>
                &lsaquo;
              </span>{" "}
              021
            </span>
            <span className={`frameChipTopRight ${monoBoldClass}`}>
              <span className="chipDot" aria-hidden />
              ABOUT
            </span>
          </motion.div>

          {/* Rough-sketch zine accents floating around the frame. */}
          <span className="accent accentStar">
            <RoughSketch
              sketch="star"
              stroke="var(--hero-red)"
              strokeWidth={2.4}
              roughness={2.6}
              bowing={1.6}
              seed={3}
              drawn={drawn}
              drawMs={900}
              drawDelayMs={140}
              style={{ width: "100%", height: "100%" }}
            />
          </span>
          <span className="accent accentAsterisk">
            <RoughSketch
              sketch="asterisk"
              stroke="var(--hero-blue)"
              strokeWidth={1.8}
              roughness={2.4}
              bowing={1.4}
              seed={7}
              drawn={drawn}
              drawMs={700}
              drawDelayMs={280}
              style={{ width: "100%", height: "100%" }}
            />
          </span>
          <span className="accent accentSparkle">
            <RoughSketch
              sketch="sparkle"
              stroke="var(--ink)"
              strokeWidth={1.4}
              roughness={2.4}
              bowing={1.8}
              seed={9}
              drawn={drawn}
              drawMs={700}
              drawDelayMs={420}
              style={{ width: "100%", height: "100%" }}
            />
          </span>
        </div>

        {/* Vertical edge label, far right. */}
        <span className={`heroEdge ${monoClass}`}>
          DONOVANYOHAN.COM &nbsp;·&nbsp; ABOUT &nbsp;·&nbsp; 01 / 18
        </span>
      </div>

      <style jsx>{`
        .heroComp {
          flex: 0 0 auto;
          width: var(--hero-panel-w);
          height: 100%;
          background: var(--paper);
          border-right: 1px solid var(--rule);
          position: relative;
          overflow: hidden;
          /* Illustration palette — NASA red + blue pulled from the figure
             so the multiply shapes and the figure read as one piece. */
          --hero-red: #c8102e;
          --hero-blue: #0b3d91;
          --hero-red-soft: rgba(200, 16, 46, 0.85);
          --hero-blue-soft: rgba(11, 61, 145, 0.85);
        }
        [data-theme="dark"] .heroComp {
          --hero-red: #ff5566;
          --hero-blue: #5d8bff;
          --hero-red-soft: rgba(255, 85, 102, 0.7);
          --hero-blue-soft: rgba(93, 139, 255, 0.7);
        }
        .heroCompInner {
          position: relative;
          width: 100%;
          height: 100%;
          padding: calc(2 * var(--u)) calc(3 * var(--u)) calc(2 * var(--u)) var(--content-pad-left);
        }

        /* ---- LEFT type stack -------------------------------------------- */
        .heroType {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: calc(1.25 * var(--u));
          max-width: 600px;
          height: 100%;
          z-index: 3;
        }
        .heroIndex {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        .heroIndexNum {
          display: inline-block;
          background: var(--hero-red);
          color: #fdfdf9;
          padding: 3px 9px;
          letter-spacing: 0.16em;
          font-size: 12px;
        }
        .heroIndexDivider {
          width: 28px;
          height: 1px;
          background: var(--ink-faint);
        }
        .heroTitle {
          margin: 0;
          color: var(--ink);
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .heroTitleRow {
          display: block;
          text-transform: uppercase;
        }
        .heroTitleKicker {
          font-size: 12px;
          letter-spacing: 0.32em;
          color: var(--ink);
          padding: 4px 0;
          border-top: 2px solid var(--ink);
          border-bottom: 1px solid var(--ink);
          margin-bottom: 6px;
        }
        .heroTitleMega {
          font-size: clamp(72px, 11.5vw, 168px);
          line-height: 0.82;
          letter-spacing: -0.06em;
          font-weight: 800;
          /* Tabloid feel: each word jammed against the next row so the
             title block reads as one solid slab. */
          padding: 0;
          margin: 0;
          position: relative;
          white-space: nowrap;
        }
        .heroTitleSlash {
          display: inline-block;
          margin-left: 0.08em;
          color: var(--hero-red);
          font-weight: 800;
        }
        .heroTitleDeck {
          font-size: clamp(11px, 0.95vw, 13px);
          letter-spacing: 0.24em;
          line-height: 1.5;
          color: var(--ink-soft);
          margin-top: 10px;
          padding-top: 6px;
          border-top: 1px solid var(--ink);
        }
        .heroTitleMark {
          display: inline-block;
          padding: 0 0.04em;
          margin: 0 -0.04em;
          color: var(--ink);
          background-image: linear-gradient(to right, var(--hl), var(--hl));
          background-position: 0 88%;
          background-size: 100% 0.18em;
          background-repeat: no-repeat;
        }
        .heroTitleMarkRed {
          --hl: var(--hero-red-soft);
        }
        .heroTitleMarkBlue {
          --hl: var(--hero-blue-soft);
        }
        .heroLead {
          margin: 0;
          font-size: clamp(17px, 1.35vw, 21px);
          line-height: 1.5;
          color: var(--ink-soft);
          max-width: 540px;
        }
        .heroLead em {
          font-style: italic;
          color: var(--ink);
        }
        .heroCta {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          margin-top: calc(0.5 * var(--u));
        }
        .heroCtaPill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px 8px 18px;
          background: var(--ink);
          color: var(--paper);
          font-size: 13px;
          letter-spacing: 0.24em;
          border: 1px solid var(--ink);
          border-radius: 0;
        }
        [data-theme="dark"] .heroCtaPill {
          background: var(--paper);
          color: var(--ink);
        }
        .heroCtaPillArrow {
          width: 36px;
          height: 18px;
        }
        .heroCtaHint {
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        .heroCtaHintTouch {
          display: none;
        }

        /* Dot matrix anchor, lower-left chrome echoing the reference UI. */
        .heroDots {
          position: absolute;
          left: 0;
          bottom: -8px;
          width: 96px;
          height: 64px;
          background-image: radial-gradient(var(--ink-mute) 1.6px, transparent 1.8px);
          background-size: 12px 12px;
          background-position: 0 0;
          opacity: 0.65;
          pointer-events: none;
        }

        /* ---- Illustration stage. Absolutely centered on the entire hero
           panel (not nested inside a grid column) so the figure sits dead-
           center of the page. Type column floats above on the left. ---- */
        .heroStage {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 2;
        }
        .heroStage > * {
          pointer-events: auto;
        }

        /* Background pattern blocks behind the frame. */
        .bgStripesRed {
          position: absolute;
          right: 4%;
          top: 6%;
          width: 38%;
          height: 36%;
          background-image: repeating-linear-gradient(
            135deg,
            var(--hero-red) 0 6px,
            transparent 6px 14px
          );
          opacity: 0.55;
        }
        .bgLinesBlue {
          position: absolute;
          left: 4%;
          bottom: 8%;
          width: 32%;
          height: 30%;
          background-image: repeating-linear-gradient(
            90deg,
            var(--hero-blue) 0 2px,
            transparent 2px 14px
          );
          opacity: 0.45;
        }

        .figureFrame {
          position: relative;
          height: min(82%, 720px);
          /* Aspect tracks the source illustration (941x1672) so the
             outline hugs the photo. */
          aspect-ratio: 941 / 1672;
          /* Transparent: the RGBA PNG sits on whatever the page paper
             is, no white card behind it. */
          background: transparent;
          border: 3px solid var(--ink);
          box-sizing: border-box;
          padding: 10px;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          /* overflow visible so the figure inside can walk past the
             frame's right edge as scroll progresses. */
          overflow: visible;
        }
        /* Registration tick marks at the corners — drafting-table feel.
           Sit just inside the outer border. */
        .figureFrame::before,
        .figureFrame::after {
          content: "";
          position: absolute;
          width: 14px;
          height: 14px;
          border: 1.5px solid var(--ink);
          pointer-events: none;
          z-index: 6;
        }
        .figureFrame::before {
          top: 10px;
          left: 10px;
          border-right: none;
          border-bottom: none;
        }
        .figureFrame::after {
          bottom: 10px;
          right: 10px;
          border-left: none;
          border-top: none;
        }

        /* Flat shapes (no mix-blend-mode). Sit BEHIND the figure (z:1)
           on the transparent frame so the figure illustrates over
           solid color blocks — same visual goal as the reference, no
           blend-mode quirks that paint white backdrops in dark mode. */
        .shapeRedCircle {
          position: absolute;
          left: 18%;
          top: 8%;
          width: 44%;
          aspect-ratio: 1 / 1;
          background: var(--hero-red);
          border-radius: 50%;
          z-index: 1;
        }
        .shapeBlueTriangle {
          position: absolute;
          right: -4%;
          bottom: 2%;
          width: 48%;
          aspect-ratio: 1 / 1;
          background: var(--hero-blue);
          clip-path: polygon(0 100%, 100% 100%, 100% 0);
          z-index: 1;
        }
        .shapeStripeBlock {
          position: absolute;
          right: 6%;
          top: 42%;
          width: 30%;
          height: 12%;
          background-image: repeating-linear-gradient(
            45deg,
            var(--hero-red) 0 3px,
            transparent 3px 8px
          );
          z-index: 1;
        }
        .shapeRedBar {
          position: absolute;
          left: 0;
          top: 56%;
          width: 100%;
          height: 1.6%;
          background: var(--hero-red);
          z-index: 1;
        }

        .figureImgWrap {
          position: absolute;
          inset: 10px;
          z-index: 2;
          pointer-events: none;
          /* GPU-composite the walking figure so the per-frame swap
             doesn't repaint the rest of the frame. The translate
             distance is set in JS via --walk-offset (an absolute
             0..1 fraction of the hero panel's width, computed from
             a per-frame position table — see FRAME_POSITIONS). */
          will-change: transform;
          transform: translate3d(calc(var(--hero-panel-w) * var(--walk-offset, 0)), 0, 0);
        }
        :global(.figureImg) {
          z-index: 2;
        }

        /* Web-UI chips on the frame corners. Sit above the multiply
           shapes so labels stay readable. */
        .frameChipTopLeft,
        .frameChipTopRight,
        .frameChipBottomLeft,
        .frameChipBottomRight {
          position: absolute;
          z-index: 5;
          font-size: 11px;
          letter-spacing: 0.22em;
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
        }
        .frameChipTopLeft {
          top: 12px;
          left: 14px;
        }
        .frameChipTopRight {
          top: 12px;
          right: 14px;
          color: var(--hero-red);
        }
        .frameChipBottomLeft {
          bottom: 12px;
          left: 14px;
          color: var(--ink-mute);
          font-size: 10px;
          letter-spacing: 0.24em;
        }
        .frameChipBottomRight {
          bottom: 12px;
          right: 14px;
          background: var(--ink);
          color: var(--paper);
          padding: 4px 9px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 0.18em;
        }
        [data-theme="dark"] .frameChipBottomRight {
          background: var(--paper);
          color: var(--ink);
        }
        .chipArrow {
          font-size: 14px;
        }
        .chipDot {
          width: 8px;
          height: 8px;
          background: var(--hero-red);
          border-radius: 50%;
        }

        /* Rough-sketch accents around the stage. */
        .accent {
          position: absolute;
          pointer-events: none;
          z-index: 3;
        }
        .accentStar {
          right: 6%;
          top: 4%;
          width: 52px;
          height: 52px;
        }
        .accentAsterisk {
          left: 4%;
          top: 38%;
          width: 36px;
          height: 36px;
        }
        .accentSparkle {
          right: 8%;
          bottom: 10%;
          width: 36px;
          height: 36px;
        }

        .heroEdge {
          position: absolute;
          right: calc(1.25 * var(--u));
          bottom: calc(1.5 * var(--u));
          writing-mode: vertical-rl;
          font-size: 11px;
          letter-spacing: 0.3em;
          color: var(--ink-mute);
          opacity: 0.55;
          z-index: 4;
        }

        @media (max-width: 600px) {
          .heroCompInner {
            padding: calc(2 * var(--u)) var(--u) var(--u);
          }
          .heroType {
            justify-content: flex-start;
            gap: calc(0.9 * var(--u));
            max-width: 100%;
            padding-top: calc(1.25 * var(--u));
          }
          .heroIndex {
            gap: 8px;
            font-size: 9px;
            letter-spacing: 0.16em;
          }
          .heroIndexDivider {
            width: 18px;
          }
          .heroTitleKicker {
            font-size: 9px;
            letter-spacing: 0.18em;
            line-height: 1.35;
            margin-bottom: 4px;
          }
          .heroTitleMega {
            font-size: clamp(50px, 15.5vw, 62px);
            line-height: 0.88;
            letter-spacing: -0.055em;
          }
          .heroTitleDeck {
            font-size: 10px;
            letter-spacing: 0.14em;
            line-height: 1.45;
            max-width: 29ch;
          }
          .heroLead {
            font-size: 16px;
            line-height: 1.45;
            max-width: 30ch;
          }
          .heroCta {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
            margin-top: 2px;
          }
          .heroCtaPill {
            padding: 7px 10px 7px 14px;
            font-size: 11px;
            letter-spacing: 0.18em;
          }
          .heroCtaPillArrow {
            width: 30px;
            height: 16px;
          }
          .heroCtaHintDesktop {
            display: none;
          }
          .heroCtaHintTouch {
            display: inline;
          }
          .heroDots,
          .bgStripesRed,
          .bgLinesBlue,
          .accentAsterisk,
          .accentSparkle,
          .heroEdge {
            display: none;
          }
          .heroStage {
            inset: auto -18px 34px auto;
            width: 170px;
            height: 315px;
            align-items: center;
            justify-content: center;
            opacity: 0.42;
          }
          .figureFrame {
            height: 300px;
            border-width: 2px;
            padding: 7px;
          }
          .figureFrame::before,
          .figureFrame::after {
            width: 10px;
            height: 10px;
          }
          .frameChipTopLeft,
          .frameChipTopRight {
            font-size: 9px;
            letter-spacing: 0.14em;
          }
          .accentStar {
            right: 10px;
            top: auto;
            bottom: 260px;
            width: 34px;
            height: 34px;
            opacity: 0.7;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroComposition;
