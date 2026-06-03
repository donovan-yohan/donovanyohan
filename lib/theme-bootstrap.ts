/**
 * Inline script string injected into every page's <Head> before React
 * hydrates. Reads stored theme preference (or system) and applies
 * `data-theme` to <html> before first paint to prevent wrong-theme flash.
 * _app.tsx re-reads the same source of truth into Context.
 */
export const themeBootstrap = `(function(){try{var s=localStorage.getItem('theme');var d=s==='dark'||s==='light'?s==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;
