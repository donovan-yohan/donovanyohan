/**
 * Theme-conditional DotGrid color. Canvas-painted (can't read CSS vars),
 * so every DotGrid usage needs this helper paired with `useContext(Context)`
 * to keep dark mode visible per AGENTS.md's "Theme awareness" rules.
 */
export const dotGridColor = (theme: string) =>
  theme === "dark" ? "rgba(244, 240, 228, 0.12)" : "rgba(40, 38, 32, 0.18)";
