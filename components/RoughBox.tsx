/**
 * RoughBox — hand-drawn-looking rectangle border for bullet-journal style
 * panels. Wraps roughjs to render a wobbly rect into an inline SVG that
 * fills the parent. Pair with a positioned wrapper for the doodle frame
 * look without baking a static SVG per panel.
 *
 * Re-renders on resize so the border traces the actual panel size; uses
 * a stable seed per instance so the wobble doesn't shift while the page
 * sits idle.
 *
 * Optional `drawn` prop animates the strokes on by transitioning each
 * sub-path's `stroke-dashoffset` from its own length to 0. Useful for
 * "panel sketches itself" entrances paired with an IntersectionObserver
 * upstream. When `drawn` is omitted, the box renders fully visible —
 * existing callers keep their current behaviour.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import rough from "roughjs";

interface RoughBoxProps {
  stroke?: string;
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  /**
   * Optional fill style. `solid` paints behind the stroke; `hachure` adds
   * the diagonal pen-stroke fill roughjs is known for; falsy = transparent.
   */
  fillStyle?: "solid" | "hachure" | "cross-hatch" | "zigzag" | "dots" | null;
  fill?: string;
  hachureGap?: number;
  /** Stable wobble seed so the border doesn't re-randomise on resize. */
  seed?: number;
  /** Border radius in px. */
  radius?: number;
  /**
   * When set, the strokes ink-draw on once this flips true. Omit the
   * prop entirely to keep the legacy "render fully visible" behaviour.
   */
  drawn?: boolean;
  /** Per-stroke draw-on duration in ms (default 800). */
  drawMs?: number;
  /** Delay before the draw begins, in ms (default 0). */
  drawDelayMs?: number;
}

const applyDashState = (
  svg: SVGSVGElement,
  drawn: boolean,
  drawMs: number,
  drawDelayMs: number,
) => {
  const subs = Array.from(svg.querySelectorAll("path"));
  subs.forEach((p, i) => {
    const len = (p as SVGPathElement).getTotalLength();
    const delay = drawDelayMs + i * 60;
    p.style.transition = "none";
    p.style.strokeDasharray = `${len} ${len}`;
    p.style.strokeDashoffset = drawn ? `${len}` : `${len}`;
    // Two-step: stamp the start state synchronously, then on next frame
    // attach the transition + flip to the end state so the browser
    // actually interpolates.
    requestAnimationFrame(() => {
      p.style.transition = `stroke-dashoffset ${drawMs}ms ease-out ${delay}ms`;
      p.style.strokeDashoffset = drawn ? "0" : `${len}`;
    });
  });
};

export const RoughBox = ({
  stroke = "currentColor",
  strokeWidth = 1.5,
  roughness = 1.4,
  bowing = 1,
  fillStyle = null,
  fill,
  hachureGap,
  seed = 1,
  radius = 0,
  drawn,
  drawMs = 800,
  drawDelayMs = 0,
}: RoughBoxProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const animated = drawn !== undefined;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let frame = 0;

    const render = () => {
      const rect = svg.getBoundingClientRect();
      const w = Math.max(2, rect.width);
      const h = Math.max(2, rect.height);
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.innerHTML = "";

      const rc = rough.svg(svg);
      // Inset the rectangle slightly so the wobbly edge stays inside the
      // box bounds — roughjs lines wander a few px past the nominal edge.
      const inset = strokeWidth + roughness;
      const node =
        radius > 0
          ? rc.path(
              roundedRectPath(
                inset,
                inset,
                w - inset * 2,
                h - inset * 2,
                radius,
              ),
              {
                stroke,
                strokeWidth,
                roughness,
                bowing,
                seed,
                ...(fillStyle && fill
                  ? {
                      fill,
                      fillStyle,
                      ...(hachureGap !== undefined
                        ? { hachureGap }
                        : {}),
                    }
                  : {}),
              },
            )
          : rc.rectangle(inset, inset, w - inset * 2, h - inset * 2, {
              stroke,
              strokeWidth,
              roughness,
              bowing,
              seed,
              ...(fillStyle && fill
                ? {
                    fill,
                    fillStyle,
                    ...(hachureGap !== undefined ? { hachureGap } : {}),
                  }
                : {}),
            });
      svg.appendChild(node);

      // Whenever roughjs regenerates the path (initial mount, resize),
      // reapply the dash-mask so the draw-on respects the current
      // `drawn` state instead of snapping fully visible.
      if (animated) {
        Array.from(svg.querySelectorAll("path")).forEach((p) => {
          const len = (p as SVGPathElement).getTotalLength();
          p.style.transition = "none";
          p.style.strokeDasharray = `${len} ${len}`;
          p.style.strokeDashoffset = `${len}`;
        });
      }
    };

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    });
    observer.observe(svg);
    render();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [stroke, strokeWidth, roughness, bowing, fillStyle, fill, hachureGap, seed, radius, animated]);

  useLayoutEffect(() => {
    if (!animated) return;
    const svg = svgRef.current;
    if (!svg) return;
    applyDashState(svg, !!drawn, drawMs, drawDelayMs);
  }, [animated, drawn, drawMs, drawDelayMs]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
};

const roundedRectPath = (
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string => {
  const rr = Math.min(r, w / 2, h / 2);
  return (
    `M ${x + rr} ${y} ` +
    `L ${x + w - rr} ${y} ` +
    `Q ${x + w} ${y} ${x + w} ${y + rr} ` +
    `L ${x + w} ${y + h - rr} ` +
    `Q ${x + w} ${y + h} ${x + w - rr} ${y + h} ` +
    `L ${x + rr} ${y + h} ` +
    `Q ${x} ${y + h} ${x} ${y + h - rr} ` +
    `L ${x} ${y + rr} ` +
    `Q ${x} ${y} ${x + rr} ${y} ` +
    `Z`
  );
};

export default RoughBox;
