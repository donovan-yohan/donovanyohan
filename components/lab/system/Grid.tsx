import { Box, BoxProps } from "./Box";
import { Units, ux } from "./tokens";

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
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gridTemplateRows: rows ? `repeat(${rows}, minmax(min-content, auto))` : undefined,
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
      gridColumn: colSpan ? `span ${colSpan}` : undefined,
      gridRow: rowSpan ? `span ${rowSpan}` : undefined,
      ...style,
    }}
    {...rest}
  />
);
