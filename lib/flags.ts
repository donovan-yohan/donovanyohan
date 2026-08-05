/**
 * lib/flags.ts — compile-time feature flags.
 *
 * Single source of truth for in-progress features that aren't ready to ship.
 * Each flag is a plain boolean constant — flipping requires a commit + deploy,
 * which is the point: every change is reviewable and reversible via git.
 *
 * No env vars, no remote config, no I/O. Pages and nav components read these
 * constants directly. Pages that should 404 when their flag is off return
 * `notFound: true` from `getStaticProps`; nav components hide their links via
 * a simple boolean check.
 */

/**
 * `/about` page + topnav "About" tab.
 *
 * Disabled at initial redesign launch: the timeline content needs another
 * editorial pass before it's public. Flip to `true` once the page is ready.
 *
 * When `false`:
 *   - `pages/about.tsx` returns `notFound` from `getStaticProps` (real 404).
 *   - `components/SiteNav.tsx` omits the About tab from the nav row.
 */
export const ABOUT_PAGE_ENABLED = false;

/**
 * `/blog` index + article pages + navigation links.
 *
 * Enabled for the Tailnet release candidate so public and preview-visible
 * articles can be evaluated before the production release.
 *
 * When `true`:
 *   - `/blog` and eligible `/blog/[slug]` routes are generated from the vault.
 *   - `components/SiteNav.tsx` includes Blog in desktop and mobile navigation.
 *
 * Set this back to `false` to fail closed before any vault reads.
 */
export const BLOG_PAGE_ENABLED = true;
