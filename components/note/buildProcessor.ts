/**
 * buildProcessor.ts — unified() + rehype-parse + rehype-react factory.
 *
 * Creates a unified processor that:
 *   1. Parses a sanitized HTML string fragment (rehype-parse, fragment: true).
 *   2. Transforms hast nodes into React elements (rehype-react).
 *
 * MEMOIZATION:
 *   The processor is keyed on the components map object via a WeakMap.
 *   Because each unique components map identity represents a different
 *   rendering configuration, we create one processor per unique map.
 *   This avoids re-creating the unified pipeline on every render while
 *   still handling per-note variant overrides correctly.
 *
 *   WeakMap is appropriate because:
 *     - Keys are objects (ComponentMap) — they will be GC'd when the
 *       React tree unmounts, so no memory leak.
 *     - The cache grows at most to the number of distinct component maps
 *       alive at once (typically 1–3 per page).
 *
 * REACT 18+ AUTOMATIC RUNTIME:
 *   rehype-react accepts Fragment, jsx, jsxs from react/jsx-runtime which
 *   avoids importing React into every file that produces JSX.
 */

import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeReact from "rehype-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import type { Options, Jsx } from "hast-util-to-jsx-runtime";
import type { ComponentMap } from "./defaultComponents";

/** Unified processor type produced by the pipeline. */
type NoteProcessor = ReturnType<typeof buildFreshProcessor>;

/**
 * Cache: WeakMap<ComponentMap, NoteProcessor>.
 * Keyed on the resolved component map object so each distinct config
 * gets exactly one processor instance.
 */
const processorCache = new WeakMap<ComponentMap, NoteProcessor>();

/**
 * Creates a fresh unified processor with rehype-parse + rehype-react.
 * Do not call this directly — use getProcessor() for the memoized version.
 */
function buildFreshProcessor(components: ComponentMap) {
  // Build the rehype-react options targeting the production runtime.
  // development: false explicitly selects the OptionsProduction branch of the
  // discriminated union, so jsx/jsxs are expected (not jsxDEV).
  const options: Options = {
    Fragment,
    jsx: jsx as Jsx,
    jsxs: jsxs as Jsx,
    development: false,
    // Element attribute naming for React (class → className, etc.)
    elementAttributeNameCase: "react",
    stylePropertyNameCase: "dom",
    // Component map: maps tag names to React components.
    components: components as Options["components"],
  };

  return (
    unified()
      .use(rehypeParse, {
        // fragment: true — parse as an HTML fragment, not a full document.
        // This prevents rehype from adding <html><head><body> wrappers.
        fragment: true,
      })
      .use(rehypeReact, options)
  );
}

/**
 * getProcessor — returns a memoized processor for the given component map.
 *
 * Builds one processor per unique components-map identity. Subsequent calls
 * with the same object reference return the cached processor immediately.
 */
export function getProcessor(components: ComponentMap): NoteProcessor {
  if (processorCache.has(components)) {
    return processorCache.get(components)!;
  }

  const processor = buildFreshProcessor(components);
  processorCache.set(components, processor);
  return processor;
}

/**
 * parseAndRender — processes sanitized HTML through the unified pipeline.
 *
 * Returns the React element tree produced by rehype-react.
 * The input `html` MUST already be sanitized (rehype-sanitize applied by the
 * vault adapter). No additional sanitization is performed here.
 */
export function parseAndRender(html: string, components: ComponentMap): React.ReactElement {
  const processor = getProcessor(components);
  const file = processor.processSync(html);
  return file.result as React.ReactElement;
}
