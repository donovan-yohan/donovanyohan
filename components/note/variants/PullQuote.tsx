/**
 * PullQuote.tsx — large left-rule blockquote variant.
 *
 * Swaps in for the default Blockquote when frontmatter specifies
 * `render.blockquote === "pull-quote"`.
 *
 * Attribution support: if a <cite> element is present as a child it is
 * rendered beneath the quote in a distinct style. The hast child tree
 * is passed through unchanged; cite rendering is handled by the default
 * component map (no special wiring needed here).
 */

import React from "react";

interface PullQuoteProps extends React.BlockquoteHTMLAttributes<HTMLQuoteElement> {
  children?: React.ReactNode;
}

export function PullQuote({ children, className, ...rest }: PullQuoteProps) {
  return (
    <blockquote className={`note-pull-quote ${className ?? ""}`.trim()} {...rest}>
      {children}
      <style jsx>{`
        .note-pull-quote {
          border-left: 6px solid var(--note-accent, var(--highlight, #ffef00));
          margin: 2em 0;
          padding: 1em 1.5em;
          font-size: 1.3em;
          line-height: 1.6;
          font-style: italic;
          color: var(--main, #000000);
          position: relative;
        }

        /* Attribution (<cite> child) */
        :global(.note-pull-quote cite) {
          display: block;
          margin-top: 0.75em;
          font-size: 0.7em;
          font-style: normal;
          color: var(--gray, #757575);
          font-weight: bold;
        }

        @media only screen and (max-width: 767px) {
          .note-pull-quote {
            font-size: 1.1em;
          }
        }
      `}</style>
    </blockquote>
  );
}
