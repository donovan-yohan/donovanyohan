/**
 * Blockquote.tsx — renders <blockquote> elements for vault note content.
 *
 * This is the default blockquote renderer. When frontmatter specifies
 * `render.blockquote === "pull-quote"`, useResolvedComponents swaps this
 * for the PullQuote variant instead.
 */

import React from "react";

interface BlockquoteProps extends React.BlockquoteHTMLAttributes<HTMLQuoteElement> {
  children?: React.ReactNode;
}

export function Blockquote({ children, className, ...rest }: BlockquoteProps) {
  return (
    <blockquote className={`note-blockquote ${className ?? ""}`.trim()} {...rest}>
      {children}
      <style jsx>{`
        .note-blockquote {
          border-left: 4px solid var(--note-accent, var(--highlight, #ffef00));
          margin: 1em 0;
          padding: 0.5em 1em;
          color: var(--gray, #757575);
          font-style: italic;
        }
      `}</style>
    </blockquote>
  );
}
