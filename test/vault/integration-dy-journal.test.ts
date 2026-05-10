// @vitest-environment node
/**
 * integration-dy-journal.test.ts — integration test against dy-journal snapshot.
 *
 * Uses __fixtures__/dy-journal-snapshot/ (a deterministic CI snapshot of
 * the dy-journal vault) to validate the adapter works against real content.
 *
 * Asserts:
 *   - At least 1 public note is returned
 *   - Adapter does not throw
 */

import { describe, it, expect } from "vitest";
import path from "node:path";
import { LocalVaultAdapter } from "../../lib/vault/adapter-local";

const DY_JOURNAL_SNAPSHOT = path.resolve("__fixtures__/dy-journal-snapshot");

describe("dy-journal snapshot integration", () => {
  it("adapter-local returns ≥1 public note without throwing", async () => {
    const adapter = new LocalVaultAdapter(DY_JOURNAL_SNAPSHOT);
    const notes = await adapter.getPublicNotes();
    expect(notes.length).toBeGreaterThanOrEqual(1);
  });

  it("returned notes have required fields", async () => {
    const adapter = new LocalVaultAdapter(DY_JOURNAL_SNAPSHOT);
    const notes = await adapter.getPublicNotes();

    for (const note of notes) {
      expect(note.slug).toBeTruthy();
      expect(note.path).toBeTruthy();
      expect(note.frontmatter.title).toBeTruthy();
      expect(note.frontmatter.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(note.frontmatter.visibility).toBe("public");
      expect(typeof note.body).toBe("string");
      expect(typeof note.bodyMarkdown).toBe("string");
      expect(note.preview.kind).toBeDefined();
    }
  });

  it("hello-world note is present and correct", async () => {
    const adapter = new LocalVaultAdapter(DY_JOURNAL_SNAPSHOT);
    const notes = await adapter.getPublicNotes();
    const helloWorld = notes.find((n) => n.slug === "2026-05-10-hello-world");
    expect(helloWorld).toBeDefined();
    expect(helloWorld!.frontmatter.title).toBe("Hello World");
  });

  it("private notes are not in results", async () => {
    const adapter = new LocalVaultAdapter(DY_JOURNAL_SNAPSHOT);
    const notes = await adapter.getPublicNotes();
    const slugs = notes.map((n) => n.slug);

    // private-q3-planning has no visibility field → private
    expect(slugs).not.toContain("private-q3-planning");
    // draft-rough-thoughts has visibility: draft → private
    expect(slugs).not.toContain("draft-rough-thoughts");
  });
});
