/**
 * lib/vault/index.ts — vault orchestrator.
 *
 * This is the ONLY module public pages should import from. Adapters are
 * never imported directly by pages (ESLint import/no-restricted-paths
 * enforces this via eslint.config.mjs).
 *
 * Exports:
 *   - getVaultConfig()   — reads env, throws VaultConfigError if required
 *                          env vars are missing whenever VAULT_SOURCE is set
 *   - getPublicNotes()   — memoized (per-process), adapter-selected,
 *                          sorted by date desc; throws DuplicateSlugError
 *                          on slug collision
 *   - getNoteBySlug()    — uses memoized cache; returns null for unknown slugs
 *   - __resetVaultCache__ — exported unconditionally; throws unless NODE_ENV==='test'
 *
 * Per P25: No I/O, no env validation at module init. All side effects
 * occur inside explicitly-called functions.
 */

import type { VaultNote, VaultConfig } from "./schema";
import { LocalVaultAdapter } from "./adapter-local";
import { GitHubVaultAdapter } from "./adapter-github";
import { assertNoDuplicateSlugs } from "./duplicate-check";
import { VaultConfigError } from "./errors";

// ── Config ────────────────────────────────────────────────────────────────────

/**
 * Reads env vars and returns the vault config.
 *
 * Throws VaultConfigError whenever VAULT_SOURCE is explicitly set and the
 * required env vars for that source are missing — regardless of NODE_ENV.
 * In development, falls back to __fixtures__/vault/ for VAULT_SOURCE=local
 * when VAULT_PATH is not set. Returns null in production when neither
 * VAULT_SOURCE nor VAULT_PATH is configured (forker-friendly empty vault).
 *
 * Called inside getStaticProps/getStaticPaths to enforce env validation
 * without crashing unrelated routes at module-init time (P20, P25).
 */
export function getVaultConfig(): VaultConfig | null {
  const sourceEnv = process.env.VAULT_SOURCE;
  const isProduction = process.env.NODE_ENV === "production";

  // Forker-friendly fallback (P20 relaxed): if NEITHER VAULT_SOURCE nor
  // VAULT_PATH is set in production, return null so the caller can render an
  // empty vault rather than crash. Common scenario: someone forks the
  // template, deploys to Vercel, hasn't wired up their vault yet — the site
  // should still build with /writing rendering the empty state.
  if (isProduction && !sourceEnv && !process.env.VAULT_PATH) {
    // Loud build-log warning so misconfig is debuggable later. Vercel build
    // logs are searchable; the [vault] prefix is the grep handle. The full
    // banner is intentionally noisy so operators don't miss it scrolling past.
    if (typeof console !== "undefined") {
      console.warn(
        "\n" +
          "═══════════════════════════════════════════════════════════════════\n" +
          "  [vault] WARNING: no vault source configured in production\n" +
          "  ────────────────────────────────────────────────────────────────\n" +
          "  Neither VAULT_SOURCE nor VAULT_PATH is set in this build.\n" +
          "  Falling back to empty notes set; /writing will render the empty\n" +
          "  state. This is the safe default for un-configured forks but is\n" +
          "  almost certainly wrong for a real deployment.\n" +
          "\n" +
          "  To publish notes, set:\n" +
          "    VAULT_SOURCE=local   + VAULT_PATH=/abs/path/to/vault\n" +
          "  or\n" +
          "    VAULT_SOURCE=github  + VAULT_REPO_URL=https://github.com/u/r\n" +
          "                         + VAULT_GITHUB_TOKEN=ghp_...\n" +
          "\n" +
          "  See VAULT.md for the full setup walkthrough.\n" +
          "═══════════════════════════════════════════════════════════════════\n",
      );
    }
    return null;
  }

  const source = sourceEnv ?? "local";

  if (source === "github") {
    const missing: string[] = [];
    const repoUrl = process.env.VAULT_REPO_URL;
    const token = process.env.VAULT_GITHUB_TOKEN;

    if (!repoUrl) missing.push("VAULT_REPO_URL");
    if (!token) missing.push("VAULT_GITHUB_TOKEN");

    // Strict enforcement still applies once you OPT IN to a source.
    if (missing.length > 0) {
      throw new VaultConfigError(missing);
    }

    return { source: "github", repoUrl: repoUrl!, token: token! };
  }

  // source === 'local'
  const vaultPath =
    process.env.VAULT_PATH ??
    (isProduction ? undefined : "__fixtures__/vault");

  if (!vaultPath) {
    // Reached only when VAULT_SOURCE=local was set explicitly without VAULT_PATH.
    throw new VaultConfigError(["VAULT_PATH"]);
  }

  return { source: "local", path: vaultPath };
}

// ── Memoization cache ─────────────────────────────────────────────────────────

let cachedNotes: VaultNote[] | null = null;
let cacheInflight: Promise<VaultNote[]> | null = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns all public vault notes, sorted by date descending.
 * Memoized per Node process — the adapter walk only happens once.
 * Throws DuplicateSlugError if any two public notes share a slug.
 */
export async function getPublicNotes(): Promise<VaultNote[]> {
  // Return from cache if already populated
  if (cachedNotes !== null) {
    return cachedNotes;
  }

  // Single-flight: if a fetch is already in progress, wait for it
  if (cacheInflight !== null) {
    return cacheInflight;
  }

  cacheInflight = (async () => {
    const config = getVaultConfig();
    // Forker-friendly: no vault configured in production → empty notes set.
    if (config === null) {
      return [];
    }
    let adapter;

    if (config.source === "github") {
      // Parse owner/repo from repoUrl (e.g. "https://github.com/owner/repo")
      const urlParts = config.repoUrl
        .replace(/^https?:\/\/github\.com\//, "")
        .replace(/\.git$/, "")
        .split("/");
      const owner = urlParts[0];
      const repo = urlParts[1];
      if (!owner || !repo) {
        throw new Error(
          `Invalid VAULT_REPO_URL: "${config.repoUrl}" — expected https://github.com/{owner}/{repo}`,
        );
      }
      adapter = new GitHubVaultAdapter({ owner, repo, token: config.token });
    } else {
      adapter = new LocalVaultAdapter(config.path);
    }

    const notes = await adapter.getPublicNotes();

    // Duplicate slug check (P11)
    assertNoDuplicateSlugs(notes);

    // Sort by date descending
    const sorted = [...notes].sort((a, b) =>
      b.frontmatter.date.localeCompare(a.frontmatter.date),
    );

    cachedNotes = sorted;
    cacheInflight = null;
    return sorted;
  })();

  try {
    return await cacheInflight;
  } catch (err) {
    // On error, clear inflight so the next call retries
    cacheInflight = null;
    throw err;
  }
}

/**
 * Returns a single public note by slug, or null if not found.
 * Uses the memoized cache from getPublicNotes().
 */
export async function getNoteBySlug(slug: string): Promise<VaultNote | null> {
  const notes = await getPublicNotes();
  return notes.find((n) => n.slug === slug) ?? null;
}

// ── Test helpers ──────────────────────────────────────────────────────────────

/**
 * Resets the in-process memoization cache.
 * Exported unconditionally (ESM cannot conditionally export), but throws
 * unless NODE_ENV === 'test'. DO NOT import or call this in production code.
 */
export function __resetVaultCache__(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("__resetVaultCache__ is only available in NODE_ENV=test");
  }
  cachedNotes = null;
  cacheInflight = null;
}
