import { Box, BoxProps } from "./Box";
import { Units } from "./tokens";

export interface StackProps extends Omit<BoxProps, "gap"> {
  gap?: Units;
  direction?: "row" | "column";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
}

const alignMap = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
} as const;

const justifyMap = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
} as const;

export const Stack = ({
  gap = 1,
  direction = "column",
  align,
  justify,
  wrap,
  style,
  ...rest
}: StackProps) => (
  <Box
    gap={gap}
    style={{
      display: "flex",
      flexDirection: direction,
      alignItems: align ? alignMap[align] : undefined,
      justifyContent: justify ? justifyMap[justify] : undefined,
      flexWrap: wrap ? "wrap" : undefined,
      ...style,
    }}
    {...rest}
  />
);
