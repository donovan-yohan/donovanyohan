/**
 * lib/vault/index.ts — vault orchestrator.
 *
 * This is the ONLY module public pages should import from. Adapters are
 * never imported directly by pages (ESLint import/no-restricted-paths
 * enforces this via eslint.config.mjs).
 *
 * Exports:
 *   - getVaultConfig()   — reads env, throws VaultConfigError if missing
 *                          required values in NODE_ENV=production
 *   - getPublicNotes()   — memoized (per-process), adapter-selected,
 *                          sorted by date desc; throws DuplicateSlugError
 *                          on slug collision
 *   - getNoteBySlug()    — uses memoized cache; returns null for unknown slugs
 *   - __resetVaultCache__ — exported ONLY in NODE_ENV=test for test isolation
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
 * In NODE_ENV=production, throws VaultConfigError if required env vars
 * are missing. In development, falls back to __fixtures__/vault/ for
 * VAULT_SOURCE=local.
 *
 * Called inside getStaticProps/getStaticPaths to enforce production env
 * without crashing unrelated routes at module-init time (P20, P25).
 */
export function getVaultConfig(): VaultConfig {
  const source = process.env.VAULT_SOURCE ?? "local";
  const isProduction = process.env.NODE_ENV === "production";

  if (source === "github") {
    const missing: string[] = [];
    const repoUrl = process.env.VAULT_REPO_URL;
    const token = process.env.VAULT_GITHUB_TOKEN;

    if (!repoUrl) missing.push("VAULT_REPO_URL");
    if (!token) missing.push("VAULT_GITHUB_TOKEN");

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
 * Only exported in NODE_ENV === 'test' to allow test isolation.
 * DO NOT import or call this in production code.
 */
export function __resetVaultCache__(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("__resetVaultCache__ is only available in NODE_ENV=test");
  }
  cachedNotes = null;
  cacheInflight = null;
}
