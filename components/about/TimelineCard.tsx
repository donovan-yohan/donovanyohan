/**
 * TimelineCard — one beat on the horizontally-scrolling about timeline.
 * Photo or roughjs sketch sits in a rounded frame with an offset "tape
 * sticker" pseudo behind it. Body copy in Crimson Pro, dateline in mono.
 *
 * The card is height-capped to the lane's available vertical space so the
 * page never overflows vertically: media takes a fixed-aspect block at the
 * top of the frame, body text fills what's left below and clips with a
 * line-clamp if the seed copy is too long.
 *
 * Decoration sketches (stars, asterisks, etc.) anchor to the card's outer
 * corners using deterministic offsets so they feel scribbled-on without
 * jumping between renders.
 */

import Image from "next/image";
import { CSSProperties, useMemo } from "react";

import type { TimelineAccent, TimelineEvent } from "../../global/timeline";
import { RoughSketch } from "./RoughSketch";

interface TimelineCardProps {
  event: TimelineEvent;
  monoClass: string;
  serifClass: string;
  italicSerifClass: string;
  drawn: boolean;
  seed: number;
}

const accentVar: Record<TimelineAccent, string> = {
  red: "var(--accent)",
  blue: "rgba(60, 110, 230, 0.85)",
  green: "rgba(120, 180, 80, 0.85)",
  yellow: "rgba(230, 180, 40, 0.9)",
  purple: "rgba(160, 100, 220, 0.85)",
  orange: "rgba(230, 130, 50, 0.9)",
  pink: "rgba(230, 110, 150, 0.9)",
};

const seededFloat = (id: string, salt: string): number => {
  let h = 0;
  const key = id + salt;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return ((h % 2000) / 1000) - 1;
};

interface DecorationAnchor {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: number;
}

const DECORATION_SLOTS: DecorationAnchor[] = [
  { top: "-22px", right: "-18px", size: 48 },
  { bottom: "-20px", left: "-22px", size: 42 },
  { top: "30%", right: "-32px", size: 36 },
  { bottom: "10%", right: "-26px", size: 32 },
];

export const TimelineCard = ({
  event,
  monoClass,
  serifClass,
  italicSerifClass,
  drawn,
  seed,
}: TimelineCardProps) => {
  const tilt = useMemo(() => seededFloat(event.id, "tilt") * 2.4, [event.id]);
  const tapeTilt = useMemo(() => seededFloat(event.id, "tape") * 4, [event.id]);
  const accent = event.accent ? accentVar[event.accent] : "var(--ink)";

  const cardStyle: CSSProperties = {
    transform: `rotate(${tilt}deg)`,
    borderColor: accent,
  };

  return (
    <article className="tCard">
      <div className="tCardFrame" style={cardStyle}>
        <span
          className="tCardTape"
          aria-hidden
          style={{
            transform: `rotate(${tapeTilt + 1.8}deg) translate(8px, 10px)`,
            background: "var(--ink)",
          }}
        />
        <div className="tCardMediaWrap">
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
                stroke={accent}
                strokeWidth={2}
                roughness={2.2}
                bowing={1.6}
                seed={seed}
                drawn={drawn}
                drawMs={900}
                ariaLabel={event.media.alt}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          )}
        </div>
        <div className="tCardBody">
          <span className={`tCardDate ${monoClass}`}>
            {event.stamp ? `${event.stamp} · ${event.year}` : event.year}
          </span>
          <h3 className={`tCardTitle ${serifClass}`}>
            <em className={italicSerifClass}>{event.title}</em>
          </h3>
          <p className={`tCardCopy ${serifClass}`}>{event.body}</p>
        </div>

        {(event.decorations ?? []).slice(0, DECORATION_SLOTS.length).map(
          (dec, i) => {
            const slot = DECORATION_SLOTS[i];
            return (
              <div
                key={`${dec}-${i}`}
                className="tCardDecoration"
                style={{
                  top: slot.top,
                  bottom: slot.bottom,
                  left: slot.left,
                  right: slot.right,
                  width: slot.size,
                  height: slot.size,
                }}
                aria-hidden
              >
                <RoughSketch
                  sketch={dec}
                  stroke="var(--ink-mute)"
                  strokeWidth={1.4}
                  roughness={2.6}
                  bowing={1.8}
                  seed={seed * 13 + i * 7}
                  drawn={drawn}
                  drawMs={1100}
                  drawDelayMs={300 + i * 120}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            );
          },
        )}
      </div>

      <style jsx>{`
        .tCard {
          flex: 0 0 auto;
          width: calc(28 * var(--u));
          height: 100%;
          padding: 0;
          display: flex;
          align-items: center;
        }
        .tCardFrame {
          position: relative;
          width: 100%;
          max-height: 100%;
          border: 1.5px solid;
          border-radius: 18px;
          padding: calc(0.5 * var(--u));
          background: var(--paper-2);
          box-shadow: 0 6px 24px rgba(22, 20, 14, 0.08);
          transform-origin: center;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .tCardTape {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          z-index: -1;
          opacity: 0.92;
        }
        .tCardMediaWrap {
          width: 100%;
          aspect-ratio: 4 / 3;
          max-height: 55%;
          border-radius: 12px;
          overflow: hidden;
          background: var(--paper);
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }
        .tCardMediaWrap :global(.tCardImg) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tCardSketchHolder {
          width: 70%;
          height: 70%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tCardBody {
          display: flex;
          flex-direction: column;
          gap: calc(0.25 * var(--u));
          padding: calc(0.75 * var(--u)) calc(0.25 * var(--u)) 0;
          flex: 1 1 auto;
          min-height: 0;
          overflow: hidden;
        }
        .tCardDate {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-mute);
          flex: 0 0 auto;
        }
        .tCardTitle {
          margin: 0;
          font-size: 24px;
          line-height: 1.1;
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
        .tCardDecoration {
          position: absolute;
          pointer-events: none;
        }
      `}</style>
    </article>
  );
};

export default TimelineCard;
