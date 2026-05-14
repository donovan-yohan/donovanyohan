import { CSSProperties, ReactNode } from "react";
import { Units, ux } from "./tokens";

export interface MarginAnchorProps {
  top?: Units;
  sticky?: boolean;
  align?: "start" | "center" | "end";
  gap?: Units;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const alignMap = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
} as const;

export const MarginAnchor = ({
  top = 4,
  sticky = true,
  align = "end",
  gap = 1,
  className,
  style,
  children,
}: MarginAnchorProps) => {
  const outerStyle: CSSProperties = {
    position: sticky ? "sticky" : "absolute",
    top: ux(top),
    zIndex: 10,
    height: 0,
    marginLeft: "calc(-1 * var(--content-pad-left))",
    paddingLeft: "var(--content-pad-left)",
    pointerEvents: "none",
    ...style,
  };
  const innerStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: ux(1),
    width: "var(--gutter-w)",
    paddingRight: "var(--gutter-pad)",
    display: "flex",
    flexDirection: "column",
    alignItems: alignMap[align],
    gap: ux(gap),
    pointerEvents: "auto",
  };

  return (
    <div className={className} style={outerStyle}>
      <div style={innerStyle}>{children}</div>
    </div>
  );
};
