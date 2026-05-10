// @vitest-environment node
/**
 * test/leak.test.ts — Leak test CI gate.
 *
 * Implements the "Leak test specification" from the design doc (+ P26
 * HTTP-level gate). This is the load-bearing privacy guarantee.
 *
 * Structure:
 *   Phase 0 — build the site against __fixtures__/vault/
 *   Phase 1 — collect private strings, scan build artifacts
 *   Phase 2 — HTTP-level checks against `next start`
 *
 * The test FAILS if:
 *   - Any private string appears in any build artifact
 *   - Any public note's wikilink target resolves to a private slug
 *   - The canary sentinel was never checked (positive-control assertion)
 *   - Any HTTP response body contains private content
 *
 * @see design doc: "Leak test specification" + P26
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import {
  readFile,
  readdir,
  stat,
  access,
  constants as fsConstants,
} from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { resolveVisibility } from "../lib/vault/fail-closed";
import { walkVault } from "../lib/vault/walk";

// ── Constants ──────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(".");
const FIXTURE_VAULT = path.resolve("__fixtures__/vault");

/**
 * The unique sentinel string from __fixtures__/vault/leak-canary.md.
 * This is the positive-control canary. It MUST appear in the collected
 * private-string set; if it doesn't, the test pipeline is broken.
 */
const CANARY_SENTINEL = "PRIVATE_LEAK_CANARY_dx7q9z";

// ── Build (Phase 0) ────────────────────────────────────────────────────────────

/**
 * Build ID is extracted from the .next/ directory after `next build`.
 * Used to construct /_next/data/{buildId}/ URLs for HTTP checks.
 */
let buildId = "unknown";

/**
 * Slugs extracted from the fixture vault after build, split by visibility.
 */
const publicSlugs: string[] = [];
const privateSlugs: string[] = [];

/**
 * Tracks whether the canary sentinel was actually checked in Phase 1.
 * The positive-control assertion at the end requires this to be true.
 */
let canarySentinelWasChecked = false;

// ── Build setup ────────────────────────────────────────────────────────────────

beforeAll(
  async () => {
    // Run next build against the fixture vault.
    // This is the same build that ships to Vercel, so artifact leaks here
    // will be caught before deploy.
    execSync("npm run build", {
      env: {
        ...process.env,
        VAULT_PATH: FIXTURE_VAULT,
        VAULT_SOURCE: "local",
        NODE_ENV: "production",
      },
      cwd: REPO_ROOT,
      stdio: "pipe",
    });

    // Extract the build ID from .next/BUILD_ID
    try {
      const buildIdFile = path.join(REPO_ROOT, ".next", "BUILD_ID");
      buildId = (await readFile(buildIdFile, "utf8")).trim();
    } catch {
      buildId = "unknown";
    }

    // Collect public and private slugs from the fixture vault
    const vaultFiles = await walkVault(FIXTURE_VAULT);
    for (const relPath of vaultFiles) {
      const absPath = path.join(FIXTURE_VAULT, relPath);
      let rawFrontmatter: unknown;
      try {
        const content = await readFile(absPath, "utf8");
        const parsed = matter(content);
        rawFrontmatter = parsed.data;
      } catch {
        rawFrontmatter = null;
      }
      const visibility = resolveVisibility(rawFrontmatter);
      const slug = path
        .basename(relPath, ".md")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (visibility === "public") {
        publicSlugs.push(slug);
      } else {
        privateSlugs.push(slug);
      }
    }
  },
  // 120s timeout for next build
  120_000,
);

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Collects all strings that must NOT appear in public build artifacts.
 * Covers: titles, summaries, slugs, file paths, headings, long body strings,
 * bold text, and lines with 3+ capitalized words.
 */
async function collectPrivateStrings(): Promise<string[]> {
  const strings: string[] = [];
  const vaultFiles = await walkVault(FIXTURE_VAULT);

  for (const relPath of vaultFiles) {
    const absPath = path.join(FIXTURE_VAULT, relPath);
    let rawFrontmatter: unknown;
    let bodyMarkdown = "";

    try {
      const content = await readFile(absPath, "utf8");
      const parsed = matter(content);
      rawFrontmatter = parsed.data;
      bodyMarkdown = parsed.content;
    } catch {
      rawFrontmatter = null;
    }

    const visibility = resolveVisibility(rawFrontmatter);
    if (visibility !== "private") continue;

    const fm = rawFrontmatter as Record<string, unknown>;

    // Title
    if (typeof fm["title"] === "string" && fm["title"].length > 0) {
      strings.push(fm["title"]);
    }

    // Summary (if set)
    if (typeof fm["summary"] === "string" && fm["summary"].length > 0) {
      strings.push(fm["summary"]);
    }

    // Slug (derived from filename)
    const slug = path
      .basename(relPath, ".md")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (slug.length > 0) {
      strings.push(slug);
    }

    // File path (relative)
    strings.push(relPath);

    // Body strings (from body markdown)
    if (bodyMarkdown) {
      const lines = bodyMarkdown.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Markdown headings (any level, any length)
        if (/^#{1,6} /.test(trimmed)) {
          const headingText = trimmed.replace(/^#{1,6} /, "").trim();
          if (headingText.length > 0) {
            strings.push(headingText);
          }
          continue;
        }

        // Bold text: **text**
        const boldMatches = trimmed.matchAll(/\*\*([^*]+)\*\*/g);
        for (const m of boldMatches) {
          if (m[1] && m[1].trim().length > 0) {
            strings.push(m[1].trim());
          }
        }

        // Lines with 3+ consecutive capitalized words (e.g. proper nouns, sentinels)
        const capitalizedWordGroups = trimmed.match(
          /(?:[A-Z][a-zA-Z0-9_]*\s+){2,}[A-Z][a-zA-Z0-9_]*/g,
        );
        if (capitalizedWordGroups) {
          for (const group of capitalizedWordGroups) {
            const g = group.trim();
            if (g.length > 0) strings.push(g);
          }
        }

        // Contiguous strings >= 15 chars (whole line if long enough, or substrings)
        // We collect the full trimmed line if it's >= 15 chars
        if (trimmed.length >= 15) {
          strings.push(trimmed);
        }
      }
    }
  }

  // Track canary coverage
  if (strings.some((s) => s.includes(CANARY_SENTINEL))) {
    canarySentinelWasChecked = true;
  }

  return strings;
}

/**
 * Recursively collects all file paths under a directory matching the given
 * extension list. Returns absolute paths.
 */
async function collectArtifactFiles(
  dir: string,
  extensions: string[],
): Promise<string[]> {
  const results: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    // Directory doesn't exist (e.g. .next/standalone when not used)
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await collectArtifactFiles(fullPath, extensions);
      results.push(...sub);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.length === 0 || extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

/**
 * Collects all build artifact files to scan per the spec.
 */
async function collectArtifactPaths(): Promise<string[]> {
  const nextDir = path.join(REPO_ROOT, ".next");
  const outDir = path.join(REPO_ROOT, "out");
  const vercelDir = path.join(REPO_ROOT, ".vercel", "output");
  const publicDir = path.join(REPO_ROOT, "public");

  const globs = [
    // .next/server/**/*.{html,js,jsx,json,txt}
    {
      dir: path.join(nextDir, "server"),
      exts: [".html", ".js", ".jsx", ".json", ".txt"],
    },
    // .next/static/**/*.{js,map}
    {
      dir: path.join(nextDir, "static"),
      exts: [".js", ".map"],
    },
    // .next/standalone/** (all files)
    { dir: path.join(nextDir, "standalone"), exts: [] },
    // .next/cache/fetch-cache/**
    { dir: path.join(nextDir, "cache", "fetch-cache"), exts: [] },
    // .next/cache/images/**
    { dir: path.join(nextDir, "cache", "images"), exts: [] },
    // out/** (static export)
    { dir: outDir, exts: [] },
    // .vercel/output/**
    { dir: vercelDir, exts: [] },
  ];

  // Specific single files
  const singleFiles = [
    path.join(nextDir, "server", "pages-manifest.json"),
    path.join(nextDir, "server", "_buildManifest.js"),
    path.join(nextDir, "server", "_ssgManifest.js"),
    path.join(nextDir, "trace"),
  ];

  const allFiles: string[] = [];

  for (const { dir, exts } of globs) {
    const files = await collectArtifactFiles(dir, exts);
    allFiles.push(...files);
  }

  // Add single files that exist
  for (const file of singleFiles) {
    try {
      await access(file, fsConstants.F_OK);
      allFiles.push(file);
    } catch {
      // File doesn't exist — skip
    }
  }

  // public/** excluding pre-existing portfolio assets
  // We scan public/ but exclude public/img/ and public/og-images/
  try {
    const publicEntries = await readdir(publicDir, { withFileTypes: true });
    for (const entry of publicEntries) {
      // Skip pre-existing portfolio asset directories
      if (
        entry.isDirectory() &&
        (entry.name === "img" || entry.name === "og-images")
      ) {
        continue;
      }
      const fullPath = path.join(publicDir, entry.name);
      if (entry.isDirectory()) {
        const sub = await collectArtifactFiles(fullPath, []);
        allFiles.push(...sub);
      } else if (entry.isFile()) {
        allFiles.push(fullPath);
      }
    }
  } catch {
    // public/ doesn't exist
  }

  // Deduplicate
  return [...new Set(allFiles)];
}

/**
 * Searches a single file for any of the given strings.
 * Returns the first match found, or null if none.
 */
async function scanFileForStrings(
  filePath: string,
  strings: string[],
): Promise<{ string: string; file: string } | null> {
  let content: string;
  try {
    // Only scan text files
    const s = await stat(filePath);
    // Skip files > 50MB (shouldn't happen in practice)
    if (s.size > 50 * 1024 * 1024) return null;
    content = await readFile(filePath, "utf8");
  } catch {
    // Binary or unreadable — skip
    return null;
  }

  for (const str of strings) {
    if (str.length < 4) continue; // Too short — too many false positives
    if (content.includes(str)) {
      return { string: str, file: filePath };
    }
  }
  return null;
}

/**
 * Parses [[wikilink]] targets from markdown body text.
 * Returns base note names (before #heading, ^block-id, |alias).
 * Does NOT parse embeds (![[...]]).
 */
function parseWikilinkTargets(markdown: string): string[] {
  const targets: string[] = [];
  // Match [[target]] or [[target|alias]] or [[target#heading]] etc.
  // But NOT ![[...]] (embeds)
  const re = /(?<!!)\[\[([^#\]^|]+)(?:[#^][^\]|]*)?(?:\|[^\]]*)?\]\]/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const target = m[1].trim();
    if (target) {
      // Normalize to slug form (same logic as the vault adapter)
      const slug = target
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      targets.push(slug);
    }
  }
  return targets;
}

// ── Phase 1: Build artifact scan ───────────────────────────────────────────────

describe("Phase 1 — Build artifact scan", () => {
  it(
    "positive control: canary sentinel is in the private-strings collection",
    async () => {
      const strings = await collectPrivateStrings();
      const hasCanary = strings.some((s) => s.includes(CANARY_SENTINEL));
      if (!hasCanary) {
        throw new Error(
          `LEAK TEST INFRASTRUCTURE BROKEN: The canary sentinel "${CANARY_SENTINEL}" ` +
            `was NOT found in the collected private-string set. ` +
            `This means the scanner is not checking __fixtures__/vault/leak-canary.md. ` +
            `Failing loudly — do not treat a false-green as safe.`,
        );
      }
      expect(hasCanary).toBe(true);
    },
    30_000,
  );

  it(
    "no private fixture content appears in build artifacts",
    async () => {
      const privateStrings = await collectPrivateStrings();
      const artifactFiles = await collectArtifactPaths();

      // Build must have produced some artifacts
      expect(artifactFiles.length).toBeGreaterThan(0);

      const leaks: Array<{ string: string; file: string }> = [];

      for (const file of artifactFiles) {
        const match = await scanFileForStrings(file, privateStrings);
        if (match) {
          // Relativize the path for readability
          const rel = path.relative(REPO_ROOT, match.file);
          leaks.push({ string: match.string, file: rel });
        }
      }

      if (leaks.length > 0) {
        const report = leaks
          .map((l) => `  - "${l.string}" found in: ${l.file}`)
          .join("\n");
        throw new Error(
          `PRIVACY LEAK DETECTED: ${leaks.length} private string(s) found in build artifacts:\n${report}`,
        );
      }

      expect(leaks).toHaveLength(0);
    },
    120_000,
  );

  it(
    "wikilink targets in public notes do not resolve to private slugs",
    async () => {
      const vaultFiles = await walkVault(FIXTURE_VAULT);

      const wikilinkLeaks: Array<{
        source: string;
        target: string;
        privateSlug: string;
      }> = [];

      for (const relPath of vaultFiles) {
        const absPath = path.join(FIXTURE_VAULT, relPath);
        let rawFrontmatter: unknown;
        let bodyMarkdown = "";

        try {
          const content = await readFile(absPath, "utf8");
          const parsed = matter(content);
          rawFrontmatter = parsed.data;
          bodyMarkdown = parsed.content;
        } catch {
          rawFrontmatter = null;
        }

        const visibility = resolveVisibility(rawFrontmatter);
        if (visibility !== "public") continue;

        // Parse wikilink targets from the public note's body
        const targets = parseWikilinkTargets(bodyMarkdown);

        for (const target of targets) {
          // Check if this target matches a private note's slug
          if (privateSlugs.includes(target)) {
            wikilinkLeaks.push({
              source: relPath,
              target,
              privateSlug: target,
            });
          }
        }
      }

      if (wikilinkLeaks.length > 0) {
        const report = wikilinkLeaks
          .map(
            (l) =>
              `  - Public note "${l.source}" links to private slug "${l.privateSlug}"`,
          )
          .join("\n");
        throw new Error(
          `WIKILINK PRIVACY LEAK: Public notes reference private slugs:\n${report}`,
        );
      }

      expect(wikilinkLeaks).toHaveLength(0);
    },
    30_000,
  );

  it(
    "positive control: canary was actually evaluated (infrastructure check)",
    () => {
      // This is a post-scan assertion. If Phase 1 ran but canarySentinelWasChecked
      // is still false, the pipeline is broken (canary file wasn't walked).
      if (!canarySentinelWasChecked) {
        throw new Error(
          `LEAK TEST INFRASTRUCTURE BROKEN: The canary sentinel was never evaluated ` +
            `during the artifact scan. This means collectPrivateStrings() did not ` +
            `find leak-canary.md in the fixture vault. ` +
            `Failing loudly — a false-green here would mean the leak test provides ` +
            `no privacy guarantee.`,
        );
      }
      expect(canarySentinelWasChecked).toBe(true);
    },
  );

  // ── Negative tests (false-positive policy) ──────────────────────────────────

  it(
    "false-positive: public note with wikilink to PUBLIC slug passes (no false positive)",
    async () => {
      // note-public-2.md has [[note-public-1|link to first post]]
      // note-public-1 is a public slug → should NOT trigger wikilink leak check
      const notePublic2 = path.join(FIXTURE_VAULT, "note-public-2.md");
      const content = await readFile(notePublic2, "utf8");
      const parsed = matter(content);
      const targets = parseWikilinkTargets(parsed.content);

      // note-public-1 should be in targets
      expect(targets).toContain("note-public-1");

      // note-public-1 must NOT be in privateSlugs
      expect(privateSlugs).not.toContain("note-public-1");
      // Confirm it IS in publicSlugs
      expect(publicSlugs).toContain("note-public-1");
    },
    30_000,
  );

  it(
    "false-positive: common short strings < 15 chars are not collected (policy check)",
    async () => {
      // Short strings like "private" or "note" would create too many false positives.
      // Our policy collects strings >= 15 chars (from body lines) or specific
      // metadata (title, summary, slug) regardless of length.
      // This test verifies that the string "private" alone (3 chars) would not
      // trigger a false match even if it appeared in a public note.
      const strings = await collectPrivateStrings();

      // The word "private" (7 chars) should NOT appear as a standalone collected
      // body string — it's too short (< 15 chars) for body-line collection.
      // (It may appear as part of a longer string, which is fine.)
      const purePrivateShort = strings.filter((s) => s === "private");
      expect(purePrivateShort).toHaveLength(0);
    },
    30_000,
  );
});

// ── Phase 2: HTTP-level checks (P26) ──────────────────────────────────────────

describe("Phase 2 — HTTP-level checks (P26)", () => {
  let serverProcess: ChildProcess | null = null;
  let serverPort: number;
  let serverBaseUrl: string;
  let serverReady = false;

  /**
   * Picks a random port in the 14000-15000 range to avoid collisions.
   */
  function pickPort(): number {
    return 14000 + Math.floor(Math.random() * 1000);
  }

  /**
   * Waits for the server to respond on the given port.
   * Polls with exponential backoff; throws after timeout.
   */
  async function waitForServer(
    port: number,
    timeoutMs: number,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let delay = 200;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`http://localhost:${port}/`, {
          signal: AbortSignal.timeout(1000),
        });
        if (res.status < 500) {
          return; // Server is up
        }
      } catch {
        // Not ready yet
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.5, 2000);
    }
    throw new Error(`Server on port ${port} did not start within ${timeoutMs}ms`);
  }

  beforeAll(
    async () => {
      serverPort = pickPort();
      serverBaseUrl = `http://localhost:${serverPort}`;

      serverProcess = spawn(
        "node_modules/.bin/next",
        ["start", "--port", String(serverPort)],
        {
          env: {
            ...process.env,
            VAULT_PATH: FIXTURE_VAULT,
            VAULT_SOURCE: "local",
            NODE_ENV: "production",
          },
          cwd: REPO_ROOT,
          stdio: "pipe",
        },
      );

      // Do not leave orphaned processes on unexpected exit
      serverProcess.on("error", () => {});

      try {
        await waitForServer(serverPort, 30_000);
        serverReady = true;
      } catch (err) {
        // Server failed to start — record but don't throw here;
        // individual tests will fail when they try to fetch
        console.error("[leak test] Server failed to start:", err);
      }
    },
    35_000,
  );

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
      serverProcess = null;
    }
  });

  /**
   * Fetches a URL and returns { status, body }.
   * Never throws — returns { status: 0, body: '' } on connection error.
   */
  async function safeFetch(
    url: string,
  ): Promise<{ status: number; body: string }> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      const body = await res.text();
      return { status: res.status, body };
    } catch {
      return { status: 0, body: "" };
    }
  }

  /**
   * Asserts that a response body does not contain the canary or any private title.
   */
  async function assertNoPrivateContent(
    body: string,
    url: string,
  ): Promise<void> {
    const leaks: string[] = [];
    const privateStrings = await collectPrivateStrings();

    // Check canary specifically (it's the clearest signal)
    if (body.includes(CANARY_SENTINEL)) {
      leaks.push(`canary sentinel "${CANARY_SENTINEL}"`);
    }

    // Check all collected private strings >= 15 chars (to avoid false positives on short strings)
    for (const str of privateStrings) {
      if (str.length >= 15 && body.includes(str)) {
        leaks.push(`"${str}"`);
      }
    }

    if (leaks.length > 0) {
      throw new Error(
        `HTTP PRIVACY LEAK at ${url}: Found private content: ${leaks.join(", ")}`,
      );
    }
  }

  it(
    "server starts successfully",
    () => {
      expect(serverReady).toBe(true);
    },
    5_000,
  );

  it(
    "/sitemap.xml does not contain private content (if present)",
    async () => {
      if (!serverReady) return;
      const { status, body } = await safeFetch(`${serverBaseUrl}/sitemap.xml`);
      // 404 is acceptable (not implemented); anything else should be clean
      if (status !== 404 && status !== 0) {
        await assertNoPrivateContent(body, "/sitemap.xml");
      }
    },
    15_000,
  );

  it(
    "/robots.txt does not contain private content",
    async () => {
      if (!serverReady) return;
      const { status, body } = await safeFetch(`${serverBaseUrl}/robots.txt`);
      if (status !== 404 && status !== 0) {
        await assertNoPrivateContent(body, "/robots.txt");
      }
    },
    15_000,
  );

  it(
    "/feed.xml does not contain private content (if present)",
    async () => {
      if (!serverReady) return;
      const { status, body } = await safeFetch(`${serverBaseUrl}/feed.xml`);
      if (status !== 404 && status !== 0) {
        await assertNoPrivateContent(body, "/feed.xml");
      }
    },
    15_000,
  );

  it(
    "/search.json does not contain private content (if present)",
    async () => {
      if (!serverReady) return;
      const { status, body } = await safeFetch(`${serverBaseUrl}/search.json`);
      if (status !== 404 && status !== 0) {
        await assertNoPrivateContent(body, "/search.json");
      }
    },
    15_000,
  );

  it(
    "/_next/data/{buildId}/writing.json does not contain private content",
    async () => {
      if (!serverReady) return;
      const url = `${serverBaseUrl}/_next/data/${buildId}/writing.json`;
      const { status, body } = await safeFetch(url);
      if (status !== 404 && status !== 0) {
        await assertNoPrivateContent(body, url);
      }
    },
    15_000,
  );

  it(
    "/_next/data/{buildId}/writing/{publicSlug}.json does not contain private content",
    async () => {
      if (!serverReady) return;
      for (const slug of publicSlugs) {
        const url = `${serverBaseUrl}/_next/data/${buildId}/writing/${slug}.json`;
        const { status, body } = await safeFetch(url);
        if (status !== 404 && status !== 0) {
          await assertNoPrivateContent(body, url);
        }
      }
    },
    30_000,
  );

  it(
    "/_next/data/{buildId}/writing/{privateSlug}.json returns 404 (no private route rendered)",
    async () => {
      if (!serverReady) return;
      for (const slug of privateSlugs) {
        const url = `${serverBaseUrl}/_next/data/${buildId}/writing/${slug}.json`;
        const { status, body } = await safeFetch(url);
        // Private slugs must not be served — they should 404
        if (status !== 0) {
          expect(status, `Private slug "${slug}" should 404 at ${url}`).toBe(
            404,
          );
          // Also assert the body doesn't contain private content regardless
          await assertNoPrivateContent(body, url);
        }
      }
    },
    30_000,
  );
});
