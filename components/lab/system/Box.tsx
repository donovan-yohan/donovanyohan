import { createElement, CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { Units, ux } from "./tokens";
import { SnapAxis, useSnap } from "./useSnap";

export interface BoxProps extends Omit<HTMLAttributes<HTMLElement>, "style"> {
  as?: ElementType;
  h?: Units;
  minH?: Units;
  maxH?: Units;
  w?: Units;
  minW?: Units;
  maxW?: Units;
  p?: Units;
  px?: Units;
  py?: Units;
  pt?: Units;
  pr?: Units;
  pb?: Units;
  pl?: Units;
  m?: Units;
  mx?: Units;
  my?: Units;
  mt?: Units;
  mr?: Units;
  mb?: Units;
  ml?: Units;
  gap?: Units;
  snap?: boolean;
  snapAxis?: SnapAxis;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const set = (style: CSSProperties, key: keyof CSSProperties, n: Units | undefined) => {
  if (n === undefined) return;
  (style as Record<string, string>)[key as string] = ux(n);
};

export const Box = ({
  as: Tag = "div",
  h,
  minH,
  maxH,
  w,
  minW,
  maxW,
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  gap,
  snap = false,
  snapAxis = "height",
  className,
  style,
  children,
  ...rest
}: BoxProps) => {
  const ref = useSnap<HTMLElement>(snap, snapAxis);
  const computed: CSSProperties = { boxSizing: "border-box" };
  set(computed, "height", h);
  set(computed, "minHeight", minH);
  set(computed, "maxHeight", maxH);
  set(computed, "width", w);
  set(computed, "minWidth", minW);
  set(computed, "maxWidth", maxW);
  set(computed, "padding", p);
  set(computed, "paddingTop", pt ?? py);
  set(computed, "paddingBottom", pb ?? py);
  set(computed, "paddingLeft", pl ?? px);
  set(computed, "paddingRight", pr ?? px);
  set(computed, "margin", m);
  set(computed, "marginTop", mt ?? my);
  set(computed, "marginBottom", mb ?? my);
  set(computed, "marginLeft", ml ?? mx);
  set(computed, "marginRight", mr ?? mx);
  set(computed, "gap", gap);

  return createElement(
    Tag,
    { ref, className, style: { ...computed, ...style }, ...rest },
    children,
  );
};
