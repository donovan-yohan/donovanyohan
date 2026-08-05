import { Box, BoxProps } from "./Box";
import { Units, ux } from "./tokens";
import type { CSSProperties } from "react";

export interface GridProps extends Omit<BoxProps, "gap"> {
  cols: number;
  rows?: number;
  gap?: Units;
  dense?: boolean;
}

export const Grid = ({ cols, rows, gap = 1, dense, style, ...rest }: GridProps) => (
  <Box
    gap={gap}
    style={{
      display: "grid",
      gridTemplateColumns: `var(--grid-template-columns, repeat(${cols}, minmax(0, 1fr)))`,
      gridTemplateRows: `var(--grid-template-rows, ${
        rows ? `repeat(${rows}, minmax(min-content, auto))` : "none"
      })`,
      gridAutoFlow: dense ? "dense" : undefined,
      ...style,
    }}
    {...rest}
  />
);

export interface GridItemProps extends BoxProps {
  colSpan?: number;
  rowSpan?: number;
}

export const GridItem = ({ colSpan, rowSpan, style, ...rest }: GridItemProps) => (
  <Box
    style={{
      gridColumn: `var(--grid-column, ${colSpan ? `span ${colSpan}` : "auto"})` as CSSProperties["gridColumn"],
      gridRow: `var(--grid-row, ${rowSpan ? `span ${rowSpan}` : "auto"})` as CSSProperties["gridRow"],
      ...style,
    }}
    {...rest}
  />
);
