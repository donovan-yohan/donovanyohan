/**
 * components/lab/RoughIcon.tsx — wrap a Lucide icon and redraw its
 * primitives (path/circle/line/polyline) as roughjs hand-sketched
 * strokes so the icon set matches the hand-drawn aesthetic of the
 * DY logo + hatch shading.
 *
 * Lucide renders its icons as inline SVG with stroke="currentColor".
 * We render the source SVG into a hidden ref, then on mount/seed
 * change walk its children and append roughjs equivalents into a
 * visible sibling SVG.
 */

import { useEffect, useRef } from "react";
import type { ComponentType, SVGProps } from "react";
import rough from "roughjs";

type LucideLike = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

type Props = {
  Icon: LucideLike;
  size?: number;
  seed?: number;
  roughness?: number;
  bowing?: number;
  strokeWidth?: number;
  color?: string;
  disableMultiStroke?: boolean;
  preserveVertices?: boolean;
};

const RoughIcon = ({
  Icon,
  size = 64,
  seed = 1,
  roughness = 0.35,
  bowing = 4,
  strokeWidth = 0.4,
  color = "currentColor",
  disableMultiStroke = false,
  preserveVertices = true,
}: Props) => {
  const hostRef = useRef<HTMLSpanElement>(null);
  const dstRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const dst = dstRef.current;
    if (!host || !dst) return;
    const src = host.querySelector("svg.roughSrc");
    if (!src) return;

    while (dst.firstChild) dst.removeChild(dst.firstChild);

    const rc = rough.svg(dst);
    const opts = {
      roughness,
      bowing,
      stroke: color,
      strokeWidth,
      seed,
      disableMultiStroke,
      preserveVertices,
    };

    src.querySelectorAll("path").forEach((p) => {
      const d = p.getAttribute("d");
      if (d) dst.appendChild(rc.path(d, opts));
    });
    src.querySelectorAll("circle").forEach((c) => {
      const cx = Number(c.getAttribute("cx") ?? 0);
      const cy = Number(c.getAttribute("cy") ?? 0);
      const r = Number(c.getAttribute("r") ?? 0);
      dst.appendChild(rc.circle(cx, cy, r * 2, opts));
    });
    src.querySelectorAll("line").forEach((l) => {
      const x1 = Number(l.getAttribute("x1") ?? 0);
      const y1 = Number(l.getAttribute("y1") ?? 0);
      const x2 = Number(l.getAttribute("x2") ?? 0);
      const y2 = Number(l.getAttribute("y2") ?? 0);
      dst.appendChild(rc.line(x1, y1, x2, y2, opts));
    });
    src.querySelectorAll("polyline").forEach((pl) => {
      const pts = pl.getAttribute("points");
      if (!pts) return;
      const flat = pts.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n));
      const pairs: [number, number][] = [];
      // Iterate to flat.length - 1 so an odd-length coord list drops the
      // trailing orphan instead of pushing [x, undefined] into roughjs.
      for (let i = 0; i < flat.length - 1; i += 2) pairs.push([flat[i], flat[i + 1]]);
      if (pairs.length >= 2) dst.appendChild(rc.linearPath(pairs, opts));
    });
  }, [Icon, seed, roughness, bowing, strokeWidth, color, disableMultiStroke, preserveVertices]);

  return (
    <span
      ref={hostRef}
      style={{
        position: "relative",
        display: "inline-block",
        width: size,
        height: size,
        color,
      }}
    >
      <Icon
        className="roughSrc"
        width={size}
        height={size}
        style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}
        aria-hidden
      />
      <svg
        ref={dstRef}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{ display: "block", overflow: "visible" }}
        aria-hidden
      />
    </span>
  );
};

export default RoughIcon;
