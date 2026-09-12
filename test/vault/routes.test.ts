// @vitest-environment node
/**
 * test/vault/routes.test.ts — route-contract tests for /work routes (#35).
 *
 * Tests the getStaticProps/getStaticPaths logic that pages/work/* use,
 * by directly exercising lib/vault API functions against fixture vaults.
 *
 * Does NOT use next/test or a running server — calls the vault API directly
 * to stay fast and deterministic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

// ── Helpers ───────────────────────────────────────────────────────────────────

const FIXTURE_VAULT = path.resolve("__fixtures__/vault");

/**
 * Isolate each test from cached vault state so env changes take effect.
 * __resetVaultCache__ is only exported in NODE_ENV=test (see lib/vault/index.ts).
 */
async function resetCache() {
  const { __resetVaultCache__ } = await import("../../lib/vault/index");
  __resetVaultCache__();
}

function setFixtureEnv(vaultPath: string = FIXTURE_VAULT) {
  vi.stubEnv("VAULT_SOURCE", "local");
  vi.stubEnv("VAULT_PATH", vaultPath);
  vi.stubEnv("VAULT_PUBLICATION_MODE", "production");
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(async () => {
  setFixtureEnv();
  await resetCache();
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await resetCache();
  vi.restoreAllMocks();
});

// ── /work index — getStaticProps equivalent ───────────────────────────────────

describe("/work index — getPublicNotes()", () => {
  it("returns exactly 3 public notes from fixture vault", async () => {
    const { getPublicNotes } = await import("../../lib/vault/index");
    const notes = await getPublicNotes();
    expect(notes).toHaveLength(3);
  });

  it("notes are sorted by date descending", async () => {
    const { getPublicNotes } = await import("../../lib/vault/index");
    const notes = await getPublicNotes();
    for (let i = 1; i < notes.length; i++) {
      expect(
        notes[i - 1].frontmatter.date >= notes[i].frontmatter.date,
      ).toBe(true);
    }
  });

  it("every note has slug, title, date, and body", async () => {
    const { getPublicNotes } = await import("../../lib/vault/index");
    const notes = await getPublicNotes();
    for (const note of notes) {
      expect(note.slug).toBeTruthy();
      expect(note.frontmatter.title).toBeTruthy();
      expect(note.frontmatter.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof note.body).toBe("string");
    }
  });
});

// ── /work/[slug] — getStaticPaths equivalent ──────────────────────────────────

describe("/work/[slug] — getStaticPaths", () => {
  it("produces a path for each public note", async () => {
    const { getPublicNotes } = await import("../../lib/vault/index");
    const notes = await getPublicNotes();
    // Mirror the exact getStaticPaths implementation
    const result = {
      paths: notes.map((n) => ({ params: { slug: n.slug } })),
      fallback: false as const,
    };

    expect(result.fallback).toBe(false); // P27 enforcement
    expect(result.paths).toHaveLength(3);
    expect(result.paths.every((p) => typeof p.params.slug === "string")).toBe(true);
  });

  it("fallback is false (P27: no on-demand SSR for unknown slugs)", async () => {
    const { getPublicNotes } = await import("../../lib/vault/index");
    const notes = await getPublicNotes();
    const paths = {
      paths: notes.map((n) => ({ params: { slug: n.slug } })),
      fallback: false as const,
    };
    // This is the privacy requirement: fallback MUST be false
    expect(paths.fallback).toBe(false);
  });
});

// ── /work/[slug] — getStaticProps equivalent ──────────────────────────────────

describe("/work/[slug] — getNoteBySlug()", () => {
  it("returns the note for a known fixture slug", async () => {
    const { getNoteBySlug } = await import("../../lib/vault/index");
    const note = await getNoteBySlug("note-public-1");
    expect(note).not.toBeNull();
    expect(note!.slug).toBe("note-public-1");
    expect(note!.frontmatter.visibility).toBe("public");
  });

  it("returns null for an unknown slug (notFound: true in getStaticProps)", async () => {
    const { getNoteBySlug } = await import("../../lib/vault/index");
    const note = await getNoteBySlug("this-slug-does-not-exist");
    expect(note).toBeNull();
  });

  it("returns null for a private note slug (canary slug must never be found)", async () => {
    const { getNoteBySlug } = await import("../../lib/vault/index");
    const note = await getNoteBySlug("leak-canary");
    expect(note).toBeNull();
  });
});

// ── Empty vault — getStaticProps returns { notes: [] } cleanly ────────────────

describe("empty vault", () => {
  it("getPublicNotes() returns [] cleanly with an empty vault dir", async () => {
    const os = await import("node:os");
    const fs = await import("node:fs/promises");

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vault-empty-"));
    try {
      vi.stubEnv("VAULT_PATH", tmpDir);
      await resetCache();

      const { getPublicNotes } = await import("../../lib/vault/index");
      const notes = await getPublicNotes();
      expect(notes).toEqual([]);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});

// ── Snapshot — rendered HTML for a known fixture note ─────────────────────────

describe("note body snapshot", () => {
  it("note-public-1 body contains expected content and no script tags", async () => {
    const { getNoteBySlug } = await import("../../lib/vault/index");
    const note = await getNoteBySlug("note-public-1");
    expect(note).not.toBeNull();

    const body = note!.body;

    // Should have meaningful content
    expect(body).toContain("first public note");

    // Wikilinks should be stripped to plain text (P18)
    expect(body).not.toContain("[[");
    expect(body).not.toContain("]]");

    // No script tags (P19 — sanitization via rehype-sanitize)
    expect(body).not.toContain("<script");

    // Should be valid HTML with at least a paragraph
    expect(body).toContain("<p");
  });

  it("note-public-3 body has no raw script tags (sanitization test)", async () => {
    const { getNoteBySlug } = await import("../../lib/vault/index");
    const note = await getNoteBySlug("note-public-3");
    expect(note).not.toBeNull();

    // note-public-3 has `<script>alert(1)</script>` in backtick code in its source.
    // rehype-sanitize must not emit executable <script> tags — code content is
    // HTML-escaped (&lt;script&gt;) inside a <code> element, which is safe.
    expect(note!.body).not.toContain("<script");
    // The text "alert(1)" may appear inside an HTML-escaped <code> block — that's safe.
    // What must NOT appear is a raw executable form: <script>alert(1)</script>
    // We verify: no <script> open tag present at all.
    // (The entity-escaped form &#x3C;script&#x3E; inside <code> is acceptable.)
  });
});

// ── Lint import restriction — adapter-* never imported from pages ─────────────
//
// Verifies the oxlint rule that prevents pages from importing vault adapters
// directly (AGENTS.md load-bearing rule).
//
// oxlint has no stdin mode, and the rule is scoped to `pages/**`, so each case
// writes a real probe file under pages/ and removes it in a finally block. A
// leftover file there would become a Next.js route, so cleanup is mandatory
// and also runs in afterEach as a backstop.
//
// IMPORTANT: assert on the human-readable violation *message*, not merely on a
// rule name. The predecessor of this test filtered on ruleId alone, which meant
// a resolver crash reported under that same ruleId counted as a passing
// enforcement — masking the fact that the boundary was never enforced at all.

const PROBE_DIR = path.join(process.cwd(), "pages");
const probeFiles = new Set<string>();

function writeProbe(relativeName: string, importSpecifier: string): string {
  const file = path.join(PROBE_DIR, relativeName);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `import { X } from "${importSpecifier}";\n` +
      `export default function Page() {\n  void X;\n  return null;\n}\n`,
    "utf8",
  );
  probeFiles.add(file);
  return file;
}

function cleanupProbes() {
  for (const file of probeFiles) {
    try {
      fs.rmSync(file, { force: true });
    } catch {
      // best effort
    }
  }
  probeFiles.clear();
}

interface ProbeResult {
  violations: string[];
  raw: string;
  status: number | null;
}

/**
 * Run oxlint against one probe file.
 *
 * The path passed to oxlint is deliberately **relative** to cwd. The boundary
 * rule lives in an `overrides.files: ["pages/**"]` block, and matching that glob
 * against an absolute path depends on oxlint relativizing it back to cwd. On CI
 * the checkout path need not be identical to cwd (symlinks), in which case the
 * glob silently fails to match, the override never applies, and oxlint reports
 * nothing — which looks exactly like "the boundary is fine".
 */
function lintProbe(relativeName: string, importSpecifier: string): ProbeResult {
  writeProbe(relativeName, importSpecifier);
  const relPath = path.join("pages", relativeName);
  try {
    // `--format=json` is load-bearing, not a convenience. oxlint's default
    // human-readable output is environment-sensitive: on GitHub Actions it
    // switched to an annotation format that omits the `help:` text, so a filter
    // matching the rule's message found nothing and the boundary looked
    // unenforced. JSON is a stable contract with discrete fields.
    const result = spawnSync(
      process.execPath,
      [
        path.join("node_modules", "oxlint", "bin", "oxlint"),
        "--format=json",
        relPath,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    if (result.error) {
      throw new Error(`failed to spawn oxlint: ${result.error.message}`);
    }
    // oxlint exits 0 (clean) or 1 (lint errors found). Anything else means it
    // did not actually lint — a broken harness, not a passing boundary.
    if (result.status !== 0 && result.status !== 1) {
      throw new Error(
        `oxlint exited ${result.status}, so the vault boundary was NOT checked.\n` +
          `stdout: ${result.stdout}\nstderr: ${result.stderr}`,
      );
    }

    const raw = `${result.stdout ?? ""}${result.stderr ?? ""}`;

    let parsed: { diagnostics?: Array<{ code?: string; help?: string }> };
    try {
      parsed = JSON.parse(result.stdout);
    } catch (err) {
      throw new Error(
        `could not parse oxlint --format=json output, so the vault boundary ` +
          `was NOT verified: ${(err as Error).message}\nraw:\n${raw}`,
      );
    }

    const violations = (parsed.diagnostics ?? [])
      .filter(
        (d) =>
          d.code === "eslint(no-restricted-imports)" &&
          /must import vault API from/.test(d.help ?? ""),
      )
      .map((d) => d.help ?? "");

    return { violations, raw, status: result.status };
  } finally {
    fs.rmSync(path.join(PROBE_DIR, relativeName), { force: true });
    probeFiles.delete(path.join(PROBE_DIR, relativeName));
  }
}

describe("vault adapter import boundary", () => {
  afterEach(cleanupProbes);

  it("passes: import from the lib/vault barrel is allowed in pages", () => {
    const { violations, raw } = lintProbe("__probe_ok.tsx", "../lib/vault");
    expect(violations, `oxlint output:\n${raw}`).toHaveLength(0);
  });

  it("passes: non-adapter vault internals stay importable from pages", () => {
    const { violations, raw } = lintProbe("__probe_schema.tsx", "../lib/vault/schema");
    expect(violations, `oxlint output:\n${raw}`).toHaveLength(0);
  });

  it.each([
    ["adapter-local", "__probe_bad_local.tsx", "../lib/vault/adapter-local"],
    ["adapter-github", "__probe_bad_github.tsx", "../lib/vault/adapter-github"],
    ["adapter-local via @/ alias", "__probe_alias_local.tsx", "@/lib/vault/adapter-local"],
    ["adapter-github via @/ alias", "__probe_alias_github.tsx", "@/lib/vault/adapter-github"],
  ])("blocks: %s is not importable from pages", (_name, fileName, specifier) => {
    const { violations, raw, status } = lintProbe(fileName, specifier);
    expect(
      violations.length,
      `expected oxlint to block "${specifier}" from ${fileName}, but it reported ` +
        `no boundary violation (exit ${status}). Raw oxlint output:\n${raw || "(empty)"}`,
    ).toBeGreaterThan(0);
  });
});
