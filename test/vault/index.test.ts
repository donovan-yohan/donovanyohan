// @vitest-environment node
/**
 * index.test.ts — vault orchestrator tests.
 *
 * Tests:
 *   - getPublicNotes() memoization (second call doesn't re-walk)
 *   - getNoteBySlug() returns null for unknown slugs
 *   - __resetVaultCache__ clears the cache
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "node:path";

// Set up env before module-level imports
process.env.VAULT_SOURCE = "local";
process.env.VAULT_PATH = path.resolve("__fixtures__/vault");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getPublicNotes — memoization", () => {
  it("returns notes from the fixture vault", async () => {
    const { getPublicNotes, __resetVaultCache__ } = await import(
      "../../lib/vault/index"
    );
    __resetVaultCache__();

    const notes = await getPublicNotes();
    expect(notes.length).toBeGreaterThanOrEqual(3);
  });

  it("second call returns same cached result (spy on LocalVaultAdapter)", async () => {
    const { getPublicNotes, __resetVaultCache__ } = await import(
      "../../lib/vault/index"
    );
    __resetVaultCache__();

    const { LocalVaultAdapter } = await import("../../lib/vault/adapter-local");
    const spy = vi.spyOn(LocalVaultAdapter.prototype, "getPublicNotes");

    const notes1 = await getPublicNotes();
    const notes2 = await getPublicNotes();

    // Same reference (cached)
    expect(notes1).toBe(notes2);
    // Adapter only called once
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("__resetVaultCache__ causes re-walk on next call", async () => {
    const { getPublicNotes, __resetVaultCache__ } = await import(
      "../../lib/vault/index"
    );
    __resetVaultCache__();

    const { LocalVaultAdapter } = await import("../../lib/vault/adapter-local");
    const spy = vi.spyOn(LocalVaultAdapter.prototype, "getPublicNotes");

    await getPublicNotes();
    __resetVaultCache__();
    await getPublicNotes();

    // Called twice — once per cache reset
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("getNoteBySlug — lookup", () => {
  beforeEach(async () => {
    const { __resetVaultCache__ } = await import("../../lib/vault/index");
    __resetVaultCache__();
  });

  it("returns the note for a known slug", async () => {
    const { getNoteBySlug } = await import("../../lib/vault/index");
    const note = await getNoteBySlug("note-public-1");
    expect(note).not.toBeNull();
    expect(note!.slug).toBe("note-public-1");
  });

  it("returns null for an unknown slug", async () => {
    const { getNoteBySlug } = await import("../../lib/vault/index");
    const note = await getNoteBySlug("totally-unknown-slug-xyz");
    expect(note).toBeNull();
  });

  it("returns null for a private note slug", async () => {
    const { getNoteBySlug } = await import("../../lib/vault/index");
    const note = await getNoteBySlug("leak-canary");
    expect(note).toBeNull();
  });
});

describe("getPublicNotes — sorted by date descending", () => {
  it("notes are sorted by date descending", async () => {
    const { getPublicNotes, __resetVaultCache__ } = await import(
      "../../lib/vault/index"
    );
    __resetVaultCache__();

    const notes = await getPublicNotes();
    for (let i = 1; i < notes.length; i++) {
      expect(
        notes[i - 1].frontmatter.date >= notes[i].frontmatter.date,
      ).toBe(true);
    }
  });
});

describe("getVaultConfig — production env enforcement", () => {
  it("throws VaultConfigError in production when VAULT_PATH is missing", async () => {
    // Use vi.stubEnv to safely override env vars in Vitest
    vi.stubEnv("VAULT_SOURCE", "local");
    vi.stubEnv("VAULT_PATH", "");
    vi.stubEnv("NODE_ENV", "production");

    try {
      const { getVaultConfig } = await import("../../lib/vault/index");
      const { VaultConfigError } = await import("../../lib/vault/errors");
      expect(() => getVaultConfig()).toThrow(VaultConfigError);
    } finally {
      vi.unstubAllEnvs();
      // Restore test env
      process.env.VAULT_SOURCE = "local";
      process.env.VAULT_PATH = path.resolve("__fixtures__/vault");
    }
  });
});
