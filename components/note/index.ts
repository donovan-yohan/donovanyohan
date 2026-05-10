/**
 * index.ts — public re-exports for components/note.
 *
 * Import from "components/note" for all public API surface.
 * Internal modules (buildProcessor, defaultComponents, hooks) are not
 * re-exported here to keep the public API minimal.
 */

export { NoteRenderer } from "./NoteRenderer";
export type { ComponentMap } from "./defaultComponents";
export { WorkHero } from "./WorkHero";
export type { WorkHeroProps } from "./WorkHero";

// Element components (for consumers who need to compose custom components)
export { Heading } from "./elements/Heading";
export { Paragraph } from "./elements/Paragraph";
export { Link } from "./elements/Link";
export { Image } from "./elements/Image";
export { InlineCode } from "./elements/InlineCode";
export { CodeBlock } from "./elements/CodeBlock";
export { List } from "./elements/List";
export { ListItem } from "./elements/ListItem";
export { Blockquote } from "./elements/Blockquote";
export { Table, TableRow, TableCell } from "./elements/Table";

// Variant components
export { HighlighterLink } from "./variants/HighlighterLink";
export { PullQuote } from "./variants/PullQuote";
export { DropCap } from "./variants/DropCap";
export { TableOfContents } from "./variants/TableOfContents";
