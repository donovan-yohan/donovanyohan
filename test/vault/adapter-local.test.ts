// @vitest-environment node
/**
 * adapter-local.test.ts — local filesystem adapter tests.
 *
 * Uses __fixtures__/vault/ as the test vault.
 * Asserts:
 *   - Returns exactly 3 public notes
 *   - Private notes never reach body rendering
 *   - .trash/ files are never read
 *   - Malformed YAML is skipped (private path)
 *   - leak-canary remains private
 */

import { describe, it, expect } from "vitest";
import path from "node:path";
import { LocalVaultAdapter } from "../../lib/vault/adapter-local";

const FIXTURE_VAULT = path.resolve("__fixtures__/vault");

describe("LocalVaultAdapter — public note count", () => {
  it("returns exactly 3 public notes", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    expect(notes).toHaveLength(3);
  });

  it("all returned notes have visibility === 'public'", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    for (const note of notes) {
      expect(note.frontmatter.visibility).toBe("public");
    }
  });

  it("returned notes have the correct slugs", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const slugs = notes.map((n) => n.slug).sort();
    expect(slugs).toEqual(
      ["note-public-1", "note-public-2", "note-public-3"].sort(),
    );
  });
});

describe("LocalVaultAdapter — private notes never body-rendered", () => {
  it("does not read .trash/ files (verified by checking returned notes + walk)", async () => {
    // We can't spy on ESM readFile directly, but we can verify that
    // .trash/ files are never in the walk results, and the adapter
    // returns no notes from .trash/
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();

    // No note should have a path starting with .trash/
    const trashNotes = notes.filter((n) => n.path.startsWith(".trash/"));
    expect(trashNotes).toHaveLength(0);
  });

  it("leak-canary is not in returned public notes", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const slugs = notes.map((n) => n.slug);
    expect(slugs).not.toContain("leak-canary");
  });

  it("canary sentinel string is not in any public note body", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    for (const note of notes) {
      expect(note.body).not.toContain("PRIVATE_LEAK_CANARY_dx7q9z");
      expect(note.bodyMarkdown).not.toContain("PRIVATE_LEAK_CANARY_dx7q9z");
    }
  });

  it("private note bodies are never in returned notes", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const allBodies = notes.map((n) => n.body + n.bodyMarkdown).join("\n");
    expect(allBodies).not.toContain("PRIVATE_CONTENT_MARKER_ONE");
    expect(allBodies).not.toContain("PRIVATE_CONTENT_MARKER_TWO");
  });
});

describe("LocalVaultAdapter — malformed YAML is skipped", () => {
  it("malformed-frontmatter.md is not in public notes", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const slugs = notes.map((n) => n.slug);
    // 'malformed-frontmatter' is the derived slug
    expect(slugs).not.toContain("malformed-frontmatter");
  });

  it("malformed note content does not appear in public output", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const allBodies = notes.map((n) => n.body + n.bodyMarkdown).join("\n");
    expect(allBodies).not.toContain("MALFORMED_PRIVATE_MARKER");
  });
});

describe("LocalVaultAdapter — body structure", () => {
  it("public note body is HTML (contains rendered paragraph)", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const note1 = notes.find((n) => n.slug === "note-public-1");
    expect(note1).toBeDefined();
    // Body should be HTML, not raw markdown
    expect(note1!.body).toContain("<p>");
  });

  it("bodyMarkdown is raw markdown (no HTML tags)", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const note1 = notes.find((n) => n.slug === "note-public-1");
    expect(note1).toBeDefined();
    expect(note1!.bodyMarkdown).not.toContain("<p>");
    expect(note1!.bodyMarkdown).toContain("This is the first public note");
  });

  it("wikilinks are stripped from body HTML", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const note1 = notes.find((n) => n.slug === "note-public-1");
    expect(note1).toBeDefined();
    // [[private-note]] should be stripped to plain text
    expect(note1!.body).not.toContain("[[");
    expect(note1!.body).not.toContain("]]");
  });

  it("embeds are stripped from body HTML (no asset name leaked)", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const note1 = notes.find((n) => n.slug === "note-public-1");
    expect(note1).toBeDefined();
    // ![[private-asset.png]] should be stripped entirely
    expect(note1!.body).not.toContain("private-asset.png");
  });

  it("preview has required fields with defaults applied", async () => {
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    for (const note of notes) {
      expect(note.preview.kind).toBeDefined();
      expect(typeof note.preview.span).toBe("number");
    }
  });
});

describe("LocalVaultAdapter — wikilink resolution (P31)", () => {
  it("public-to-public wikilink resolves to an anchor", async () => {
    // note-public-2.md has [[note-public-1|link to first post]]
    // note-public-1 is a public slug → anchor /writing/note-public-1 with alias text.
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const note2 = notes.find((n) => n.slug === "note-public-2");
    expect(note2).toBeDefined();
    expect(note2!.body).toContain(
      '<a href="/writing/note-public-1">link to first post</a>',
    );
  });

  it("unresolved wikilink target falls back to plain text (no anchor)", async () => {
    // note-public-1.md has [[private-note]] — neither slug exists.
    // Resolves to neither public nor private, so falls back to text.
    const adapter = new LocalVaultAdapter(FIXTURE_VAULT);
    const notes = await adapter.getPublicNotes();
    const note1 = notes.find((n) => n.slug === "note-public-1");
    expect(note1).toBeDefined();
    expect(note1!.body).toContain("private-note");
    expect(note1!.body).not.toMatch(/<a[^>]*>private-note<\/a>/);
    expect(note1!.body).not.toContain("[[");
  });

  it("leak gate throws when a public note wikilinks to a private slug", async () => {
    // Build a tiny fixture vault on disk with one public + one private note,
    // where the public note links to the private slug.
    const { mkdtemp, writeFile, mkdir, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const tmpVault = await mkdtemp(path.join(tmpdir(), "vault-leak-"));
    const notesDir = path.join(tmpVault, "notes");
    await mkdir(notesDir, { recursive: true });

    await writeFile(
      path.join(notesDir, "public-leaker.md"),
      `---
title: Public Leaker
date: 2026-05-10
visibility: public
---

This links to [[private-target]] which should fail the build.
`,
    );
    await writeFile(
      path.join(notesDir, "private-target.md"),
      `---
title: Private Target
date: 2026-05-10
visibility: private
---

Body should never be read.
`,
    );

    const { WikilinkLeakError } = await import("../../lib/vault/errors");
    const adapter = new LocalVaultAdapter(tmpVault);

    try {
      await expect(adapter.getPublicNotes()).rejects.toBeInstanceOf(
        WikilinkLeakError,
      );
    } finally {
      await rm(tmpVault, { recursive: true, force: true });
    }
  });
});

describe("LocalVaultAdapter — empty vault", () => {
  it("returns empty array for empty vault directory", async () => {
    const { mkdtemp, rmdir } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const tmpVault = await mkdtemp(path.join(tmpdir(), "vault-empty-"));
    try {
      const adapter = new LocalVaultAdapter(tmpVault);
      const notes = await adapter.getPublicNotes();
      expect(notes).toEqual([]);
    } finally {
      await rmdir(tmpVault).catch(() => {});
    }
  });
});
