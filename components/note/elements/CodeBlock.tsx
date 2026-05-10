/**
 * CodeBlock.tsx — renders fenced code blocks (<pre><code>) for vault note content.
 *
 * The inner <code> element is rendered by InlineCode (the mapped `code` component)
 * which preserves the `language-X` className emitted by remark-rehype. Block-vs-inline
 * styling is distinguished via the CSS selector `.note-pre .note-inline-code` so
 * fenced blocks reset the inline pill styling automatically.
 *
 * The previous version tried to clone the React child to rewrite className, but
 * the child's element type at this point is the InlineCode component reference
 * (not the string "code"), so the `el.type !== "code"` guard always tripped and
 * the language was lost. The right place to thread language is a remark plugin
 * that annotates the hast before rendering, or `passNode: true` from rehype-react.
 *
 * TODO(Phase E): integrate shiki for server-side syntax highlighting. The
 * `language-X` className on the inner <code> is the hook point.
 */

import React from "react";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode;
}

export function CodeBlock({ children, className, ...rest }: CodeBlockProps) {
  return (
    <pre className={`note-pre ${className ?? ""}`.trim()} {...rest}>
      {children}
      <style jsx>{`
        .note-pre {
          background-color: var(--disabled, #ededed);
          border-radius: 4px;
          padding: 1em 1.25em;
          overflow-x: auto;
          font-size: 0.875em;
          line-height: 1.6;
          margin: 1em 0;
        }
        /* Reset the inline-code pill styling inside a fenced block. */
        .note-pre :global(.note-inline-code) {
          background: none;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
        }
      `}</style>
    </pre>
  );
}
