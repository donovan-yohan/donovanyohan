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
    const el = ref.current;
    if (!el) return;

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
