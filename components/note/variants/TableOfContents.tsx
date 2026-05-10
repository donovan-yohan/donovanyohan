/**
 * TableOfContents.tsx — nested <ul> styled as a table of contents.
 *
 * Applied when frontmatter specifies `render.toc === "toc"` (or any truthy
 * value on `render.toc`). The hast tree for a markdown list of heading links
 * is passed through as children; this component adds TOC-specific styles.
 *
 * The list structure is generated upstream (e.g. remark-toc or manual
 * authoring) — this component only handles rendering, not extraction.
 */

import React from "react";

interface TableOfContentsProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function TableOfContents({ children, className, ...rest }: TableOfContentsProps) {
  return (
    <nav aria-label="Table of contents" className={`note-toc ${className ?? ""}`.trim()} {...rest}>
      {children}
      <style jsx>{`
        .note-toc {
          border: 1px solid var(--border, #757575);
          border-radius: 4px;
          padding: 1em 1.5em;
          margin: 1.5em 0;
          display: inline-block;
          min-width: 220px;
          max-width: 100%;
          background-color: var(--disabled, #ededed);
        }

        /* Style nested lists inside the TOC */
        :global(.note-toc ul),
        :global(.note-toc ol) {
          list-style: none;
          padding-left: 1em;
          margin: 0;
        }

        :global(.note-toc > ul),
        :global(.note-toc > ol) {
          padding-left: 0;
        }

        :global(.note-toc li) {
          margin: 0.25em 0;
          font-size: 14px;
          line-height: 1.5;
        }

        :global(.note-toc a) {
          color: var(--main, #000000);
          text-decoration: none;
          font-weight: normal;
        }

        :global(.note-toc a:hover) {
          text-decoration: underline;
          text-decoration-color: var(--note-accent, var(--highlight, #ffef00));
        }
      `}</style>
    </nav>
  );
}
