/**
 * List.tsx — renders <ul> and <ol> elements for vault note content.
 * ListItem.tsx logic is co-located here for simplicity.
 */

import React from "react";

interface ListProps extends React.HTMLAttributes<HTMLUListElement | HTMLOListElement> {
  ordered?: boolean;
  children?: React.ReactNode;
}

export function List({ ordered = false, children, className, ...rest }: ListProps) {
  const cls = `note-list ${ordered ? "note-list--ordered" : "note-list--unordered"} ${className ?? ""}`.trim();

  if (ordered) {
    return (
      <ol className={cls} {...(rest as React.OlHTMLAttributes<HTMLOListElement>)}>
        {children}
        <style jsx>{`
          .note-list {
            margin: 0.5em 0 1em;
            padding-left: 1.75em;
            line-height: 2;
          }
        `}</style>
      </ol>
    );
  }

  return (
    <ul className={cls} {...(rest as React.HTMLAttributes<HTMLUListElement>)}>
      {children}
      <style jsx>{`
        .note-list {
          margin: 0.5em 0 1em;
          padding-left: 1.75em;
          line-height: 2;
        }
      `}</style>
    </ul>
  );
}
