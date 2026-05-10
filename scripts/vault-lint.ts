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

import { readFileSync, readdirSync, lstatSync } from "fs";
import type { Dirent } from "fs";
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
  kind: "duplicate-slug" | "schema" | "yaml" | "io" | "args";
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
    // Opening fence without closing fence = malformed frontmatter (not "no
    // frontmatter"). Treating it as `{}` would silently let bad authoring
    // pass — which conflicts with fail-closed intent. Surface it as a parse
    // error so the lint flags it. (copilot #45)
    return {
      frontmatter: null,
      parseError: "opening `---` without closing `---` fence",
    };
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
 * Recursively walks a directory and returns all `.md` file absolute paths.
 * Excludes hidden directories (`.obsidian`, `.trash`, `.git`, `.github`) plus
 * `node_modules`, `templates` per VAULT.md walk-ignore-list.
 *
 * Uses `withFileTypes` to avoid an extra `lstatSync` per entry (perf).
 * Symlinks are explicitly NOT followed — matches `lib/vault/walk.ts` policy.
 *
 * Returns `{ files, error }`. On readdir failure (missing dir, permissions,
 * not a directory), `error` is set so the caller can fail loudly. (copilot #45)
 */
const IGNORED_DIRS = new Set([
  ".obsidian",
  ".trash",
  ".git",
  ".github",
  "node_modules",
  "templates",
]);

interface WalkResult {
  files: string[];
  error: string | null;
}

function walkVault(dir: string): WalkResult {
  const out: string[] = [];

  function recurse(d: string): string | null {
    // `withFileTypes: true` returns Dirent[] which exposes
    // isDirectory()/isFile()/isSymbolicLink() without an extra lstat per entry.
    let entries: Dirent[];
    try {
      entries = readdirSync(d, { withFileTypes: true }) as Dirent[];
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }

    for (const entry of entries) {
      const name = entry.name;
      if (IGNORED_DIRS.has(name)) continue;
      // Skip every other dotfile / dotdir too (e.g. `.DS_Store`, `.idea/`,
      // user-added hidden caches). Vaults rarely intend to publish dotfiles.
      if (name.startsWith(".")) continue;

      const fullPath = join(d, name);

      // `withFileTypes` returns Dirent; `isSymbolicLink()` is direct, no extra
      // syscall. Skip symlinks regardless of target — matches the
      // `followSymbolicLinks: false` policy in lib/vault/walk.ts. (copilot #45)
      if (entry.isSymbolicLink()) continue;

      if (entry.isDirectory()) {
        const subErr = recurse(fullPath);
        if (subErr !== null) return subErr;
      } else if (entry.isFile() && name.endsWith(".md")) {
        out.push(fullPath);
      }
    }
    return null;
  }

  // Verify the root is actually a directory before recursing. Handles
  // missing dir, file-instead-of-dir, permission denied — all surface as
  // a clear error rather than the silent "0 files walked" we used to
  // return. (copilot #45)
  let rootStat: ReturnType<typeof lstatSync>;
  try {
    rootStat = lstatSync(dir);
  } catch (err) {
    return { files: [], error: err instanceof Error ? err.message : String(err) };
  }
  if (!rootStat.isDirectory()) {
    return { files: [], error: `not a directory: ${dir}` };
  }

  const recurseErr = recurse(dir);
  return { files: out, error: recurseErr };
}

// ── Core lint logic ───────────────────────────────────────────────────────────

/**
 * Lints a single .md file. Returns a FileResult, the parsed frontmatter, and
 * any errors found. Returning the frontmatter avoids a second read+parse pass
 * during slug-uniqueness checks. (gemini + copilot #45)
 *
 * Does NOT throw — all errors are captured and returned.
 */
function lintFile(
  filePath: string,
  vaultRoot: string,
): { result: FileResult; errors: LintError[]; frontmatter: unknown } {
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
      // Use kind: "io" for read failures so downstream automation can
      // distinguish them from actual YAML parse problems. (copilot #45)
      errors: [{ path: relPath, kind: "io", message: `read error: ${message}` }],
      frontmatter: null,
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
      frontmatter: null,
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

    return { result: { path: relPath, status: "private", reason }, errors, frontmatter };
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
      frontmatter,
    };
  }

  return { result: { path: relPath, status: "public" }, errors, frontmatter };
}

/**
 * Runs the full lint pass over a vault directory.
 * Returns structured results including per-file status and all errors.
 */
function lintVault(vaultPath: string): LintOutput {
  const walked = walkVault(vaultPath);
  const fileResults: FileResult[] = [];
  const allErrors: LintError[] = [];

  // Surface walk failure (non-existent / unreadable / not-a-directory) as a
  // first-class error so vault-lint never silently reports OK on bad input.
  // (copilot #45)
  if (walked.error !== null) {
    allErrors.push({
      path: vaultPath,
      kind: "io",
      message: `walk failed: ${walked.error}`,
    });
    return {
      summary: { walked: 0, public: 0, private: 0, errors: 1 },
      files: [],
      errors: allErrors,
    };
  }

  // Per-file slug map: slug → relPath of the FIRST file that claimed it
  const slugMap = new Map<string, string>();

  for (const filePath of walked.files) {
    const relPath = relative(vaultPath, filePath);
    const { result, errors, frontmatter } = lintFile(filePath, vaultPath);
    fileResults.push(result);
    allErrors.push(...errors);

    // Slug uniqueness — run for all files (not just public) so authors catch
    // collisions before publishing. Use the parsed frontmatter from lintFile
    // instead of re-reading the file. (gemini + copilot #45)
    if (result.status !== "error") {
      let frontmatterSlug: string | undefined;
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

      const slug = deriveSlug(basename(filePath), frontmatterSlug);
      const existing = slugMap.get(slug);
      if (existing !== undefined) {
        // Both files collide. Flag both as errors AND update both file
        // statuses so --report and --json output stay consistent. (copilot #45)
        const currentMsg = `duplicate slug "${slug}" — also used by ${existing}`;
        const existingMsg = `duplicate slug "${slug}" — also used by ${relPath}`;

        allErrors.push({ path: relPath, kind: "duplicate-slug", message: currentMsg });
        allErrors.push({ path: existing, kind: "duplicate-slug", message: existingMsg });

        const currentIdx = fileResults.findIndex((r) => r.path === relPath);
        if (currentIdx !== -1) {
          fileResults[currentIdx] = {
            path: relPath,
            status: "error",
            reason: currentMsg,
          };
        }

        const existingIdx = fileResults.findIndex((r) => r.path === existing);
        if (existingIdx !== -1) {
          fileResults[existingIdx] = {
            path: existing,
            status: "error",
            reason: existingMsg,
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

type ParsedArgs =
  | { kind: "ok"; vaultPath: string; report: boolean; json: boolean }
  | { kind: "error"; message: string };

/**
 * Parses CLI args. Returns a tagged result instead of calling process.exit
 * — keeps `main` testable without `process.exit` mocking. (gemini #45)
 */
function parseArgs(argv: string[]): ParsedArgs {
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
      return { kind: "error", message: `Unknown flag: ${arg}` };
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) {
    return {
      kind: "error",
      message: "Usage: vault-lint [--report] [--json] <vault-path>",
    };
  }

  return { kind: "ok", vaultPath: positional[0], report, json };
}

/**
 * Main CLI entrypoint. Pure function over process.argv / process.exit.
 * Exported so tests can call it with synthetic argv and capture exit code.
 */
export function main(argv: string[]): number {
  const parsed = parseArgs(argv);
  if (parsed.kind === "error") {
    process.stderr.write(parsed.message + "\n");
    if (!parsed.message.startsWith("Usage:")) {
      process.stderr.write(
        "Usage: vault-lint [--report] [--json] <vault-path>\n",
      );
    }
    return 1;
  }
  const { vaultPath, report, json } = parsed;

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
