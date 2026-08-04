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
 * Disabled for the release candidate while the public articles receive their
 * final editorial pass. Flip to `true` once the blog is ready to ship.
 *
 * When `false`:
 *   - `pages/blog/index.tsx` returns `notFound` before reading the vault.
 *   - `pages/blog/[slug].tsx` generates no paths and returns `notFound`
 *     before reading the vault or requested slug.
 *   - `components/SiteNav.tsx` omits Blog from desktop and mobile navigation.
 */
export const BLOG_PAGE_ENABLED = false;
