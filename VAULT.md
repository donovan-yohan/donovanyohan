# VAULT.md — Vault adapter operator guide

How `donovanyohan.com` reads content from the private Obsidian vault, what
guarantees the privacy boundary makes, and how to debug when notes don't appear.

> **Audience:** primarily Donovan as the operator + nightshift sub-agents
> working on `lib/vault/**`. Forkers welcome (the architecture is portable),
> but kit-friendliness is a bonus, not the primary goal.
>
> **Companion docs:**
> - `AGENTS.md` — load-bearing-files rules for AI editing
> - `API_CONTRACT.md` — frontend contract (proposed shape)
> - `dy-journal/AUTHORING.md` — author-side guide for what frontmatter to type

## Architecture in one diagram

```
┌─────────────────────┐     git push       ┌────────────────────┐
│  Obsidian (you)     │ ─────────────────▶ │ dy-journal (private │
│  edits notes        │                    │ GitHub repo)        │
└─────────────────────┘                    └────────┬────────────┘
                                                    │
                                  fine-grained PAT  │  Tarball API
                                  Contents: read    │  GET /tarball/{ref}
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              donovanyohan (public GitHub repo)                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Build (Vercel)                                            │ │
│  │                                                             │ │
│  │  lib/vault/index.ts                                         │ │
│  │  ├─ getVaultConfig()  — env validation, function-scoped     │ │
│  │  ├─ getPublicNotes()  — memoized; walk-then-stop-if-private │ │
│  │  └─ getNoteBySlug()   — uses memoized cache                 │ │
│  │                                                             │ │
│  │  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    │ │
│  │  │ adapter-    │    │ walk +       │    │ schema +     │    │ │
│  │  │ local       │ or │ ignore-list  │ →  │ fail-closed  │    │ │
│  │  │ adapter-    │    │ + symlink    │    │ + slug deriv │    │ │
│  │  │ github      │    │ rejection    │    │ + render     │    │ │
│  │  └─────────────┘    └──────────────┘    └──────────────┘    │ │
│  │                            │                                │ │
│  │                            ▼                                │ │
│  │                     leak test (CI gate)                     │ │
│  │                            │                                │ │
│  └────────────────────────────┼────────────────────────────────┘ │
│                               ▼                                  │
│                       /writing  /writing/[slug]                  │
└─────────────────────────────────────────────────────────────────┘
```

## Privacy contract — what you can rely on

1. **Default-deny.** `visibility: public` is the only opt-in. Anything else
   (missing field, typo, malformed YAML, `private`, `draft`) → **private**.
2. **Walk-then-stop-if-private.** Private notes never have their bodies parsed,
   sanitized, or have excerpts computed. Build code only touches public bodies.
3. **Walk ignore-list (the "P17" rule throughout this doc).** Files under
   `.obsidian/`, `.trash/`, `.git/`, `.github/`, `node_modules/`, `templates/`
   are never read. Even a public note inside `.trash/` stays invisible (move
   it back to `notes/` to publish). When this doc references "P17" elsewhere,
   it means the walk-ignore-list rule defined here.
4. **Symlinks rejected by default.** No `vault/public.md → /etc/passwd`
   exfiltration vectors.
5. **Tarball traversal protection.** GitHub Tarball entries with `..`, absolute
   paths, hardlinks, device entries, or symlinks are rejected during extraction.
6. **HTML sanitized.** `<script>`, `<iframe>`, `onclick=` etc. stripped from
   markdown body output by `rehype-sanitize`.
7. **Wikilinks stripped.** Slice 0 strips all Obsidian wikilink syntax to plain
   text. Cross-note rendering ships in Slice 2.
8. **Wikilink-target leak check.** Build fails if a public note's wikilink
   target resolves to a private slug (would leak existence of private notes).
9. **No public revision history.** The site renders current `HEAD` only; the
   build never reads `git log`. Promotion (private → public) is a clean cut.
10. **Module init is pure.** No I/O, no env validation, no throws at import
    time. Unrelated portfolio routes never crash on missing vault env.
11. **Static path mode.** `getStaticPaths` returns `fallback: false`. Unknown
    slugs 404 cleanly; no on-demand SSR can be tricked into rendering private.
12. **Fine-grained PAT only.** Token scoped to `dy-journal` only with
    `Contents: read` + `Metadata: read`. Classic PATs (with broad `repo` scope)
    are rejected.
13. **CI leak test.** Every PR is gated by a leak test that walks built
    artifacts (`.next/server/**`, `.next/static/**/*.{js,map}`,
    `.next/cache/fetch-cache/**`, `.next/trace`, `_next/data/`, `out/**`,
    `public/**`) plus HTTP-level checks (request `/sitemap.xml`, `/robots.txt`,
    `/feed.xml`, `/_next/data/...json`, OG endpoints) for any private fixture
    string. Includes a positive-control canary so a broken test fails loudly.

## Vault layout

The adapter walks the vault root recursively. Conventions:

```
dy-journal/                # vault root
├── README.md              # vault-side readme (about the vault)
├── AUTHORING.md           # frontmatter cheat-sheet (operator-facing)
├── notes/                 # public + private notes (walked)
│   └── *.md
├── templates/             # Templater templates (NOT walked — P17)
│   └── note.md
├── .obsidian/             # workspace config (NOT walked)
├── .trash/                # soft-deleted (NOT walked)
├── attachments/           # images etc. (only walked for *.md, so ignored)
└── .gitignore
```

## Frontmatter contract

```yaml
---
title: My note               # REQUIRED, non-empty string
date: 2026-05-10             # REQUIRED, YYYY-MM-DD
visibility: public           # OPT-IN to publish (anything else = private)
slug: my-note                # OPTIONAL, override derived slug
preview:                     # OPTIONAL, all sub-fields optional
  kind: text                 # text | image | quote | embed
  span: 4                    # 1-12 grid columns
  accent: yellow             # design-token name (see below)
  tint: paper                # design-token name
  headline: Custom card title
  excerpt: First-paragraph override
  image: /img/hero.png       # when kind: image
mood: focused                # arbitrary passthrough — preserved but ignored
---

Body markdown here.
```

## Slug rules

- Default: derived from filename (kebab-case, ASCII-only, Unicode/emoji stripped, apostrophes contracted).
- Override: `frontmatter.slug` matching `/^[a-z0-9][a-z0-9-]*$/`.
- Build fails on duplicate slugs across the public set (`DuplicateSlugError`).
- Filenames consisting entirely of non-ASCII (e.g. `🚀🔥🎉.md`) collapse to `''` and resolve to private.

| Filename | Derived slug |
|---|---|
| `Hello World.md` | `hello-world` |
| `2026-05-10 Daily.md` | `2026-05-10-daily` |
| `What's New?.md` | `whats-new` |
| `résumé.md` | `resume` |
| `🚀 Launch.md` | `launch` |
| `Note (draft).md` | `note-draft` |

## Setup — getting it running locally

### 1. Clone both repos

```bash
git clone git@github.com:donovan-yohan/donovanyohan.git
git clone git@github.com:donovan-yohan/dy-journal.git    # private, requires access
```

### 2. Install deps

```bash
cd donovanyohan
npm install
```

### 3. Generate a fine-grained PAT

GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
tokens → "Generate new token":

- **Repository access:** Only select repositories → `dy-journal`
- **Permissions → Repository:** Contents (Read), Metadata (Read)
- **Expiration:** 90 days (max). Set a calendar reminder to rotate.

⚠️ **Do NOT use a classic PAT.** Classic `repo` scope grants read+write to all
your private repos — much larger blast radius if leaked.

### 4. Create `.env.local`

```bash
# Slice 0 (local dev — read straight from disk)
VAULT_SOURCE=local
VAULT_PATH=/absolute/path/to/dy-journal

# Slice 1+ (production — uncomment when shipping authed/webhook flows)
# VAULT_SOURCE=github
# VAULT_REPO_URL=https://github.com/donovan-yohan/dy-journal
# VAULT_GITHUB_TOKEN=github_pat_...
# OWNER_GITHUB_LOGIN=donovan-yohan
# VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
# VAULT_WEBHOOK_SECRET=long-random-string
```

`VAULT_PATH` accepts absolute paths or paths relative to the portfolio repo
root (e.g. `../dy-journal`). Production (`NODE_ENV=production`) requires the
env vars to be set explicitly — no fixture fallback.

### 5. Run

```bash
npm run dev
# → http://localhost:3000/writing renders public notes from VAULT_PATH
```

## Daily workflow — Donovan

```bash
# 1. Write a note in Obsidian
# 2. Save (cmd+s)
# 3. Commit + push from dy-journal:
cd /path/to/dy-journal
git add . && git commit -m "post: hello world" && git push

# 4. Trigger a Vercel deploy manually (Slice 0 has no webhook yet):
#    Visit Vercel dashboard → donovanyohan → Deployments → "Redeploy"
#    OR set up Vercel CLI: `vercel --prod`

# 5. Verify live at https://donovanyohan.com/writing
```

Slice 1 adds the webhook: vault push → automatic rebuild.

## Debugging — "I added a note and it didn't appear"

**Run the vault-lint report.** Single most useful command.

```bash
cd /path/to/donovanyohan
npm run vault-lint -- --report /path/to/dy-journal
```

Output looks like:

```
[public] notes/2026-05-10-hello-world.md
[private] notes/private-q3-planning.md       (no visibility field)
[private] notes/draft-rough-thoughts.md       (visibility: draft → not public)
[private] notes/malformed-frontmatter.md      (yaml parse error)
[error] notes/duplicate-slug.md               (collides with notes/other.md)
[ignored] .trash/old-public.md                (excluded by walk allowlist)
[ignored] .obsidian/workspace.json            (excluded by walk allowlist)

Summary: 1 public, 3 private, 1 error, 2 ignored
```

If your note appears as `[private]`:

- Check `visibility` field is exactly `public` (not `Public`, `public `, unquoted YAML treating it as boolean, etc.)
- Check `title` and `date` are present and well-formed
- Check the YAML overall — missing colons, bad indentation are common

If your note appears as `[ignored]`:

- It's in `.trash/`, `.obsidian/`, `templates/`, etc. — move it out

If the build fails with `DuplicateSlugError`:

- Two notes share a slug. Either rename one file or set explicit `slug:` in frontmatter to disambiguate.

If the build fails with the leak test:

- A private string (or wikilink to a private slug) made it into a public artifact.
- Error message names the file path and the leaking string.
- Fix: edit the public note to not reference private content, OR mark the source private.
- False positive (legitimate overlap): conservative-by-design — restate the public note's prose.

## Pre-commit hook (recommended)

In `dy-journal/.git/hooks/pre-commit`:

```bash
#!/bin/sh
PORTFOLIO_PATH=/path/to/donovanyohan
VAULT_PATH="$(git rev-parse --show-toplevel)"
cd "$PORTFOLIO_PATH" && npm run vault-lint -- "$VAULT_PATH"
```

`chmod +x .git/hooks/pre-commit`. Now every `git commit` in `dy-journal` lints
your vault first.

## Token rotation

Fine-grained PATs expire (90 days max). Rotation:

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → "Regenerate"
2. Copy new token
3. Vercel → donovanyohan → Settings → Environment Variables → Update `VAULT_GITHUB_TOKEN`
4. Trigger a redeploy
5. (Optional) update local `.env.local`
6. Calendar reminder for next rotation

If you forget and the token expires, the next deploy will fail with a clear
401 error message. Production stays on the previous deploy until you rotate.

## Webhook secret rotation (Slice 1+)

For `VAULT_WEBHOOK_SECRET`:

1. Generate new secret: `openssl rand -hex 32`
2. Vercel: update env var
3. GitHub → dy-journal → Settings → Webhooks → edit → update secret
4. In-flight deliveries with old signatures fail with 403 — replay them manually from GitHub's "Recent Deliveries" UI

## Incident response — privacy leak shipped

If a leak somehow makes it past the test (it shouldn't, but):

1. **Immediately:** Vercel dashboard → Deployments → previous good deploy → "Promote to production". The leaked deploy is no longer reachable.
2. **Rotate** `VAULT_GITHUB_TOKEN` (the leak test gate failed — assume token policy is the only line of defense for the duration of this incident).
3. **Audit:** GitHub → dy-journal → Settings → Audit log. Vercel → Deployments → check who pulled the leaked URL.
4. **Post-mortem:** add the leak's specific shape to the leak-test fixture as a new canary. Make sure CI catches it next time. Don't silence the test.

## Versioning + rollback

- Every Vercel deploy is immutable + addressable forever via its
  `<project>-<deploy-sha>-<team>.vercel.app` URL.
- Each build stamps `<meta name="vault-sha" content="...">` in HTML and a
  `vault: N public, M private, K errors (sha: abc1234)` line in build output.
- Rollback = re-promote a prior deploy in Vercel (no per-note version history
  in Slice 0).

## Where this contract is enforced

| Guarantee | Where |
|---|---|
| Default-deny visibility | `lib/vault/fail-closed.ts` + table tests |
| Walk ignore-list | `lib/vault/walk.ts` + walk tests |
| Symlink rejection | `lib/vault/walk.ts` (`followSymbolicLinks: false`) |
| Tarball traversal | `lib/vault/adapter-github.ts` extraction guards |
| HTML sanitization | `lib/vault/render.ts` (`rehype-sanitize`) |
| Wikilink strip | `lib/vault/wikilinks.ts` (remark plugin) |
| Wikilink-target leak | leak test in CI |
| No public history | adapter reads working tree only, never `git log` |
| Module purity | (no enforcement; reviewed via AGENTS.md rules) |
| Static path mode | `pages/writing/[slug].tsx` `fallback: false` |
| PAT scope | (manual; documented above) |
| Build artifact leak | leak test in CI (`test/leak.test.ts`) |
| HTTP-level leak | leak test in CI (spawns `next start`, curls endpoints) |

If you're modifying any of these, **stop and read `AGENTS.md` first**. Most are
explicitly load-bearing.
