/**
 * DropCap.tsx — large first-letter treatment for the first paragraph.
 *
 * This component is a thin wrapper; the actual drop-cap CSS lives on
 * Paragraph with variant="drop-cap". DropCap is exported for documentation
 * purposes and for tests that need to reference the variant by name.
 *
 * Special-case wiring (see NoteRenderer.tsx):
 *   When frontmatter.render["first-paragraph"] === "drop-cap", NoteRenderer
 *   detects the first <p> child in the hast tree and overrides its component
 *   to DropCap. This cannot be done generically in defaultComponents because
 *   it only applies to the FIRST paragraph — not all paragraphs.
 */

import React from "react";
import { Paragraph } from "../elements/Paragraph";

interface DropCapProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export function DropCap({ children, ...rest }: DropCapProps) {
  return (
    <Paragraph variant="drop-cap" {...rest}>
      {children}
    </Paragraph>
  );
}
