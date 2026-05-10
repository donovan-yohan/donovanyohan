/**
 * HighlighterLink.tsx — <a> with neon underline animation.
 *
 * Mirrors the existing site-wide `.highlight` class behaviour (defined in
 * layouts/main.tsx). Used when frontmatter specifies
 * `render.a === "highlighter"`.
 *
 * Composes the Link element so routing logic (next/link vs external) stays
 * in a single place.
 */

import React from "react";
import { Link } from "../elements/Link";

interface HighlighterLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  children?: React.ReactNode;
}

export function HighlighterLink({ children, className, ...rest }: HighlighterLinkProps) {
  return (
    <span className="note-highlighter-link-wrap">
      <Link className={`note-highlighter-link ${className ?? ""}`.trim()} {...rest}>
        {children}
      </Link>
      <style jsx>{`
        .note-highlighter-link-wrap {
          display: inline;
          position: relative;
        }

        :global(.note-highlighter-link) {
          text-decoration: none;
          font-weight: bold;
          position: relative;
          color: var(--main, #000000);
        }

        :global(.note-highlighter-link::before) {
          transition: 0.35s cubic-bezier(0.51, 0.07, 0.09, 0.95);
          content: "";
          z-index: -1;
          position: absolute;
          bottom: 2px;
          width: 0%;
          height: 60%;
          background-color: var(--note-accent, var(--highlight, #ffef00));
        }

        :global(.note-highlighter-link:hover::before) {
          width: 100%;
        }
      `}</style>
    </span>
  );
}
