/**
 * InlineCode.tsx — renders inline <code> elements for vault note content.
 *
 * Distinct from CodeBlock which handles <pre><code> fenced blocks.
 * styled-jsx scopes the style to this component only.
 */

import React from "react";

interface InlineCodeProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function InlineCode({ children, className, ...rest }: InlineCodeProps) {
  const cls = `note-inline-code ${className ?? ""}`.trim();

  return (
    <code className={cls} {...rest}>
      {children}
      <style jsx>{`
        .note-inline-code {
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 0.875em;
          background-color: var(--disabled, #ededed);
          border-radius: 3px;
          padding: 0.1em 0.35em;
          color: var(--main, #000000);
        }
      `}</style>
    </code>
  );
}
