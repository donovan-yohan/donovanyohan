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
  const outerClassName = ["marginAnchor", className].filter(Boolean).join(" ");

  const outerStyle: CSSProperties = {
    position: `var(--margin-anchor-position, ${sticky ? "sticky" : "absolute"})` as CSSProperties["position"],
    top: `var(--margin-anchor-top, ${ux(top)})`,
    zIndex: "var(--margin-anchor-z-index, 10)" as unknown as CSSProperties["zIndex"],
    height: "var(--margin-anchor-height, 0)",
    marginLeft: "var(--margin-anchor-margin-left, calc(-1 * var(--content-pad-left)))",
    marginRight: "var(--margin-anchor-margin-right, 0)",
    paddingLeft: "var(--margin-anchor-padding-left, var(--content-pad-left))",
    pointerEvents: "var(--margin-anchor-pointer-events, none)" as CSSProperties["pointerEvents"],
    ...style,
  };
  const innerStyle: CSSProperties = {
    position: "var(--margin-anchor-inner-position, absolute)" as CSSProperties["position"],
    left: 0,
    top: `var(--margin-anchor-inner-top, ${ux(1)})`,
    width: "var(--margin-anchor-inner-width, var(--gutter-w))",
    boxSizing: "border-box",
    paddingRight: "var(--margin-anchor-inner-padding-right, var(--gutter-pad))",
    padding: "var(--margin-anchor-inner-padding)",
    display: "var(--margin-anchor-inner-display, flex)",
    flexDirection: "column",
    gridTemplateColumns: "var(--margin-anchor-inner-grid-template-columns)",
    alignItems: `var(--margin-anchor-inner-align-items, ${alignMap[align]})`,
    gap: `var(--margin-anchor-inner-gap, ${ux(gap)})`,
    pointerEvents: "auto",
  };

  return (
    <div className={outerClassName} style={outerStyle}>
      <div className="marginAnchorInner" style={innerStyle}>{children}</div>
    </div>
  );
};
