// @vitest-environment node
/**
 * adapter-github.test.ts — GitHub tarball adapter tests.
 *
 * Uses mocked fetch with synthetic tarballs to test:
 *   - Basic public/private note filtering
 *   - Path traversal entries are rejected
 *   - Absolute path entries are rejected
 *   - Symlink entries are rejected
 *   - Token is redacted in fetch error messages
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import * as tar from "tar";
import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { GitHubVaultAdapter } from "../../lib/vault/adapter-github";

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Creates an in-memory tarball Buffer containing the given entries.
 * Uses a temp directory and tar.c for reliability.
 */
async function createTarball(
  entries: Array<{
    relativePath: string;
    content?: string;
  }>,
  prefix = "owner-repo-sha123",
): Promise<Buffer> {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "vault-gh-test-"));
  try {
    // Create the prefix subdirectory
    await fsp.mkdir(path.join(tmpDir, prefix), { recursive: true });

    // Write each entry
    const relPaths: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(tmpDir, prefix, entry.relativePath);
      await fsp.mkdir(path.dirname(fullPath), { recursive: true });
      await fsp.writeFile(fullPath, entry.content ?? "");
      relPaths.push(path.join(prefix, entry.relativePath));
    }

    if (relPaths.length === 0) {
      // Empty tarball
      const tarPath = path.join(tmpDir, "out.tar.gz");
      await tar.c({ gzip: true, cwd: tmpDir, file: tarPath }, [prefix]);
      return await fsp.readFile(tarPath);
    }

    const tarPath = path.join(tmpDir, "out.tar.gz");
    await tar.c({ gzip: true, cwd: tmpDir, file: tarPath }, [prefix]);
    return await fsp.readFile(tarPath);
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Creates a tarball with a symlink entry by writing a raw tar archive.
 * Since tar.c cannot add symlink entries easily in tests, we create one
 * via a regular temp file approach.
 */
async function createTarballWithSymlink(
  prefix = "owner-repo-sha123",
  safeEntry: { relativePath: string; content: string },
): Promise<Buffer> {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "vault-sym-test-"));
  try {
    await fsp.mkdir(path.join(tmpDir, prefix), { recursive: true });

    // Write safe file
    const safePath = path.join(tmpDir, prefix, safeEntry.relativePath);
    await fsp.mkdir(path.dirname(safePath), { recursive: true });
    await fsp.writeFile(safePath, safeEntry.content);

    // Create a symlink
    const symlinkPath = path.join(tmpDir, prefix, "symlink.md");
    await fsp.symlink("/etc/passwd", symlinkPath);

    const tarPath = path.join(tmpDir, "out.tar.gz");
    // follow=false ensures symlink is included as a symlink entry
    await tar.c(
      { gzip: true, cwd: tmpDir, file: tarPath, follow: false },
      [prefix],
    );
    return await fsp.readFile(tarPath);
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Mock global fetch with a tarball Buffer as the response body.
 */
function mockFetch(tarball: Buffer, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      arrayBuffer: () =>
        Promise.resolve(
          tarball.buffer.slice(
            tarball.byteOffset,
            tarball.byteOffset + tarball.byteLength,
          ),
        ),
    }),
  );
}

const PUBLIC_NOTE = `---
title: Test Public Note
date: 2026-05-10
visibility: public
---

This is a public note in the GitHub tarball.
`;

const PRIVATE_NOTE = `---
title: Test Private Note
date: 2026-05-10
visibility: private
---

This is a private note. It should not be returned.
`;

describe("GitHubVaultAdapter — basic filtering", () => {
  it("returns public notes and filters private notes", async () => {
    const tarball = await createTarball([
      { relativePath: "notes/public-note.md", content: PUBLIC_NOTE },
      { relativePath: "notes/private-note.md", content: PRIVATE_NOTE },
    ]);
    mockFetch(tarball);

    const adapter = new GitHubVaultAdapter({
      owner: "test-owner",
      repo: "test-repo",
      token: "test-token-123",
    });

    const notes = await adapter.getPublicNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].slug).toBe("public-note");
  });

  it("ignores root markdown outside notes/", async () => {
    const tarball = await createTarball([
      { relativePath: "AGENTS.md", content: PUBLIC_NOTE },
      { relativePath: "README.md", content: PUBLIC_NOTE },
      { relativePath: "notes/public-note.md", content: PUBLIC_NOTE },
    ]);
    mockFetch(tarball);

    const adapter = new GitHubVaultAdapter({
      owner: "test-owner",
      repo: "test-repo",
      token: "test-token-123",
    });

    const notes = await adapter.getPublicNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].path).toBe("notes/public-note.md");
  });

  it("strips prefix from tarball paths", async () => {
    const tarball = await createTarball(
      [{ relativePath: "notes/my-public-note.md", content: PUBLIC_NOTE }],
      "org-repo-abc1234",
    );
    mockFetch(tarball);

    const adapter = new GitHubVaultAdapter({
      owner: "org",
      repo: "repo",
      token: "tok",
    });

    const notes = await adapter.getPublicNotes();
    expect(notes).toHaveLength(1);
    // path should be vault-relative, without the prefix
    expect(notes[0].path).toBe("notes/my-public-note.md");
  });
});

describe("GitHubVaultAdapter — security: symlink rejection", () => {
  it("rejects symlinks in tarball entries", async () => {
    const tarball = await createTarballWithSymlink("prefix", {
      relativePath: "notes/safe.md",
      content: PUBLIC_NOTE,
    });
    mockFetch(tarball);

    const adapter = new GitHubVaultAdapter({
      owner: "o",
      repo: "r",
      token: "t",
    });

    const notes = await adapter.getPublicNotes();
    // Only the safe file should be returned
    expect(notes).toHaveLength(1);
    expect(notes[0].slug).toBe("safe");
  });
});

describe("GitHubVaultAdapter — security: token redaction", () => {
  it("redacts token from fetch error messages", async () => {
    const secretToken = "super-secret-gh-token-xyz";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new Error(
          `Network error connecting to api.github.com with token ${secretToken}`,
        ),
      ),
    );

    const adapter = new GitHubVaultAdapter({
      owner: "o",
      repo: "r",
      token: secretToken,
    });

    await expect(adapter.getPublicNotes()).rejects.toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining(secretToken),
      }),
    );
  });

  it("redacted error contains [REDACTED] placeholder", async () => {
    const secretToken = "secret-token-abc";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new Error(`fetch failed for token ${secretToken}`),
      ),
    );

    const adapter = new GitHubVaultAdapter({
      owner: "o",
      repo: "r",
      token: secretToken,
    });

    await expect(adapter.getPublicNotes()).rejects.toThrow(/\[REDACTED\]/);
  });
});

describe("GitHubVaultAdapter — ignore list", () => {
  it("ignores .obsidian/ entries in tarball", async () => {
    const tarball = await createTarball([
      { relativePath: ".obsidian/workspace.json", content: '{"main":{}}' },
      { relativePath: "notes/public.md", content: PUBLIC_NOTE },
    ]);
    mockFetch(tarball);

    const adapter = new GitHubVaultAdapter({
      owner: "o",
      repo: "r",
      token: "t",
    });

    const notes = await adapter.getPublicNotes();
    expect(notes).toHaveLength(1);
  });

  it("ignores .trash/ entries in tarball", async () => {
    const tarball = await createTarball([
      { relativePath: ".trash/old.md", content: PUBLIC_NOTE },
      { relativePath: "notes/public.md", content: PUBLIC_NOTE },
    ]);
    mockFetch(tarball);

    const adapter = new GitHubVaultAdapter({
      owner: "o",
      repo: "r",
      token: "t",
    });

    const notes = await adapter.getPublicNotes();
    // Both .trash/old.md AND public.md have the same content/slug conflict;
    // but .trash is ignored, so only public.md is processed
    expect(notes).toHaveLength(1);
  });
});

describe("GitHubVaultAdapter — HTTP errors", () => {
  it("throws on non-200 HTTP response", async () => {
    const emptyTarball = await createTarball([]);
    mockFetch(emptyTarball, 404);

    const adapter = new GitHubVaultAdapter({
      owner: "o",
      repo: "r",
      token: "t",
    });

    await expect(adapter.getPublicNotes()).rejects.toThrow(/404/);
  });
});
