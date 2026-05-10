/**
 * CodeBlock.tsx — renders fenced code blocks (<pre><code>) for vault note content.
 *
 * Language is derived from the rehype hast className (e.g. "language-typescript").
 * Syntax highlighting is intentionally absent in Phase B; this component leaves
 * a clean extension point for shiki (or similar) in a future phase:
 *   TODO(Phase E): integrate shiki for server-side syntax highlighting.
 *   The `lang` prop and `language-${lang}` className are the hook points.
 *
 * No eslint-disable needed — this is valid JSX with no restricted patterns.
 */

import React from "react";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode;
}

/** Extracts the language identifier from a rehype className like "language-typescript". */
function extractLang(className?: string): string {
  if (!className) return "text";
  const classes = className.split(" ");
  for (const cls of classes) {
    if (cls.startsWith("language-")) {
      return cls.replace("language-", "");
    }
  }
  return "text";
}

/**
 * Extracts className from child <code> element so we can thread the lang
 * through from the hast node. rehype emits <pre><code class="language-X">.
 */
function getChildCodeLang(children: React.ReactNode): string {
  if (!React.isValidElement(children)) return "text";
  const el = children as React.ReactElement<{ className?: string }>;
  if (el.type !== "code") return "text";
  return extractLang(el.props.className);
}

export function CodeBlock({ children, className, ...rest }: CodeBlockProps) {
  const lang = getChildCodeLang(children);

  return (
    <pre className={`note-pre ${className ?? ""}`.trim()} {...rest}>
      {/* Re-wrap child code node with the language className for future shiki hook */}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ className?: string }>, {
            className: `note-code language-${lang}`,
          })
        : children}
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
        :global(.note-code) {
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          color: var(--main, #000000);
          background: none;
          padding: 0;
        }
      `}</style>
    </pre>
  );
}
