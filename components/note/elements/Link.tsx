/**
 * Link.tsx — renders <a> elements for vault note content.
 *
 * Routing rules:
 *   - Internal /writing/* paths → next/link for client-side navigation.
 *   - External URLs → plain <a> with target="_blank" rel="noopener noreferrer".
 *   - Preserves data-internal-vault-link attribute for future graph view (Slice 2+).
 *
 * The `className` is forwarded so HighlighterLink can compose this component.
 */

import React from "react";
import NextLink from "next/link";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  children?: React.ReactNode;
}

/** Returns true if href is a relative URL or starts with a known internal prefix. */
function isInternal(href: string): boolean {
  // Relative paths, hash links, or known internal route prefixes
  if (href.startsWith("/") || href.startsWith("#") || href.startsWith("./") || href.startsWith("../")) {
    return true;
  }
  // Absolute URLs are always external
  try {
    const url = new URL(href);
    // Same-origin check (only possible in browser; at SSR, treat absolute as external)
    if (typeof window !== "undefined" && url.origin === window.location.origin) {
      return true;
    }
    return false;
  } catch {
    // Unparseable — treat as internal (relative path without leading slash)
    return true;
  }
}

export function Link({ href, children, className, ...rest }: LinkProps) {
  if (!href) {
    return (
      <a className={`note-link ${className ?? ""}`.trim()} {...rest}>
        {children}
      </a>
    );
  }

  const internal = isInternal(href);
  const cls = `note-link ${className ?? ""}`.trim();

  if (internal) {
    return (
      <>
        {/* data-internal-vault-link flag preserved for future graph view (Slice 2+) */}
        <NextLink href={href} className={cls} data-internal-vault-link="true" {...rest}>
          {children}
        </NextLink>
        <style jsx>{`
          :global(.note-link) {
            color: var(--main, #000000);
            text-decoration: underline;
            text-decoration-color: var(--note-accent, var(--highlight, #ffef00));
            text-underline-offset: 3px;
            font-weight: bold;
          }
          :global(.note-link:hover) {
            color: var(--note-accent, var(--highlight, #ffef00));
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <a
        href={href}
        className={cls}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
      <style jsx>{`
        :global(.note-link) {
          color: var(--main, #000000);
          text-decoration: underline;
          text-decoration-color: var(--note-accent, var(--highlight, #ffef00));
          text-underline-offset: 3px;
          font-weight: bold;
        }
        :global(.note-link:hover) {
          color: var(--note-accent, var(--highlight, #ffef00));
        }
      `}</style>
    </>
  );
}
