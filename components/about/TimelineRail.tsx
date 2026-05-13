/**
 * TimelineRail — strip of year markers sitting above the timeline lane.
 * Lives inside the same horizontally-scrolling block as the lane, so its
 * ticks scroll naturally with the cards — no scrollX prop needed.
 *
 * Layout matches the lane exactly: each tick is positioned using the same
 * `cardStrideX` / `leftPadX` constants the lane uses, so a tick at year Y
 * sits centered above the cards belonging to that year.
 */

import { CSSProperties, useMemo } from "react";

import type { TimelineEvent } from "../../global/timeline";

interface TimelineRailProps {
  events: TimelineEvent[];
  /** Stride from one card's left edge to the next, in px (card + gap). */
  cardStrideX: number;
  /** Width of a single card, in px. Used to center ticks over their card. */
  cardWidthX: number;
  /** Left padding before the first card, in px. */
  leftPadX: number;
  /** Right padding after the last card, in px. Used to size the rail. */
  rightPadX: number;
  monoClass: string;
  scriptClass: string;
}

interface YearTick {
  year: number;
  /** Center x of all events tagged with this year, in px from rail origin. */
  centerX: number;
  /** Whether to render the big handwritten label. */
  emphasize: boolean;
  /** Stamp (NOW / START) if any of the events for this year has one. */
  stamp?: string;
}

export const TimelineRail = ({
  events,
  cardStrideX,
  cardWidthX,
  leftPadX,
  rightPadX,
  monoClass,
  scriptClass,
}: TimelineRailProps) => {
  const ticks = useMemo<YearTick[]>(() => {
    const byYear = new Map<number, { indices: number[]; stamp?: string }>();
    events.forEach((e, i) => {
      const bucket = byYear.get(e.year) ?? { indices: [] as number[] };
      bucket.indices.push(i);
      if (e.stamp) bucket.stamp = e.stamp;
      byYear.set(e.year, bucket);
    });
    const result: YearTick[] = [];
    const sortedYears = [...byYear.keys()].sort((a, b) => b - a);
    sortedYears.forEach((year, idx) => {
      const bucket = byYear.get(year);
      if (!bucket) return;
      const avgIndex =
        bucket.indices.reduce((s, n) => s + n, 0) / bucket.indices.length;
      const centerX = leftPadX + avgIndex * cardStrideX + cardWidthX / 2;
      result.push({
        year,
        centerX,
        emphasize: idx === 0 || idx === sortedYears.length - 1 || idx % 2 === 0,
        stamp: bucket.stamp,
      });
    });
    return result;
  }, [events, cardStrideX, cardWidthX, leftPadX]);

  // Lane width = leftPad + n cards + (n - 1) gaps + rightPad.
  // = leftPad + n*cardWidth + (n-1)*(stride - cardWidth) + rightPad.
  const gapX = cardStrideX - cardWidthX;
  const trackWidth =
    leftPadX +
    events.length * cardWidthX +
    Math.max(0, events.length - 1) * gapX +
    rightPadX;

  const trackStyle: CSSProperties = { width: trackWidth };

  return (
    <div className="rail" aria-hidden>
      <div className="railTrack" style={trackStyle}>
        {ticks.map((t) => (
          <div key={t.year} className="railTick" style={{ left: t.centerX }}>
            <span className="railTickMark" />
            {t.stamp ? (
              <span className={`railStamp ${scriptClass}`}>{t.stamp}</span>
            ) : null}
            <span
              className={`railYear ${t.emphasize ? scriptClass : monoClass} ${
                t.emphasize ? "railYearBig" : "railYearSmall"
              }`}
            >
              {t.year}
            </span>
          </div>
        ))}
      </div>
      <div className="railRule" aria-hidden style={{ width: trackWidth }} />

      <style jsx>{`
        .rail {
          position: relative;
          height: calc(5 * var(--u));
          flex: 0 0 auto;
        }
        .railTrack {
          position: relative;
          height: 100%;
        }
        .railTick {
          position: absolute;
          top: 0;
          bottom: 0;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding-top: 6px;
        }
        .railTickMark {
          width: 1px;
          height: 10px;
          background: var(--ink);
          opacity: 0.6;
        }
        .railStamp {
          font-size: 14px;
          color: var(--accent);
          letter-spacing: 0.04em;
          margin-bottom: -2px;
        }
        .railYear {
          color: var(--ink);
          line-height: 1;
          white-space: nowrap;
        }
        .railYearBig {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          transform: rotate(-2deg);
        }
        .railYearSmall {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        .railRule {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          background: var(--accent);
        }
      `}</style>
    </div>
  );
};

export default TimelineRail;
