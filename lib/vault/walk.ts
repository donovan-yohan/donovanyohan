/**
 * walk.ts — vault file discovery.
 *
 * Walks the vault root for *.md files using fast-glob, then applies
 * symlink and path-boundary checks (P17).
 *
 * Security properties:
 *   - followSymbolicLinks: false in fast-glob (doesn't follow symlinked dirs)
 *   - lstat each result and reject any symlink entry
 *   - compare each resolved realpath against vault root realpath; reject any
 *     path that escapes the vault root
 *   - never yields .obsidian/, .trash/, .git/, .github/, node_modules/, templates/
 *
 * Per P25: No I/O, no env access at module init. Pure async function.
 */

import fg from "fast-glob";
import { lstat, realpath } from "node:fs/promises";
import path from "node:path";

/** Glob patterns excluded from vault walk (P17). */
const IGNORE_PATTERNS = [
  ".obsidian/**",
  ".trash/**",
  ".git/**",
  ".github/**",
  "node_modules/**",
  "templates/**",
];

/**
 * Walks the vault root directory and returns vault-relative paths for
 * all eligible `.md` files.
 *
 * @param vaultRoot - Absolute path to the vault root directory.
 * @returns Array of vault-relative file paths (e.g. `"notes/hello.md"`).
 */
export async function walkVault(vaultRoot: string): Promise<string[]> {
  // Resolve the vault root realpath once (handles symlinked vault dirs themselves)
  const rootReal = await realpath(vaultRoot);

  // Discover candidates with fast-glob. followSymbolicLinks: false prevents
  // following symlinked directories, but fast-glob may still yield symlinked
  // file entries, so we lstat below as a second layer.
  const raw = await fg("**/*.md", {
    cwd: rootReal,
    followSymbolicLinks: false,
    ignore: IGNORE_PATTERNS,
    dot: true, // needed so .obsidian, .trash etc. are matched by ignore patterns
    onlyFiles: true,
  });

  const accepted: string[] = [];

  for (const rel of raw) {
    const abs = path.join(rootReal, rel);

    // lstat the result — never follow symlinks here
    let stat;
    try {
      stat = await lstat(abs);
    } catch {
      // File disappeared between glob and lstat — skip silently
      continue;
    }

    // Reject symlinks (covers both fast-glob follow=false oversight and
    // any future edge case)
    if (stat.isSymbolicLink()) {
      continue;
    }

    // Resolve the real path to catch any absolute or relative symlink tricks
    let realAbs: string;
    try {
      realAbs = await realpath(abs);
    } catch {
      // realpath fails on broken symlinks — reject
      continue;
    }

    // Boundary check: resolved path must be inside the vault root
    const normalizedRoot = rootReal.endsWith(path.sep)
      ? rootReal
      : rootReal + path.sep;
    if (
      realAbs !== rootReal &&
      !realAbs.startsWith(normalizedRoot)
    ) {
      continue;
    }

    accepted.push(rel);
  }

  return accepted;
}
