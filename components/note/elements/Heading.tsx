/**
 * Heading.tsx — renders H1..H6 for vault note content.
 *
 * Derives an anchor `id` from text content via github-slugger so heading
 * links work out of the box. If the sanitized hast already carries an id
 * attribute (set by rehype-slug upstream), that id is preserved and
 * slugger is not invoked.
 *
 * Accepts an optional `variant` prop so useResolvedComponents can
 * pass variant="highlighter" without introducing a separate component.
 */

import React from "react";
import { useSlugger } from "../hooks/useSlugger";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Visual variant injected by useResolvedComponents for frontmatter render overrides. */
  variant?: "default" | "highlighter";
  children?: React.ReactNode;
}

/** Extracts plain text from a React node tree (for slug derivation). */
function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>;
    return extractText(el.props.children);
  }
  return "";
}

export function Heading({ level, variant = "default", children, id, className, ...rest }: HeadingProps) {
  // Per-note Slugger so repeated heading texts get unique IDs
  // (introduction, introduction-1, introduction-2, ...). NoteRenderer
  // provides one instance per render via SluggerContext.
  const slugger = useSlugger();
  const derivedId = id ?? slugger.slug(extractText(children));

  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  const cls = [
    `note-heading note-h${level}`,
    variant === "highlighter" ? "note-heading--highlighter" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag id={derivedId} className={cls} {...rest}>
      {children}
      <style jsx>{`
        .note-heading {
          margin: 1.5em 0 0.5em;
          line-height: 1.4;
          font-weight: bold;
        }
        .note-h1 { font-size: 2em; }
        .note-h2 { font-size: 1.5em; }
        .note-h3 { font-size: 1.25em; }
        .note-h4 { font-size: 1.1em; }
        .note-h5 { font-size: 1em; }
        .note-h6 { font-size: 0.9em; color: var(--gray, #757575); }

        /* Highlighter variant — mirrors the site-wide .highlightStatic treatment */
        .note-heading--highlighter {
          background: linear-gradient(
            0deg,
            var(--background, #ffffff) 10%,
            var(--note-accent, var(--highlight, #ffef00)) 10%,
            var(--note-accent, var(--highlight, #ffef00)) 60%,
            var(--background, #ffffff) 60%
          );
          width: fit-content;
          padding: 0 2px;
        }
      `}</style>
    </Tag>
  );
}
