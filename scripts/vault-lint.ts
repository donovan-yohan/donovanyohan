/**
 * vault-lint.ts — CLI that walks a vault directory and checks:
 *   1. Schema validity (via VaultFrontmatterSchema / resolveVisibility)
 *   2. Slug uniqueness across the entire walked set (P11)
 *
 * Usage:
 *   npm run vault-lint -- <vault-path>
 *   npm run vault-lint -- --report <vault-path>
 *   npm run vault-lint -- --json <vault-path>
 *
 * Exit codes:
 *   0 — no errors
 *   1 — one or more schema/slug/yaml errors
 *
 * Design decisions (see API_CONTRACT.md, DESIGN.md P23, P11):
 *   - Fail-closed: any file that can't be parsed is flagged as an error.
 *   - No I/O at module init; all side-effects inside main().
 *   - js-yaml is already in node_modules (transitive dep of @eslint/eslintrc).
 *   - No eslint-disable directives anywhere.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, basename } from "path";
import { load as yamlLoad } from "js-yaml";
import { resolveVisibility } from "../lib/vault/fail-closed.js";
import { deriveSlug } from "../lib/vault/slug.js";
import { VaultFrontmatterSchema } from "../lib/vault/schema.js";

// ── Types ─────────────────────────────────────────────────────────────────────

type FileStatus = "public" | "private" | "error";

interface FileResult {
  path: string;
  status: FileStatus;
  reason?: string;
}

interface LintError {
  path: string;
  kind: "duplicate-slug" | "schema" | "yaml";
  message: string;
}

interface LintSummary {
  walked: number;
  public: number;
  private: number;
  errors: number;
}

interface LintOutput {
  summary: LintSummary;
  files: FileResult[];
  errors: LintError[];
}

// ── YAML frontmatter parser ───────────────────────────────────────────────────

interface ParseResult {
  frontmatter: unknown;
  parseError: string | null;
}

/**
 * Parses YAML frontmatter from a markdown file's raw content.
 * Returns the parsed data object, or null + an error message on failure.
 *
 * Frontmatter must be fenced by `---` lines at the top of the file.
 * Files without a frontmatter block return an empty object (not an error —
 * the schema validator will mark them private via fail-closed defaults).
 */
function parseFrontmatter(content: string): ParseResult {
  const firstLine = content.startsWith("---");
  if (!firstLine) {
    return { frontmatter: {}, parseError: null };
  }

  // Find the closing ---
  const rest = content.slice(3);
  const closeIdx = rest.search(/\n---(\n|$)/);
  if (closeIdx === -1) {
    return { frontmatter: {}, parseError: null };
  }

  const yamlBlock = rest.slice(0, closeIdx);

  try {
    const parsed = yamlLoad(yamlBlock);
    return { frontmatter: parsed ?? {}, parseError: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { frontmatter: null, parseError: message };
  }
}

// ── Vault walker ──────────────────────────────────────────────────────────────

/**
 * Recursively walks a directory and returns all .md file absolute paths.
 * Skips hidden directories (names starting with `.`) like .obsidian, .trash.
 */
function walkVault(dir: string): string[] {
  const results: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir, { encoding: "utf-8" });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.startsWith(".")) continue; // skip hidden (obsidian, trash, git)

    const fullPath = join(dir, entry);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      results.push(...walkVault(fullPath));
    } else if (entry.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

// ── Core lint logic ───────────────────────────────────────────────────────────

/**
 * Lints a single .md file. Returns a FileResult and any errors found.
 * Does NOT throw — all errors are captured and returned.
 */
function lintFile(
  filePath: string,
  vaultRoot: string,
): { result: FileResult; errors: LintError[] } {
  const relPath = relative(vaultRoot, filePath);
  const errors: LintError[] = [];

  // Read file
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      result: { path: relPath, status: "error", reason: `read error: ${message}` },
      errors: [{ path: relPath, kind: "yaml", message: `read error: ${message}` }],
    };
  }

  // Parse frontmatter
  const { frontmatter, parseError } = parseFrontmatter(content);
  if (parseError !== null) {
    return {
      result: {
        path: relPath,
        status: "error",
        reason: `yaml parse error: ${parseError}`,
      },
      errors: [
        {
          path: relPath,
          kind: "yaml",
          message: `YAML parse error: ${parseError}`,
        },
      ],
    };
  }

  // Resolve visibility (fail-closed)
  const visibility = resolveVisibility(frontmatter);

  if (visibility === "private") {
    // Determine why — attempt schema parse to surface the reason
    const schemaResult = VaultFrontmatterSchema.safeParse(frontmatter);
    let reason = "visibility not public";

    if (schemaResult.success) {
      // Schema passed but visibility is not 'public'
      const fm = frontmatter as Record<string, unknown>;
      if (fm["visibility"] === undefined) {
        reason = "no visibility field (defaults to private)";
      } else {
        reason = `visibility: ${String(fm["visibility"])} (not public)`;
      }
    } else {
      // Schema failed — report the first issue
      const issues = schemaResult.error.issues;
      if (issues.length > 0) {
        const issue = issues[0];
        reason = `schema error: ${issue.path.join(".") || "root"}: ${issue.message}`;
      }
    }

    return { result: { path: relPath, status: "private", reason }, errors };
  }

  // Public — run full schema validation and report schema errors
  const schemaResult = VaultFrontmatterSchema.safeParse(frontmatter);
  if (!schemaResult.success) {
    // This shouldn't happen if resolveVisibility passed, but defend anyway
    const issues = schemaResult.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    errors.push({
      path: relPath,
      kind: "schema",
      message: `schema validation failed: ${issues}`,
    });
    return {
      result: {
        path: relPath,
        status: "error",
        reason: `schema error: ${issues}`,
      },
      errors,
    };
  }

  return { result: { path: relPath, status: "public" }, errors };
}

/**
 * Runs the full lint pass over a vault directory.
 * Returns structured results including per-file status and all errors.
 */
function lintVault(vaultPath: string): LintOutput {
  const mdFiles = walkVault(vaultPath);
  const fileResults: FileResult[] = [];
  const allErrors: LintError[] = [];

  // Per-file slug map for duplicate detection (slug → relPath)
  const slugMap = new Map<string, string>();

  for (const filePath of mdFiles) {
    const relPath = relative(vaultPath, filePath);
    const { result, errors } = lintFile(filePath, vaultPath);
    fileResults.push(result);
    allErrors.push(...errors);

    // Slug uniqueness check — run for all files (not just public)
    // so authors catch collisions before publishing
    if (result.status !== "error") {
      let frontmatterSlug: string | undefined;
      try {
        const content = readFileSync(filePath, "utf-8");
        const { frontmatter } = parseFrontmatter(content);
        if (
          frontmatter !== null &&
          typeof frontmatter === "object" &&
          !Array.isArray(frontmatter)
        ) {
          const fm = frontmatter as Record<string, unknown>;
          if (typeof fm["slug"] === "string") {
            frontmatterSlug = fm["slug"];
          }
        }
      } catch {
        // already handled by lintFile
      }

      const slug = deriveSlug(basename(filePath), frontmatterSlug);
      const existing = slugMap.get(slug);
      if (existing !== undefined) {
        const dupError: LintError = {
          path: relPath,
          kind: "duplicate-slug",
          message: `duplicate slug "${slug}" — also used by ${existing}`,
        };
        allErrors.push(dupError);

        // Also flag the first file with the dup error if not already
        const firstDupError: LintError = {
          path: existing,
          kind: "duplicate-slug",
          message: `duplicate slug "${slug}" — also used by ${relPath}`,
        };
        allErrors.push(firstDupError);

        // Mark the current file as error
        const idx = fileResults.findIndex((r) => r.path === relPath);
        if (idx !== -1) {
          fileResults[idx] = {
            path: relPath,
            status: "error",
            reason: dupError.message,
          };
        }
      } else {
        slugMap.set(slug, relPath);
      }
    }
  }

  const summary: LintSummary = {
    walked: fileResults.length,
    public: fileResults.filter((r) => r.status === "public").length,
    private: fileResults.filter((r) => r.status === "private").length,
    errors: allErrors.length,
  };

  return { summary, files: fileResults, errors: allErrors };
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────

/**
 * Parses CLI args. Returns { vaultPath, report, json }.
 * Exits with usage message on bad args.
 */
function parseArgs(argv: string[]): {
  vaultPath: string;
  report: boolean;
  json: boolean;
} {
  const args = argv.slice(2); // drop node + script path
  let report = false;
  let json = false;
  const positional: string[] = [];

  for (const arg of args) {
    if (arg === "--report") {
      report = true;
    } else if (arg === "--json") {
      json = true;
    } else if (arg.startsWith("-")) {
      process.stderr.write(`Unknown flag: ${arg}\n`);
      process.stderr.write(
        "Usage: vault-lint [--report] [--json] <vault-path>\n",
      );
      process.exit(1);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) {
    process.stderr.write("Usage: vault-lint [--report] [--json] <vault-path>\n");
    process.exit(1);
  }

  return { vaultPath: positional[0], report, json };
}

/**
 * Main CLI entrypoint. Pure function over process.argv / process.exit.
 * Exported so tests can call it with synthetic argv and capture exit code.
 */
export function main(argv: string[]): number {
  const { vaultPath, report, json } = parseArgs(argv);

  const output = lintVault(vaultPath);
  const { summary, files, errors } = output;

  if (json) {
    // Machine-readable: emit JSON to stdout, nothing to stderr
    process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    return errors.length > 0 ? 1 : 0;
  }

  // Human-readable output to stderr

  if (report) {
    // --report: list every file with status and reason
    process.stderr.write(
      `vault-lint report — walked ${summary.walked} files\n`,
    );
    process.stderr.write(
      `  public: ${summary.public}  private: ${summary.private}  errors: ${summary.errors}\n\n`,
    );

    for (const file of files) {
      const tag = file.status === "public" ? "[public] " : file.status === "private" ? "[private]" : "[error]  ";
      const reason = file.reason !== undefined ? `  — ${file.reason}` : "";
      process.stderr.write(`  ${tag}  ${file.path}${reason}\n`);
    }

    if (errors.length > 0) {
      process.stderr.write("\nErrors:\n");
      for (const err of errors) {
        process.stderr.write(`  [${err.kind}] ${err.path}: ${err.message}\n`);
      }
    }
  } else {
    // Default: only emit errors
    if (errors.length > 0) {
      for (const err of errors) {
        process.stderr.write(`[${err.kind}] ${err.path}: ${err.message}\n`);
      }
    }
  }

  const ok = errors.length === 0;
  if (!report && !json && ok) {
    process.stderr.write(
      `vault-lint: ${summary.walked} files walked, ${summary.public} public, ${summary.private} private — OK\n`,
    );
  }

  return ok ? 0 : 1;
}

// Run when invoked directly (not imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv));
}
