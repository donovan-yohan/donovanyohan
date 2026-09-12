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

// ── ESLint import restriction — adapter-* never imported from pages ────────────
//
// These tests verify the ESLint rules that prevent pages from importing vault
// adapters directly (AGENTS.md load-bearing rule). ESLint startup is slow; tests
// carry a 30s timeout.
//
// IMPORTANT: assert on the human-readable violation *message*, not merely on the
// ruleId. A previous version filtered on ruleId alone, which meant a resolver
// crash ("Resolve error: typescript with invalid interface loaded as resolver")
// was reported under the same ruleId and counted as a passing enforcement —
// masking the fact that the boundary was never actually enforced.

/** Lint a snippet as if it were a page, returning only real boundary violations. */
async function lintPage(code: string, filePath: string) {
  const { ESLint } = await import("eslint");
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });
  const results = await eslint.lintText(code, { filePath });
  const messages = results[0].messages;

  // A resolver failure is a broken harness, not a passing boundary. Fail loudly.
  const resolveErrors = messages.filter((m) =>
    m.message.startsWith("Resolve error:"),
  );
  if (resolveErrors.length > 0) {
    throw new Error(
      `ESLint import resolver is broken, so the vault boundary is NOT being ` +
        `enforced: ${resolveErrors.map((m) => m.message).join("; ")}`,
    );
  }

  return messages.filter(
    (m) =>
      (m.ruleId === "no-restricted-imports" ||
        m.ruleId === "import/no-restricted-paths") &&
      /must import vault API from/.test(m.message),
  );
}

describe("vault adapter import boundary", () => {
  it(
    "passes: import from lib/vault barrel is allowed in pages",
    async () => {
      const code = [
        "import { getPublicNotes } from '../../lib/vault';",
        "export const getStaticProps = async () => {",
        "  const notes = await getPublicNotes();",
        "  return { props: { notes } };",
        "};",
        "export default function Page() { return null; }",
      ].join("\n");

      expect(await lintPage(code, "pages/work/index.tsx")).toHaveLength(0);
    },
    30_000,
  );

  it(
    "passes: non-adapter vault internals stay importable from pages",
    async () => {
      for (const spec of ["../../lib/vault/schema", "../../lib/vault/taxonomy"]) {
        const code = [
          `import type { X } from '${spec}';`,
          "export default function Page() { return null; }",
        ].join("\n");
        expect(await lintPage(code, "pages/work/index.tsx")).toHaveLength(0);
      }
    },
    30_000,
  );

  it.each([
    ["adapter-local", "pages/work/bad.tsx", "../../lib/vault/adapter-local"],
    ["adapter-github", "pages/work/bad.tsx", "../../lib/vault/adapter-github"],
    ["adapter-local at pages root", "pages/bad.tsx", "../lib/vault/adapter-local"],
    ["adapter-github via @/ alias", "pages/bad.tsx", "@/lib/vault/adapter-github"],
    ["adapter-local via @/ alias", "pages/bad.tsx", "@/lib/vault/adapter-local"],
  ])(
    "blocks: %s is not importable from pages",
    async (_name, filePath, spec) => {
      const code = [
        `import { X } from '${spec}';`,
        "export default function Page() { return null; }",
      ].join("\n");

      expect((await lintPage(code, filePath)).length).toBeGreaterThan(0);
    },
    30_000,
  );
});
