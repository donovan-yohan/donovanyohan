/**
 * HeroFlipbook — scroll-driven frame swap for the /about hero figure.
 *
 * `progress` is a normalised 0..1 value (mapped externally from the
 * horizontal scroller's scrollLeft over the hero panel's width). Each
 * frame owns one checkpoint along that range; within a checkpoint the
 * frame is fully visible. Between checkpoints there's a narrow fade
 * band so the swap reads as a flipbook page-turn rather than a smooth
 * tween of two overlapping bodies.
 *
 * Two frames are visible at a time (the active one + its neighbour
 * during a transition); the rest sit at opacity 0 but stay mounted so
 * the browser doesn't re-decode them on each crossing.
 */

import Image from "next/image";

interface HeroFlipbookProps {
  /** Normalised scroll progress 0..1. Clamped internally. */
  progress: number;
  /** Frame URLs in order. Index 0 = checkpoint at progress 0. */
  frames: readonly string[];
  /** Alt text applied to every frame. */
  alt: string;
  /**
   * Width of the fade band between adjacent frames, expressed as a
   * fraction of one segment (0..1). 0.1 means each transition occupies
   * the middle 10% of its segment — most of the scroll holds a frame
   * stable, the page-turn happens in a brief window at the checkpoint.
   */
  transitionBand?: number;
  /** sizes attr for next/image. */
  sizes?: string;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Smoothstep across the transition band so the fade has a soft start
 * + stop instead of linear pop-in. Off-band returns 0 / 1.
 */
const bandBlend = (segLocal: number, band: number) => {
  const half = band / 2;
  const start = 0.5 - half;
  const end = 0.5 + half;
  if (segLocal <= start) return 0;
  if (segLocal >= end) return 1;
  const t = (segLocal - start) / band;
  return t * t * (3 - 2 * t);
};

export const HeroFlipbook = ({
  progress,
  frames,
  alt,
  transitionBand = 0.5,
  sizes = "(max-width: 900px) 70vw, 480px",
}: HeroFlipbookProps) => {
  const N = frames.length;
  if (N === 0) return null;

  const p = clamp01(progress);
  // Frame-position along the strip: 0 at the start, N-1 at the end.
  const framePos = p * (N - 1);
  const lo = Math.min(Math.floor(framePos), N - 1);
  const hi = Math.min(lo + 1, N - 1);
  const segLocal = framePos - lo;
  const blend = lo === hi ? 0 : bandBlend(segLocal, transitionBand);

  return (
    <>
      {frames.map((src, i) => {
        const opacity = i === lo ? 1 - blend : i === hi ? blend : 0;
        return (
          <Image
            key={src}
            src={src}
            alt={alt}
            fill
            priority={i === 0}
            className="flipFrame"
            sizes={sizes}
            style={{
              objectFit: "contain",
              objectPosition: "center center",
              pointerEvents: "none",
              opacity,
              // Avoid blurring the underlying frame during the fade —
              // the two layers composite directly without any easing
              // on the property itself; the scroll handler drives all
              // opacity changes.
              transition: "none",
            }}
          />
        );
      })}
      <style jsx>{`
        :global(.flipFrame) {
          /* Stack every frame on top of each other inside the wrap. */
          z-index: 2;
        }
      `}</style>
    </>
  );
};

export default HeroFlipbook;
