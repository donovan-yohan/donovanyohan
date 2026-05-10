/**
 * useResolvedComponents.ts — merges default components + frontmatter variants
 * + per-route prop overrides into a stable component map.
 *
 * Resolution order (later wins):
 *   1. buildDefaultComponents() — baseline tag-to-component map.
 *   2. Frontmatter render map variants — e.g. render.h2 === "highlighter"
 *      swaps the h2 entry for a wrapper that passes variant="highlighter".
 *   3. Per-route `overrides` prop — full escape hatch for the page author.
 *
 * MEMOIZATION:
 *   useMemo with stable deps (render map stringified, overrides object ref).
 *   The resulting map object is referentially stable as long as deps don't
 *   change, which allows buildProcessor.ts's WeakMap cache to work correctly.
 *
 * PHASE A COMPATIBILITY:
 *   `render` is typed as `Record<string, string> | undefined`. If Phase A's
 *   schema extension adds typed render fields, this hook will still work via
 *   passthrough (extra keys are ignored gracefully).
 */

import { useMemo } from "react";
import React from "react";
import { buildDefaultComponents, type ComponentMap } from "../defaultComponents";
import { Heading } from "../elements/Heading";
import { PullQuote } from "../variants/PullQuote";
import { HighlighterLink } from "../variants/HighlighterLink";

/**
 * Reads the frontmatter `render` map and returns variant overrides to
 * merge into the default component map.
 *
 * Supported render keys:
 *   - `h1`..`h6` === "highlighter" → Heading with variant="highlighter"
 *   - `blockquote` === "pull-quote" → PullQuote component
 *   - `a` === "highlighter" → HighlighterLink component
 *   - `first-paragraph` === "drop-cap" → handled in NoteRenderer directly
 *     (special case: only the FIRST paragraph, not all paragraphs)
 *
 * @param render - The frontmatter render map (may be undefined for plain notes)
 */
function resolveVariants(render: Record<string, string> | undefined): ComponentMap {
  if (!render) return {};

  const variants: ComponentMap = {};

  // Heading level variants
  const headingLevels = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
  for (const tag of headingLevels) {
    const level = parseInt(tag[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
    if (render[tag] === "highlighter") {
      // Wrapper that injects variant="highlighter" into the Heading component.
      // We don't create a separate H2Highlighter component; variant is a prop.
      variants[tag] = (props) =>
        React.createElement(Heading, { ...props, level, variant: "highlighter" });
    }
  }

  // Blockquote variant
  if (render["blockquote"] === "pull-quote") {
    variants["blockquote"] = PullQuote;
  }

  // Link variant
  if (render["a"] === "highlighter") {
    variants["a"] = HighlighterLink;
  }

  // Note: render["first-paragraph"] === "drop-cap" is handled in NoteRenderer
  // because it must only apply to the FIRST paragraph in the body, not all <p>
  // elements. Component-map swaps cannot express positional logic.

  return variants;
}

/**
 * useResolvedComponents — stable, memoized component map for NoteRenderer.
 *
 * @param render    - The frontmatter render map (Phase A optional field)
 * @param overrides - Per-route component overrides from the NoteRenderer prop
 */
export function useResolvedComponents(
  render: Record<string, string> | undefined,
  overrides: ComponentMap | undefined,
): ComponentMap {
  // Stringify the render map as a stable memo dep.
  // The overrides object identity is used directly (callers should memoize it).
  const renderKey = render ? JSON.stringify(render) : "";

  return useMemo(() => {
    const base = buildDefaultComponents();
    const variants = resolveVariants(render);
    // Merge: base → variants → overrides
    return { ...base, ...variants, ...(overrides ?? {}) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderKey, overrides]);
}
