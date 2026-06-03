/**
 * DrawBox — clean (non-roughjs) rectangular border that ink-draws on
 * entry. Sizes itself off its parent via a ResizeObserver so the stroke
 * traces the actual panel rect, then transitions `stroke-dashoffset`
 * from full-perimeter → 0 when `drawn` flips true.
 *
 * Using the real perimeter (instead of `pathLength={1}` on a <rect>)
 * sidesteps the patchy browser support that left some edges undrawn.
 *
 * Drop-in replacement for `border: 1px solid var(--ink)` on the contact
 * panels. Parent should be `position: relative`; DrawBox fills it
 * absolutely with `pointer-events: none`.
 */

import { CSSProperties, useEffect, useRef, useState } from "react";

interface DrawBoxProps {
  stroke?: string;
  strokeWidth?: number;
  /** When true, draw the stroke on; when false, keep it hidden. */
  drawn: boolean;
  /** Draw-on duration in ms. */
  drawMs?: number;
  /** Delay before the draw begins, in ms. */
  drawDelayMs?: number;
}

export const DrawBox = ({
  stroke = "var(--ink)",
  strokeWidth = 1,
  drawn,
  drawMs = 900,
  drawDelayMs = 0,
}: DrawBoxProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const apply = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(0, rect.width), h: Math.max(0, rect.height) });
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const inset = strokeWidth / 2;
  const x0 = inset;
  const y0 = inset;
  const x1 = Math.max(inset, w - inset);
  const y1 = Math.max(inset, h - inset);
  const perim = Math.max(1, 2 * (x1 - x0) + 2 * (y1 - y0));
  const d = `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;

  const pathStyle: CSSProperties = {
    fill: "none",
    stroke,
    strokeWidth,
    strokeDasharray: `${perim} ${perim}`,
    strokeDashoffset: drawn ? 0 : perim,
    transition: `stroke-dashoffset ${drawMs}ms ease-out ${drawDelayMs}ms`,
  };

  return (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
        /* Keep the border above any sibling content (HatchScene canvas,
           reveal overlay, etc.) so it never gets painted-over by a
           later-stacked child filling the panel. */
        zIndex: 3,
      }}
      aria-hidden
    >
      <path d={d} style={pathStyle} />
    </svg>
  );
};

export default DrawBox;
