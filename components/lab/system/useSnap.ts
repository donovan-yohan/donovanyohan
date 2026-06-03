import { RefObject, useLayoutEffect, useRef } from "react";
import { UNIT_PX } from "./tokens";

export type SnapAxis = "height" | "width" | "both";

export const useSnap = <T extends HTMLElement = HTMLDivElement>(
  enabled = true,
  axis: SnapAxis = "height",
  unit = UNIT_PX,
): RefObject<T> => {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!enabled) return;
    // Bail on non-positive unit values — Math.ceil(x / 0) would emit
    // Infinity, which writes an invalid CSS min-{height,width} value.
    if (unit <= 0) return;
    const el = ref.current;
    if (!el) return;

    // Clear any stale snapped style on the inactive axis when axis or
    // enabled changes (previous setting could have written e.g.
    // minHeight while the current axis is "width"), otherwise the
    // leftover constraint keeps shaping layout.
    if (axis === "width") el.style.minHeight = "";
    if (axis === "height") el.style.minWidth = "";

    let raf = 0;
    let lastH = -1;
    let lastW = -1;

    const apply = (height: number, width: number) => {
      raf = 0;
      if (axis !== "width") {
        const snapped = Math.ceil(height / unit) * unit;
        if (snapped !== lastH) {
          lastH = snapped;
          el.style.minHeight = `${snapped}px`;
        }
      }
      if (axis !== "height") {
        const snapped = Math.ceil(width / unit) * unit;
        if (snapped !== lastW) {
          lastW = snapped;
          el.style.minWidth = `${snapped}px`;
        }
      }
    };

    const rect = el.getBoundingClientRect();
    apply(rect.height, rect.width);

    const ro = new ResizeObserver((entries) => {
      if (raf) return;
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      raf = requestAnimationFrame(() => apply(height, width));
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled, axis, unit]);

  return ref as RefObject<T>;
};
