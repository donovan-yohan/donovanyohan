# API_CONTRACT.md — Vault → Frontend (proposed)

The shape and guarantees the vault adapter exposes for the bullet-journal /
notebook UI to build against. This is the load-bearing contract.

> **Status:** PROPOSED. The implementation lands across the stacked PRs in
> epic #30:
> - `lib/vault/schema.ts`, `lib/vault/index.ts` — ticket #32 / PR #42
> - `lib/vault/adapter-local.ts`, `adapter-github.ts`, `walk.ts` — ticket #33
> - `lib/vault/render.ts` — ticket #34
> - `pages/writing/index.tsx`, `[slug].tsx` — ticket #35
>
> **Source of truth (once the code lands):** `lib/vault/schema.ts` (Zod) is
> canonical; this doc is the human-readable mirror. If they ever disagree, the
> code wins; raise a PR to fix this doc.
>
> **`import/no-restricted-paths` enforcement:** the ESLint rule + plugin lands
> with #33. Until then this contract describes the intended boundary; CI does
> not yet enforce it.

## Public types

```ts
export type Visibility = 'public' | 'private';

export type PreviewKind = 'text' | 'image' | 'quote' | 'embed';

export interface PreviewConfig {
  kind: PreviewKind;        // default 'text'
  span: number;             // 1-12; default 4
  accent?: string;          // design-token name (see DESIGN.md token list)
  tint?: string;            // design-token name
  headline?: string;        // overrides title for card display
  excerpt?: string;         // default = first paragraph of body
  image?: string;           // path/URL when kind === 'image'
}

export type NoteType = 'note' | 'work';

export interface BannerConfig {
  light?: string;           // public asset path (e.g. '/img/photos/manulifebanner.png')
  dark?: string;
}

export interface BgColorConfig {
  light?: string;           // hex colour (e.g. '#05AC5B')
  dark?: string;
}

export interface WorkInfoItem {
  label: string;            // displayed text
  href?: string;            // when present, renders as a link
}

export interface VaultFrontmatter {
  title: string;
  date: string;             // YYYY-MM-DD (Date object coerced to ISO; see P24)
  slug?: string;            // optional override; otherwise derived from filename
  visibility: Visibility;
  preview?: Partial<PreviewConfig>;

  // Work-type fields (Phase A / feat/vault-work-schema)
  // All optional and backwards-compatible — omitting them leaves existing notes
  // unaffected. Only meaningful when type === 'work'.
  type?: NoteType;          // default 'note'
  subtitle?: string;        // hero description (equivalent to <ArticleHero content>)
  banner?: BannerConfig;    // hero banner image paths
  bgColor?: BgColorConfig;  // hero background colour
  info?: WorkInfoItem[];    // metadata chips in the hero
  render?: Record<string, string>; // renderer hint map; e.g. { h2: 'highlighter' }

  // Passthrough: extra frontmatter keys (e.g. `mood`, `weather`) are preserved
  // but ignored by the publishing pipeline.
  [extra: string]: unknown;
}

export interface VaultNote {
  slug: string;             // canonical URL slug (derived or frontmatter override)
  path: string;             // vault-relative file path (e.g. "notes/2026-05-10-hello.md")
  frontmatter: VaultFrontmatter;
  body: string;             // SANITIZED HTML (rehype-sanitize applied; wikilinks stripped)
  bodyMarkdown: string;     // raw markdown body, sans frontmatter (for future renderers)
  preview: PreviewConfig;   // merged with defaults — never undefined fields
}

export interface VaultAdapter {
  getPublicNotes(): Promise<VaultNote[]>;
  // Slice 1+ adds:
  // getAllNotes(): Promise<VaultNote[]>;  // authed-only
}

export interface VaultConfig {
  source: 'local' | 'github';
  path?: string;             // when source === 'local'
  repoUrl?: string;          // when source === 'github' (Slice 1+)
  token?: string;            // when source === 'github' (Slice 1+)
  // Resolved by getVaultConfig() based on env vars; throws on missing
  // required values when NODE_ENV === 'production'.
}
```

## Public API surface

`lib/vault/index.ts` exports:

```ts
import type { VaultNote } from './schema';

/**
 * Returns all notes from the configured vault that resolved to `public`
 * via fail-closed visibility. Sorted by `frontmatter.date` descending.
 *
 * Internally memoized: the first call walks + parses the vault; subsequent
 * calls within the same Node process return the cached result. This keeps
 * getStaticPaths + getStaticProps amortized to O(N) total, not O(N²).
 *
 * Throws DuplicateSlugError if any notes share a slug.
 * Throws VaultConfigError if VAULT_PATH (Slice 0) or VAULT_REPO_URL+TOKEN
 *   (Slice 1) is missing in NODE_ENV=production.
 *
 * Safe to call from getStaticProps / getStaticPaths.
 * NEVER call from public client code.
 */
export function getPublicNotes(): Promise<VaultNote[]>;

/**
 * Convenience for /writing/[slug] getStaticProps. Equivalent to
 * `(await getPublicNotes()).find(n => n.slug === slug) ?? null`, but
 * shares the memoized cache with getPublicNotes() so per-slug lookups
 * are O(1) after the first walk.
 */
export function getNoteBySlug(slug: string): Promise<VaultNote | null>;

/**
 * Throws on missing required env vars. Called inside getStaticPaths/Props
 * to enforce production-mode env requirements WITHOUT crashing unrelated
 * routes at module-init time.
 */
export function getVaultConfig(): VaultConfig;
```

**Slice 1 will add** `getAllNotes()` — authed-only, fetches all notes
including private. ESLint `import/no-restricted-paths` will block public
routes from importing it. Do NOT use it from `pages/writing/**` or
`pages/index.tsx`.

## Slug rules (P11)

- Default: derived from filename (kebab-case, ASCII-only, Unicode/emoji stripped).
- Override: `frontmatter.slug` (must match `/^[a-z0-9][a-z0-9-]*$/`).
- Duplicate slugs across the public set throw `DuplicateSlugError` at build.

| Filename | Derived slug |
|---|---|
| `Hello World.md` | `hello-world` |
| `2026-05-10 Daily.md` | `2026-05-10-daily` |
| `What's New?.md` | `whats-new` |
| `résumé.md` | `resume` |
| `🚀 Launch.md` | `launch` |

## Visibility rules (P10, fail-closed)

The frontend can rely on these guarantees from `getPublicNotes()`:

- Every returned note has `frontmatter.visibility === 'public'`.
- Every returned note's frontmatter passed full schema validation.
- Notes with malformed YAML, missing fields, typo'd visibility, etc. are NEVER
  returned (they resolved to `private`).
- Wikilinks in `body` (HTML) are stripped to plain text.
- Wikilink targets to private slugs cause the build to fail (leak test).
- HTML in markdown body is sanitized (`<script>`, `<iframe>`, `onclick=`, etc.
  removed by `rehype-sanitize`).

**Default-deny.** `visibility: public` is the only opt-in. Anything else =
private. The frontend never receives private content via this API.

## Route shapes

### `/writing` (index)

```tsx
// pages/writing/index.tsx
import { getPublicNotes } from '@/lib/vault';

export const getStaticProps = async () => {
  const notes = await getPublicNotes();
  return { props: { notes } };
};

interface Props {
  notes: VaultNote[];      // sorted by date desc
}
```

### `/writing/[slug]` (detail)

```tsx
// pages/writing/[slug].tsx
import { getPublicNotes } from '@/lib/vault';

export const getStaticPaths = async () => {
  const notes = await getPublicNotes();
  return {
    paths: notes.map((n) => ({ params: { slug: n.slug } })),
    fallback: false,        // P27: no on-demand SSR for unknown slugs
  };
};

export const getStaticProps = async ({ params }) => {
  const notes = await getPublicNotes();
  const note = notes.find((n) => n.slug === params.slug);
  if (!note) return { notFound: true };
  return { props: { note } };
};

interface Props {
  note: VaultNote;
}
```

## Build metadata (P29)

Every build records:

- `<meta name="vault-sha" content="...">` in rendered HTML — current dy-journal HEAD SHA at build.
- `BUILD_VAULT_SHA` env var available at build time.
- One-line build summary in stdout: `vault: N public, M private, K errors (sha: abc1234)`.

Vercel keeps every deploy in its history; rollback = re-promote a prior deploy
(no per-note version history needed in Slice 0).

## What the frontend can NOT count on (yet)

- **No `getAllNotes()` in Slice 0** — Slice 1 adds this for the authed dashboard.
- **No live cross-note links** — wikilinks are stripped to plain text in
  Slice 0. Slice 2 ships graph + backlinks.
- **No webhook auto-rebuild** — Slice 0 deploys are manually triggered.
- **No bullet-journal UI yet** — Slice 0 ships unstyled list routes that prove
  the contract works. Notebook visual treatment is a separate WIP.
- **No prefetch-safe links to private content** — `<Link>` to private slugs
  doesn't exist; private content lives behind authed routes (`/journal/*`)
  added in Slice 1.

## Error contracts

```ts
class DuplicateSlugError extends Error {
  paths: string[];           // all colliding files (≥2)
  slug: string;
  resolutions: Array<'derived' | 'frontmatter'>; // parallel to paths
}

class VaultConfigError extends Error {
  missing: string[];         // env var names
}

class VaultParseError extends Error {
  path: string;              // file that failed
  reason: 'yaml' | 'schema' | 'visibility'; // error class
  // Per P22: this error is reported in the adapter's per-file results,
  // NOT thrown from getPublicNotes for private-but-malformed cases.
  // Public-but-malformed THROWS (author asked to publish, output broken).
}
```

## Stability promise

- The shapes in this doc are stable for Slice 0 and Slice 1.
- Optional fields may be added without breaking changes.
- Required fields cannot be added or removed without a major version bump.
- `getAllNotes` adds in Slice 1 alongside auth.
- Breaking changes require a CHANGELOG entry and a migration note in `VAULT.md`.

---

If you're authoring notes (not building the frontend), see
[dy-journal/AUTHORING.md](https://github.com/donovan-yohan/dy-journal/blob/HEAD/AUTHORING.md)
(branch-agnostic link).
If you're building the privacy adapter, see
[VAULT.md](./VAULT.md) (lands with ticket #38) and
[AGENTS.md](./AGENTS.md) for nightshift constraints.
