/**
 * RoughSketch — render a list of SVG path strings through roughjs so each
 * stroke gets the hand-drawn wobble. Pairs with `sketches.ts` for the
 * about-page doodles, but takes raw `viewBox` + `paths` so any sketch can
 * be plugged in later.
 *
 * The first render produces an "undrawn" SVG (each path measured, then
 * masked with `stroke-dasharray: <len> <len>; stroke-dashoffset: <len>`).
 * When `drawn` flips true, a CSS transition runs the offset to 0 so the
 * sketch ink-draws in. Trigger by parent — typically an IntersectionObserver
 * watching horizontal scroll.
 */

import { useEffect, useRef } from "react";
import rough from "roughjs";

import type { SketchKey } from "../../global/timeline";
import { sketches } from "./sketches";

interface RoughSketchProps {
  /** Either a known key from `sketches.ts` or a custom spec via `paths`. */
  sketch?: SketchKey;
  viewBox?: string;
  paths?: string[];
  stroke?: string;
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  /** Stable seed so the wobble doesn't reshuffle between renders. */
  seed?: number;
  /** When true, ink-draw the strokes; when false, render them blank. */
  drawn?: boolean;
  /** Draw-on duration in ms when `drawn` flips true. */
  drawMs?: number;
  /** Extra delay before the draw begins, in ms. */
  drawDelayMs?: number;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export const RoughSketch = ({
  sketch,
  viewBox,
  paths,
  stroke = "currentColor",
  strokeWidth = 1.6,
  roughness = 1.8,
  bowing = 1.4,
  seed = 1,
  drawn = true,
  drawMs = 700,
  drawDelayMs = 0,
  className,
  style,
  ariaLabel,
}: RoughSketchProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const spec = sketch ? sketches[sketch] : undefined;
  const resolvedViewBox = viewBox ?? spec?.viewBox ?? "0 0 100 100";
  const resolvedPaths = paths ?? spec?.paths ?? [];

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.setAttribute("viewBox", resolvedViewBox);
    svg.innerHTML = "";

    const rc = rough.svg(svg);
    resolvedPaths.forEach((d, i) => {
      const node = rc.path(d, {
        stroke,
        strokeWidth,
        roughness,
        bowing,
        seed: seed + i,
      });
      // roughjs builds a <g> of internal sub-paths. Treat the whole group
      // as one stroke for the draw-on: measure each sub-path, set dash to
      // its own length so it can be revealed independently.
      Array.from(node.querySelectorAll("path")).forEach((p) => {
        const len = (p as SVGPathElement).getTotalLength();
        p.style.transition = "none";
        p.style.strokeDasharray = `${len} ${len}`;
        p.style.strokeDashoffset = `${len}`;
      });
      svg.appendChild(node);
    });
  }, [resolvedViewBox, resolvedPaths, stroke, strokeWidth, roughness, bowing, seed]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const subs = Array.from(svg.querySelectorAll("path"));
    subs.forEach((p, i) => {
      const delay = drawDelayMs + i * 40;
      p.style.transition = `stroke-dashoffset ${drawMs}ms ease-out ${delay}ms`;
      p.style.strokeDashoffset = drawn ? "0" : (p.style.strokeDasharray.split(" ")[0] ?? "0");
    });
  }, [drawn, drawMs, drawDelayMs]);

  return (
    <svg
      ref={svgRef}
      className={className}
      style={{ overflow: "visible", ...style }}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      preserveAspectRatio="xMidYMid meet"
    />
  );
};

export default RoughSketch;
