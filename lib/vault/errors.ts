/**
 * errors.ts — typed error classes for the vault adapter.
 *
 * Per API_CONTRACT.md error contract:
 *   - DuplicateSlugError: two+ public notes share a slug
 *   - VaultConfigError: missing env vars in production
 *   - VaultParseError: public note with invalid frontmatter (author asked to publish)
 *
 * Per P25: No I/O, no env access, no side effects at module init.
 */

/**
 * Thrown when two or more public notes resolve to the same URL slug.
 * The build must fail; duplicate slugs are a routing error.
 *
 * Note: `paths` is string[] to support N-way collisions (3+ files),
 * not just the 2-file case in the earlier contract sketch.
 * `resolutions` mirrors `paths` in order: each entry describes how
 * the corresponding file got its slug.
 */
export class DuplicateSlugError extends Error {
  /** All file paths that share the slug (vault-relative). */
  paths: string[];
  /** The duplicated slug. */
  slug: string;
  /** How each path in `paths` got its slug. */
  resolutions: ("derived" | "frontmatter")[];

  constructor(
    slug: string,
    paths: string[],
    resolutions: ("derived" | "frontmatter")[],
  ) {
    super(
      `Duplicate slug "${slug}" across ${paths.length} notes:\n` +
        paths
          .map((p, i) => `  ${p} (${resolutions[i] ?? "derived"})`)
          .join("\n"),
    );
    this.name = "DuplicateSlugError";
    this.slug = slug;
    this.paths = paths;
    this.resolutions = resolutions;
  }
}

/**
 * Thrown by `getVaultConfig()` when required env vars are missing in
 * `NODE_ENV === 'production'`.
 */
export class VaultConfigError extends Error {
  /** Names of the missing env vars. */
  missing: string[];

  constructor(missing: string[]) {
    super(
      `Vault configuration error — missing required env vars in production:\n` +
        missing.map((v) => `  ${v}`).join("\n"),
    );
    this.name = "VaultConfigError";
    this.missing = missing;
  }
}

/**
 * Thrown for public notes that fail schema validation.
 * Per P22: public-but-malformed fails loudly. Private-but-malformed is
 * silently skipped (returned as an AdapterError, not thrown).
 */
export class VaultParseError extends Error {
  /** Vault-relative file path. */
  path: string;
  /** Classification of the parse failure. */
  reason: "yaml" | "schema" | "visibility";

  constructor(
    path: string,
    reason: "yaml" | "schema" | "visibility",
    detail?: string,
  ) {
    super(
      `Vault parse error in "${path}" (${reason})${detail ? ": " + detail : ""}`,
    );
    this.name = "VaultParseError";
    this.path = path;
    this.reason = reason;
  }
}
