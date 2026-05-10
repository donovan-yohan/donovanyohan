/**
 * useSlugger — provides a per-note `github-slugger` Slugger instance so
 * duplicate heading texts within a single note get unique anchor IDs
 * (e.g. two "Introduction" headings become `introduction` + `introduction-1`).
 *
 * Why a context: the static `slug()` import from github-slugger has no state,
 * so it returns the same id for repeated text. A Slugger instance tracks the
 * occurrences and increments. NoteRenderer creates one Slugger per render and
 * provides it; Heading consumes it.
 */

import { createContext, useContext } from "react";
import GithubSlugger from "github-slugger";

export const SluggerContext = createContext<GithubSlugger | null>(null);

/**
 * Returns the active Slugger when called inside a NoteRenderer subtree.
 * Falls back to a fresh per-call instance outside the renderer so this hook
 * remains safe to use in isolated tests or one-off heading renders.
 */
export function useSlugger(): GithubSlugger {
  const ctx = useContext(SluggerContext);
  if (ctx) return ctx;
  // Fallback for tests / standalone usage. Each call gets its own instance —
  // duplicate detection is scoped to that instance.
  return new GithubSlugger();
}
