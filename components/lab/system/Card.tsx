import { createElement, CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { Units, ux } from "./tokens";
import { SnapAxis, useSnap } from "./useSnap";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "style"> {
  as?: ElementType;
  minH?: Units;
  h?: Units;
  p?: Units;
  px?: Units;
  py?: Units;
  variant?: "outline" | "filled" | "ghost";
  snap?: boolean;
  snapAxis?: SnapAxis;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const variants = {
  outline: { border: "1px solid var(--rule)", background: "transparent" },
  filled: { border: "1px solid var(--rule)", background: "var(--paper-2)" },
  ghost: { border: "none", background: "transparent" },
} as const;

export const Card = ({
  as: Tag = "div",
  minH = 4,
  h,
  p = 1,
  px,
  py,
  variant = "outline",
  snap = true,
  snapAxis = "height",
  className,
  style,
  children,
  ...rest
}: CardProps) => {
  const ref = useSnap<HTMLElement>(snap, snapAxis);

  const computed: CSSProperties = {
    boxSizing: "border-box",
    borderRadius: 2,
    ...variants[variant],
    minHeight: ux(minH),
    ...(h !== undefined ? { height: ux(h) } : {}),
    ...(p !== undefined ? { padding: ux(p) } : {}),
    ...(px !== undefined ? { paddingLeft: ux(px), paddingRight: ux(px) } : {}),
    ...(py !== undefined ? { paddingTop: ux(py), paddingBottom: ux(py) } : {}),
  };

  return createElement(
    Tag,
    { ref, className, style: { ...computed, ...style }, ...rest },
    children,
  );
};
