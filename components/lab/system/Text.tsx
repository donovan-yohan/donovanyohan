import { createElement, CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { Units, ux } from "./tokens";

export type TypeScale =
  | "micro"
  | "label"
  | "body"
  | "lead"
  | "h3"
  | "h2"
  | "h1"
  | "display";

interface ScaleSpec {
  fontSize: number;
  lineHeightU: Units;
  letterSpacing?: string;
  textTransform?: CSSProperties["textTransform"];
  fontWeight?: number;
}

const SCALE: Record<TypeScale, ScaleSpec> = {
  micro: { fontSize: 11, lineHeightU: 1, letterSpacing: "0.18em", textTransform: "uppercase" },
  label: { fontSize: 14, lineHeightU: 1, letterSpacing: "0.16em", textTransform: "uppercase" },
  body: { fontSize: 15, lineHeightU: 2 },
  lead: { fontSize: 22, lineHeightU: 2 },
  h3: { fontSize: 28, lineHeightU: 2, letterSpacing: "-0.02em", fontWeight: 600 },
  h2: { fontSize: 44, lineHeightU: 3, letterSpacing: "-0.03em", fontWeight: 700 },
  h1: { fontSize: 64, lineHeightU: 4, letterSpacing: "-0.04em", fontWeight: 800 },
  display: { fontSize: 80, lineHeightU: 5, letterSpacing: "-0.04em", fontWeight: 900 },
};

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "style"> {
  as?: ElementType;
  scale?: TypeScale;
  color?: "ink" | "soft" | "mute" | "faint" | "accent";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const colors = {
  ink: "var(--ink)",
  soft: "var(--ink-soft)",
  mute: "var(--ink-mute)",
  faint: "var(--ink-faint)",
  accent: "var(--accent)",
} as const;

export const Text = ({
  as: Tag = "span",
  scale = "body",
  color = "ink",
  className,
  style,
  children,
  ...rest
}: TextProps) => {
  const s = SCALE[scale];
  return createElement(
    Tag,
    {
      className,
      style: {
        margin: 0,
        fontSize: s.fontSize,
        lineHeight: ux(s.lineHeightU),
        letterSpacing: s.letterSpacing,
        textTransform: s.textTransform,
        fontWeight: s.fontWeight,
        color: colors[color],
        ...style,
      },
      ...rest,
    },
    children,
  );
};
