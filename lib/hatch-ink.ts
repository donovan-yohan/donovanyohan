/**
 * Theme-conditional HatchScene `inkColor`. HatchScene's WebGL fragment
 * shader paints into a Canvas-backed framebuffer (can't read CSS vars),
 * so every HatchScene usage needs this helper paired with
 * `useContext(Context)` to keep dark mode legible per AGENTS.md's
 * "Theme awareness" rules.
 */
export const hatchInkColor = (theme: string) =>
  theme === "dark" ? "#ffffff" : "#1a1814";
