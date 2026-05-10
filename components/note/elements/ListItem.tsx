/**
 * ListItem.tsx — renders <li> elements for vault note content.
 */

import React from "react";

interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode;
}

export function ListItem({ children, className, ...rest }: ListItemProps) {
  return (
    <li className={`note-li ${className ?? ""}`.trim()} {...rest}>
      {children}
      <style jsx>{`
        .note-li {
          margin-bottom: 0.25em;
        }
      `}</style>
    </li>
  );
}
