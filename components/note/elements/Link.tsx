/**
 * Link.tsx — renders <a> elements for vault note content.
 *
 * Routing classes:
 *   - Internal /writing/* paths → next/link for client-side navigation.
 *     Preserves data-internal-vault-link attribute for future graph view (Slice 2+).
 *   - Protocol handlers (mailto:, tel:, sms:) → plain <a> WITHOUT target="_blank".
 *     Opening these in a new tab is hostile UX since they invoke external apps.
 *   - External http(s) URLs → plain <a> with target="_blank" rel="noopener noreferrer".
 *
 * The `className` is forwarded so HighlighterLink can compose this component.
 */

import React from "react";
import NextLink from "next/link";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  children?: React.ReactNode;
}

type LinkKind = "internal" | "protocol" | "external";

const PROTOCOL_HANDLERS = ["mailto:", "tel:", "sms:"];

/** Classifies an href so the renderer can pick the right anchor strategy. */
function classifyHref(href: string): LinkKind {
  // Protocol handlers — never open in a new tab.
  for (const p of PROTOCOL_HANDLERS) {
    if (href.startsWith(p)) return "protocol";
  }
  // Relative paths, hash links, or known internal route prefixes.
  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("./") ||
    href.startsWith("../")
  ) {
    return "internal";
  }
  // Absolute URLs — same-origin counts as internal (only knowable in browser).
  try {
    const url = new URL(href);
    if (typeof window !== "undefined" && url.origin === window.location.origin) {
      return "internal";
    }
    return "external";
  } catch {
    // Unparseable — treat as internal (relative path without leading slash).
    return "internal";
  }
}

// Single shared style — emitted once at the bottom of every branch.
const linkStyle = (
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
);

export function Link({ href, children, className, ...rest }: LinkProps) {
  const cls = `note-link ${className ?? ""}`.trim();

  if (!href) {
    return (
      <>
        <a className={cls} {...rest}>
          {children}
        </a>
        {linkStyle}
      </>
    );
  }

  const kind = classifyHref(href);

  if (kind === "internal") {
    return (
      <>
        <NextLink
          href={href}
          className={cls}
          data-internal-vault-link="true"
          {...rest}
        >
          {children}
        </NextLink>
        {linkStyle}
      </>
    );
  }

  if (kind === "protocol") {
    // mailto: / tel: / sms: — no target=_blank; native handler opens the app.
    return (
      <>
        <a href={href} className={cls} {...rest}>
          {children}
        </a>
        {linkStyle}
      </>
    );
  }

  // External http(s).
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
      {linkStyle}
    </>
  );
}
