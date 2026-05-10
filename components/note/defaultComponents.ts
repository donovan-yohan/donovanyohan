/**
 * defaultComponents.ts — maps HTML tag names to React components for the
 * vault note renderer.
 *
 * These are the baseline defaults. useResolvedComponents merges variant
 * overrides (from frontmatter.render) and per-route prop overrides on top.
 *
 * Tag names match the hast element names that rehype-react passes to the
 * component map. Each value is a React component that accepts the HTML
 * element's standard props (forwarded from hast).
 *
 * No eslint-disable — only semantic imports.
 */

import type { Components } from "hast-util-to-jsx-runtime";
import React from "react";
import { Heading } from "./elements/Heading";
import { Paragraph } from "./elements/Paragraph";
import { Link } from "./elements/Link";
import { Image } from "./elements/Image";
import { InlineCode } from "./elements/InlineCode";
import { CodeBlock } from "./elements/CodeBlock";
import { List } from "./elements/List";
import { ListItem } from "./elements/ListItem";
import { Blockquote } from "./elements/Blockquote";
import { Table, TableRow, TableCell } from "./elements/Table";

/**
 * ComponentMap is the subset of Components that we actively manage.
 * Remaining HTML elements fall through to rehype-react's built-in defaults.
 */
export type ComponentMap = Partial<Components>;

/**
 * buildDefaultComponents — returns the default tag-to-component map.
 *
 * Called once at module init; the map is stable and can be used as a
 * WeakMap key. Variants and overrides are merged by useResolvedComponents.
 */
export function buildDefaultComponents(): ComponentMap {
  return {
    // Headings — all levels share one component; level is derived from tag name
    // via the ExtraProps.node passed by rehype-react when passNode is on.
    // We use separate wrappers here for clarity and type safety.
    h1: (props) =>
      React.createElement(Heading, { ...props, level: 1 }),
    h2: (props) =>
      React.createElement(Heading, { ...props, level: 2 }),
    h3: (props) =>
      React.createElement(Heading, { ...props, level: 3 }),
    h4: (props) =>
      React.createElement(Heading, { ...props, level: 4 }),
    h5: (props) =>
      React.createElement(Heading, { ...props, level: 5 }),
    h6: (props) =>
      React.createElement(Heading, { ...props, level: 6 }),

    // Block elements
    p: Paragraph,
    blockquote: Blockquote,

    // Inline
    a: Link,
    img: Image,
    code: InlineCode,
    pre: CodeBlock,

    // Lists
    ul: (props) =>
      React.createElement(List, { ...props, ordered: false }),
    ol: (props) =>
      React.createElement(List, { ...props, ordered: true }),
    li: ListItem,

    // Tables
    table: Table,
    tr: TableRow,
    th: (props) => React.createElement(TableCell, { ...props, isHeader: true }),
    td: TableCell,
  };
}
