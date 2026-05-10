/**
 * Paragraph.tsx — renders <p> elements for vault note content.
 *
 * Accepts a `variant` prop so DropCap can be applied to the first paragraph
 * by NoteRenderer (see the DropCap special-case comment in NoteRenderer.tsx).
 * Standard paragraphs use variant="default".
 */

import React from "react";

interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Injected by NoteRenderer for the first-paragraph drop-cap special case. */
  variant?: "default" | "drop-cap";
  children?: React.ReactNode;
}

export function Paragraph({ variant = "default", children, className, ...rest }: ParagraphProps) {
  const cls = [
    "note-p",
    variant === "drop-cap" ? "note-p--drop-cap" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <p className={cls} {...rest}>
      {children}
      <style jsx>{`
        .note-p {
          margin: 0 0 1em;
          line-height: 2;
          font-size: 16px;
        }

        /* Drop-cap: large first letter on the first paragraph */
        .note-p--drop-cap::first-letter {
          float: left;
          font-size: 3.5em;
          line-height: 0.75;
          margin: 0.05em 0.1em 0 0;
          font-weight: bold;
          color: var(--note-accent, var(--main, #000000));
        }
      `}</style>
    </p>
  );
}
