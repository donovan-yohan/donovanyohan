import { useState, useEffect, useCallback } from "react";
import type { AppProps } from "next/app";
import Context, { type ThemeContextValue } from "../components/context";

type Theme = "light" | "dark";

/**
 * Theme is owned here so every page reads the same value. Resolution order
 * on mount: explicit `localStorage["theme"]` first, then the system
 * `prefers-color-scheme: dark` query. Once the user clicks the toggle we
 * persist their choice — system preference no longer overrides it.
 */
export default function MyApp({ Component, pageProps }: AppProps) {
  // Seed from `data-theme` (already set by the inline themeBootstrap
  // script that runs before hydration). Reading the DOM-side value
  // here avoids a "flash of incorrect theme" for JS-driven visuals —
  // DotGrid, HatchScene, the nav toggle icon — whose initial render
  // would otherwise read "light" while the document is actually dark.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "light";
    const attr = document.documentElement.getAttribute("data-theme");
    return attr === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let initial: Theme;
    try {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored === "light" || stored === "dark") {
        initial = stored;
      } else {
        initial = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
    } catch {
      initial = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* localStorage unavailable; theme just won't persist this session */
      }
      return next;
    });
  }, []);

  const value: ThemeContextValue = { theme, toggleTheme };

  return (
    <Context.Provider value={value}>
      <Component {...pageProps} />
    </Context.Provider>
  );
}
