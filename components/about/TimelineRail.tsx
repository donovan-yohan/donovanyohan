/**
 * TimelineRail — strip of year markers sitting above the timeline lane.
 * Lives inside the same horizontally-scrolling block as the lane, so its
 * ticks scroll naturally with the cards — no scrollX prop needed.
 *
 * Layout matches the lane exactly: each tick is positioned using the same
 * `cardStrideX` / `leftPadX` constants the lane uses, so a tick at year Y
 * sits centered above the cards belonging to that year. Years render in
 * heavy uppercase mono; emphasized years and stamps get a highlighter
 * strip behind them (no rotation, no cursive).
 */

import { CSSProperties, useMemo } from "react";

import type { TimelineEvent } from "../../global/timeline";
import { HiSpan } from "../Highlighter";

interface TimelineRailProps {
  events: TimelineEvent[];
  monoClass: string;
  monoBoldClass: string;
}

interface YearTick {
  year: number;
  /** Center x of all events tagged with this year, as a CSS length. */
  centerX: string;
  /** Whether to render the big highlighted label. */
  emphasize: boolean;
  /** Stamp (NOW / START) if any of the events for this year has one. */
  stamp?: string;
}

export const TimelineRail = ({ events, monoClass, monoBoldClass }: TimelineRailProps) => {
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
      const avgIndex = bucket.indices.reduce((s, n) => s + n, 0) / bucket.indices.length;
      const centerX = `calc(var(--timeline-left-pad) + ${avgIndex} * (var(--timeline-card-w) + var(--timeline-gap)) + var(--timeline-card-w) / 2)`;
      result.push({
        year,
        centerX,
        emphasize: idx === 0 || idx === sortedYears.length - 1 || idx % 2 === 0,
        stamp: bucket.stamp,
      });
    });
    return result;
  }, [events]);

  const trackWidth = `calc(var(--timeline-left-pad) + ${events.length} * var(--timeline-card-w) + ${Math.max(0, events.length - 1)} * var(--timeline-gap) + var(--timeline-right-pad))`;
  const trackStyle: CSSProperties = { width: trackWidth };

  return (
    <div className="rail" aria-hidden>
      <div className="railTrack" style={trackStyle}>
        {ticks.map((t) => (
          <div key={t.year} className="railTick" style={{ left: t.centerX }}>
            <span className="railTickMark" />
            {t.stamp ? <span className={`railStamp ${monoBoldClass}`}>{t.stamp}</span> : null}
            <span
              className={`railYear ${
                t.emphasize ? monoBoldClass : monoClass
              } ${t.emphasize ? "railYearBig" : "railYearSmall"}`}
            >
              {t.emphasize ? (
                <HiSpan
                  slot={4}
                  style={{
                    backgroundSize: "100% 0.7em",
                    backgroundPosition: "0 80%",
                  }}
                >
                  {t.year}
                </HiSpan>
              ) : (
                t.year
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="railRule" aria-hidden style={trackStyle} />

      <style jsx>{`
        .rail {
          position: relative;
          height: var(--rail-lane-h);
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
          gap: 4px;
          padding-top: 6px;
        }
        .railTickMark {
          width: 1px;
          height: 10px;
          background: var(--ink);
          opacity: 0.6;
        }
        .railStamp {
          font-size: 11px;
          letter-spacing: 0.22em;
          color: var(--paper);
          background: var(--accent);
          padding: 3px 8px;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .railYear {
          color: var(--ink);
          line-height: 1;
          white-space: nowrap;
        }
        .railYearBig {
          font-size: 22px;
          letter-spacing: 0.04em;
        }
        .railYearSmall {
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        .railRule {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          background: var(--ink);
        }
      `}</style>
    </div>
  );
};

export default TimelineRail;
