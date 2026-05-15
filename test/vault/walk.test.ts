// @vitest-environment node
/**
 * walk.test.ts — vault file walk security tests (P17).
 *
 * Asserts:
 *   - .obsidian/, .trash/, .git/, .github/, templates/ are NEVER yielded
 *   - Symlinks in the vault are rejected (not yielded)
 *   - Out-of-vault realpaths are rejected
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import path from "node:path";
import { walkVault } from "../../lib/vault/walk";

const FIXTURE_VAULT = path.resolve("__fixtures__/vault");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("walkVault — ignore list", () => {
  it("never yields .obsidian/ paths", async () => {
    const files = await walkVault(FIXTURE_VAULT);
    const obsidian = files.filter((f) => f.startsWith(".obsidian/"));
    expect(obsidian).toHaveLength(0);
  });

  it("never yields .trash/ paths", async () => {
    const files = await walkVault(FIXTURE_VAULT);
    const trash = files.filter((f) => f.startsWith(".trash/"));
    expect(trash).toHaveLength(0);
  });

  it("never yields .git/ paths (if present)", async () => {
    // .git/ directories can't be committed to git repos, but if present
    // at runtime they must be excluded. The ignore pattern is tested here
    // by checking the walk never returns .git/ paths.
    const files = await walkVault(FIXTURE_VAULT);
    const git = files.filter((f) => f.startsWith(".git/"));
    expect(git).toHaveLength(0);
  });

  it("never yields templates/ paths", async () => {
    const files = await walkVault(FIXTURE_VAULT);
    const tmpl = files.filter((f) => f.startsWith("templates/"));
    expect(tmpl).toHaveLength(0);
  });

  it("only yields markdown files under notes/", async () => {
    const files = await walkVault(FIXTURE_VAULT);
    expect(files).toContain("notes/note-public-1.md");
    expect(files).toContain("notes/note-public-2.md");
    expect(files).toContain("notes/note-public-3.md");
    expect(files).toContain("notes/note-private-1.md");
    expect(files).toContain("notes/note-private-2.md");
    expect(files).toContain("notes/leak-canary.md");
    expect(files).toContain("notes/malformed-frontmatter.md");
    expect(files).not.toContain("note-public-1.md");
    expect(files).not.toContain("leak-canary.md");
  });
});

describe("walkVault — symlink rejection", () => {
  it("rejects symlinks that point outside the vault (e.g. /etc/passwd)", async () => {
    const files = await walkVault(FIXTURE_VAULT);
    // symlink-escape.md in the fixture vault points to /etc/passwd
    const symlinked = files.filter((f) => f.includes("symlink-escape"));
    expect(symlinked).toHaveLength(0);
  });

  it("total file count does not include symlinks or ignored dirs", async () => {
    const files = await walkVault(FIXTURE_VAULT);
    // 7 real .md files under notes/. No root markdown, symlinks, or hidden dirs.
    expect(files.length).toBe(7);
  });
});

describe("walkVault — non-existent vault", () => {
  it("throws if vault root does not exist", async () => {
    await expect(
      walkVault(path.resolve("__fixtures__/does-not-exist")),
    ).rejects.toThrow();
  });
});
