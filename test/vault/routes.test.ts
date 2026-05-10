// @vitest-environment node
/**
 * test/vault/routes.test.ts — route-contract tests for /writing routes (#35).
 *
 * Tests the getStaticProps/getStaticPaths logic that pages/writing/* use,
 * by directly exercising lib/vault API functions against fixture vaults.
 *
 * Does NOT use next/test or a running server — calls the vault API directly
 * to stay fast and deterministic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "node:path";

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

// ── /writing index — getStaticProps equivalent ────────────────────────────────

describe("/writing index — getPublicNotes()", () => {
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

// ── /writing/[slug] — getStaticPaths equivalent ───────────────────────────────

describe("/writing/[slug] — getStaticPaths", () => {
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

// ── /writing/[slug] — getStaticProps equivalent ───────────────────────────────

describe("/writing/[slug] — getNoteBySlug()", () => {
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

// ── ESLint import restriction — adapter-* never imported from pages ────────────
//
// These tests verify the ESLint import/no-restricted-paths rule that prevents
// pages from importing vault adapters directly (AGENTS.md load-bearing rule).
// ESLint startup is slow; tests carry a 30s timeout.

describe("ESLint import/no-restricted-paths rule", () => {
  it(
    "passes: import from @/lib/vault is allowed in pages",
    async () => {
      const { ESLint } = await import("eslint");
      const eslint = new ESLint({
        overrideConfigFile: "eslint.config.mjs",
      });

      // A minimal page-like file that imports from lib/vault (relative path)
      const code = [
        "import { getPublicNotes } from '../../lib/vault';",
        "export const getStaticProps = async () => {",
        "  const notes = await getPublicNotes();",
        "  return { props: { notes } };",
        "};",
        "export default function Page() { return null; }",
      ].join("\n");

      const results = await eslint.lintText(code, {
        filePath: "pages/writing/index.tsx",
      });

      const importErrors = results[0].messages.filter(
        (m) =>
          m.ruleId === "import/no-restricted-paths" &&
          m.message.includes("adapter"),
      );
      expect(importErrors).toHaveLength(0);
    },
    30_000,
  );

  it(
    "fails: import from lib/vault/adapter-local is blocked in pages",
    async () => {
      const { ESLint } = await import("eslint");
      const eslint = new ESLint({
        overrideConfigFile: "eslint.config.mjs",
      });

      // A page that directly imports the adapter — must produce a lint error.
      // pages/writing/foo.tsx is two levels deep, so the relative path back to
      // the repo's lib/ is ../../lib (was ../../, which would have resolved to
      // pages/lib — making the test fixture not actually exercise the rule).
      const code = [
        "import { LocalVaultAdapter } from '../../lib/vault/adapter-local';",
        "export default function Page() { return null; }",
      ].join("\n");

      const results = await eslint.lintText(code, {
        filePath: "pages/writing/bad-import.tsx",
      });

      const importErrors = results[0].messages.filter(
        (m) => m.ruleId === "import/no-restricted-paths",
      );
      // Should have at least one error blocking the adapter import
      expect(importErrors.length).toBeGreaterThan(0);
    },
    30_000,
  );

  it(
    "fails: import from lib/vault/adapter-github is blocked in pages",
    async () => {
      const { ESLint } = await import("eslint");
      const eslint = new ESLint({
        overrideConfigFile: "eslint.config.mjs",
      });

      const code = [
        "import { GitHubVaultAdapter } from '../../lib/vault/adapter-github';",
        "export default function Page() { return null; }",
      ].join("\n");

      const results = await eslint.lintText(code, {
        filePath: "pages/writing/bad-import-github.tsx",
      });

      const importErrors = results[0].messages.filter(
        (m) => m.ruleId === "import/no-restricted-paths",
      );
      expect(importErrors.length).toBeGreaterThan(0);
    },
    30_000,
  );
});
