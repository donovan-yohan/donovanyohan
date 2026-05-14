/**
 * HiSpan — wobbly highlighter marker that clones per wrapped line.
 *
 * The SVG marker path is baked into a `background-image` data URL with
 * the slot/theme colour written directly into the path fill. The span
 * uses `display: inline` + `box-decoration-break: clone`, so when the
 * text wraps each line fragment gets its own highlighter pass instead
 * of one giant slab over the whole bounding box.
 *
 * Palette mirrors the CSS `--hl-1`..`--hl-4` vars (light + dark). Keep
 * the JS palette in sync with `pages/index.tsx` if those vars change.
 *
 * Usage:
 *   <HiSpan slot={2}>some text</HiSpan>
 *   <HiSpan slot={4} pathIndex={3} style={{ backgroundSize: "100% 0.45em" }}>
 *     short marker
 *   </HiSpan>
 */

import {
  CSSProperties,
  ReactNode,
  useContext,
  useMemo,
} from "react";
import Context from "./context";

const HIGHLIGHT_PATHS: readonly string[] = [
  "M3,8 Q40,7 90,7 T175,7 T217,8 L215,37 Q170,38 130,37 T70,37 T5,37 L3,8 Z",
  "M5,9 Q45,8 100,8 T200,9 L218,9 L216,38 Q165,38 120,37 T50,37 T3,37 L5,9 Z",
  "M3,7 Q35,6 80,7 T160,7 T210,8 L213,38 Q210,38 180,37 T100,38 T20,37 L1,38 L3,7 Z",
  "M2,9 Q50,8 110,8 T200,8 L215,8 L218,37 L200,38 Q140,38 90,37 T2,38 L2,9 Z",
  "M3,8 Q40,7 80,7 T180,8 Q205,8 218,9 L215,37 Q200,38 160,38 T70,37 Q35,38 2,37 L3,8 Z",
];

const HIGHLIGHT_PALETTE: Record<"light" | "dark", readonly string[]> = {
  light: ["#78dcff8c", "#ff82c88c", "#b4ff8299", "#ffe0668c"],
  dark: ["#3c6ee68c", "#dc46508c", "#8c5ae68c", "#e682328c"],
};

export type HiSlot = 1 | 2 | 3 | 4;

export interface HiSpanProps {
  /** Slot 1..4 → palette colour. Ignored when `color` is set. */
  slot?: HiSlot;
  /** Explicit fill colour (CSS colour string). Overrides slot/theme
   *  lookup when set — useful for off-palette accents like the
   *  TimelineCard purple/orange/red marks. URL-special chars (`#`,
   *  spaces) are encoded internally before injection. */
  color?: string;
  /** Path variant 0..4. Defaults to `slot - 1` for visual variety. */
  pathIndex?: number;
  /** Children to highlight. */
  children: ReactNode;
  /** Extra className for layout hooks. */
  className?: string;
  /** Inline style overrides. Useful for tweaking `backgroundSize` /
   *  `backgroundPosition` per call-site (e.g. very tall headlines may
   *  want a thinner stripe than the default `calc(100% - 0.5em)`). */
  style?: CSSProperties;
}

const encodeFill = (raw: string) =>
  encodeURIComponent(raw).replace(/'/g, "%27").replace(/"/g, "%22");

export const HiSpan = ({
  slot = 4,
  color,
  pathIndex,
  children,
  className,
  style,
}: HiSpanProps) => {
  const { theme } = useContext(Context);

  const backgroundImage = useMemo(() => {
    const palette =
      HIGHLIGHT_PALETTE[theme === "dark" ? "dark" : "light"];
    const raw = color ?? palette[(slot - 1) % palette.length];
    const fill = encodeFill(raw);
    const path =
      HIGHLIGHT_PATHS[
        (pathIndex ?? slot - 1) % HIGHLIGHT_PATHS.length
      ];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 44' preserveAspectRatio='none'><path d='${path}' fill='${fill}'/></svg>`;
    return `url("data:image/svg+xml;utf8,${svg}")`;
  }, [theme, slot, color, pathIndex]);

  return (
    <span
      className={["hiSpan", className].filter(Boolean).join(" ")}
      style={{ backgroundImage, ...style }}
    >
      {children}
      <style jsx>{`
        .hiSpan {
          display: inline;
          -webkit-box-decoration-break: clone;
          box-decoration-break: clone;
          padding: 0 4px;
          margin: 0 -4px;
          background-repeat: no-repeat;
          background-size: 100% calc(100% - 0.5em);
          background-position: 0 100%;
        }
      `}</style>
    </span>
  );
};

export default HiSpan;
