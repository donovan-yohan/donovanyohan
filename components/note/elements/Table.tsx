/**
 * Table.tsx — renders <table>, <tr>, <th>, and <td> elements for vault note content.
 *
 * TableRow and TableCell are co-located here since they're always used together.
 */

import React from "react";

// ── Table ─────────────────────────────────────────────────────────────────────

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children?: React.ReactNode;
}

export function Table({ children, className, ...rest }: TableProps) {
  return (
    <div className="note-table-wrapper">
      <table className={`note-table ${className ?? ""}`.trim()} {...rest}>
        {children}
      </table>
      <style jsx>{`
        .note-table-wrapper {
          overflow-x: auto;
          margin: 1em 0;
        }
        .note-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 15px;
        }
      `}</style>
    </div>
  );
}

// ── TableRow ─────────────────────────────────────────────────────────────────

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children?: React.ReactNode;
}

export function TableRow({ children, className, ...rest }: TableRowProps) {
  return (
    <tr className={`note-tr ${className ?? ""}`.trim()} {...rest}>
      {children}
      <style jsx>{`
        .note-tr {
          border-bottom: 1px solid var(--border, #757575);
        }
        .note-tr:last-child {
          border-bottom: none;
        }
      `}</style>
    </tr>
  );
}

// ── TableCell ────────────────────────────────────────────────────────────────

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  isHeader?: boolean;
  children?: React.ReactNode;
}

export function TableCell({ isHeader = false, children, className, ...rest }: TableCellProps) {
  const cls = `note-td ${isHeader ? "note-th" : ""} ${className ?? ""}`.trim();
  const Tag = isHeader ? "th" : "td";

  return (
    <Tag className={cls} {...rest}>
      {children}
      <style jsx>{`
        .note-td {
          padding: 0.5em 1em;
          text-align: left;
          vertical-align: top;
        }
        .note-th {
          font-weight: bold;
          background-color: var(--disabled, #ededed);
          border-bottom: 2px solid var(--border, #757575);
        }
      `}</style>
    </Tag>
  );
}
