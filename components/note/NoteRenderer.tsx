/**
 * NoteRenderer.tsx — public API for rendering vault notes as React.
 *
 * Consumes sanitized HTML from the vault adapter (note.body) and renders
 * it via a unified() + rehype-parse + rehype-react pipeline.
 *
 * PHASE A COMPATIBILITY:
 *   All Phase A schema fields (type, banner, subtitle, info, render) are
 *   accessed via optional chaining with ?? null / ?? undefined defaults.
 *   This branch merges cleanly before feat/vault-work-schema lands.
 *
 * DROP-CAP SPECIAL CASE:
 *   When frontmatter.render["first-paragraph"] === "drop-cap", the component
 *   map cannot express "only the first <p>" because component maps apply to
 *   ALL elements of a given tag. Instead, we pre-process the sanitized HTML
 *   string to wrap only the first <p> with a data-drop-cap attribute, then
 *   use a custom `p` component that reads that attribute.
 *
 * CSS VARS:
 *   --note-accent and --note-tint are set on the <article> wrapper so all
 *   child components can reference them without prop-drilling.
 */

import React, { useMemo } from "react";
import GithubSlugger from "github-slugger";
import type { VaultNote } from "../../lib/vault/schema";
import type { ComponentMap } from "./defaultComponents";
import { useResolvedComponents } from "./hooks/useResolvedComponents";
import { SluggerContext } from "./hooks/useSlugger";
import { parseAndRender } from "./buildProcessor";
import { Paragraph } from "./elements/Paragraph";
import { DropCap } from "./variants/DropCap";

interface NoteRendererProps {
  note: VaultNote;
  /** Per-route component overrides (full escape hatch). */
  overrides?: Partial<ComponentMap>;
}

/**
 * Marks the first <p> tag in a sanitized HTML string with a data attribute.
 * Used for the drop-cap special case where only the first paragraph gets
 * special treatment. This runs on the HTML string before rehype-parse so we
 * don't need stateful rendering logic.
 */
function markFirstParagraph(html: string): string {
  // Replace the first occurrence of <p or <p> with a data-drop-cap marker.
  // rehype-sanitize has already run so the HTML is clean.
  return html.replace(/(<p)(\s|>)/, '$1 data-drop-cap="true"$2');
}

export function NoteRenderer({ note, overrides }: NoteRendererProps) {
  // Phase A: frontmatter.render is an optional map of tag-name → variant-name.
  // Current schema passthrough allows it to exist as an unknown extra field.
  const render = (note.frontmatter.render as Record<string, string> | undefined) ?? undefined;

  // Phase A: type field — determines layout (work vs. plain note).
  // Not used in this component directly; exposed via data-type attribute.
  const noteType = (note.frontmatter.type as string | undefined) ?? "note";

  // Whether the drop-cap treatment is requested via frontmatter.
  const useDropCap = render?.["first-paragraph"] === "drop-cap";

  // Build resolved components with frontmatter variants + prop overrides.
  const baseComponents = useResolvedComponents(render, overrides);

  // DROP-CAP SPECIAL CASE:
  // If render["first-paragraph"] === "drop-cap", inject a custom `p` component
  // that reads the data-drop-cap attribute (set by markFirstParagraph on the
  // HTML string) and renders DropCap for that first paragraph only.
  const components: ComponentMap = useMemo(() => {
    if (!useDropCap) {
      return baseComponents;
    }

    const dropCapP: ComponentMap["p"] = ({ children, ...props }) => {
      // The first paragraph has data-drop-cap="true" injected into the HTML.
      // Rehype-react forwards data attributes as props.
      const isFirst = (props as Record<string, unknown>)["data-drop-cap"] === "true";
      if (isFirst) {
        // Strip the data-drop-cap attribute before forwarding to DropCap.
        // Prefixed with _ to signal intentional omission per lint config.
        const { "data-drop-cap": _dc, ...cleanProps } = props as Record<string, unknown> & { "data-drop-cap"?: string };
        void _dc; // consumed above — omit from forwarded props
        return React.createElement(DropCap, cleanProps as React.HTMLAttributes<HTMLParagraphElement>, children);
      }
      return React.createElement(Paragraph, props, children);
    };

    return { ...baseComponents, p: dropCapP };
  }, [baseComponents, useDropCap]);

  // Memoize HTML preprocessing — `note.body` can be sizeable and the regex
  // walk is wasteful on every re-render.
  const html = useMemo(
    () => (useDropCap ? markFirstParagraph(note.body) : note.body),
    [note.body, useDropCap],
  );

  // Memoize the parsed + rendered React tree. The processor itself is also
  // memoized per-components-map (see buildProcessor.ts) so this just avoids
  // re-walking the parser when neither input changes.
  const tree = useMemo(
    () => parseAndRender(html, components),
    [html, components],
  );

  // A fresh Slugger per render of this note so duplicate heading texts
  // within the note get unique IDs (introduction, introduction-1, ...).
  // Tied to note.slug so the Slugger doesn't leak state across navigations.
  const slugger = useMemo(() => new GithubSlugger(), [note.slug]);

  return (
    <SluggerContext.Provider value={slugger}>
      <article
        data-slug={note.slug}
        data-type={noteType}
        style={
          {
            // CSS vars consumed by child components for accent colour theming.
            // Defaults fall back to the site-wide --accent and transparent.
            ["--note-accent" as string]: note.preview.accent ?? "var(--highlight, #ffef00)",
            ["--note-tint" as string]: note.preview.tint ?? "transparent",
          } as React.CSSProperties
        }
      >
        {tree}
      </article>
    </SluggerContext.Provider>
  );
}
