// @vitest-environment node
/**
 * assets.test.ts — note-local vault image pipeline tests.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as tar from "tar";
import { LocalVaultAdapter } from "../../lib/vault/adapter-local";
import { GitHubVaultAdapter } from "../../lib/vault/adapter-github";
import { resolveVaultAssetRef, rewriteMarkdownVaultImageRefs } from "../../lib/vault/assets";
import { VaultParseError } from "../../lib/vault/errors";

const NOTE_WITH_IMAGE = `---
title: Asset Note
date: 2026-05-29
visibility: public
preview:
  kind: image
  image: imgs/hero.svg
---

Intro paragraph.

![Hero diagram](imgs/hero.svg)
`;

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#ffef00"/></svg>`;

async function withTempDir<T>(prefix: string, fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await fn(dir);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

afterEach(async () => {
  await fsp.rm(path.resolve("public", "vault-assets", "asset-note"), {
    recursive: true,
    force: true,
  });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("vault asset pipeline — local adapter", () => {
  it("rewrites note-local markdown and preview images to /vault-assets and copies the asset", async () => {
    await withTempDir("vault-assets-local-", async (tmp) => {
      const vaultRoot = path.join(tmp, "vault");
      const outRoot = path.resolve("public", "vault-assets");

      await fsp.mkdir(path.join(vaultRoot, "notes", "writing", "imgs"), { recursive: true });
      await fsp.writeFile(
        path.join(vaultRoot, "notes", "writing", "asset-note.md"),
        NOTE_WITH_IMAGE
      );
      await fsp.writeFile(path.join(vaultRoot, "notes", "writing", "imgs", "hero.svg"), SVG);

      const notes = await new LocalVaultAdapter(vaultRoot).getPublicNotes();
      expect(notes).toHaveLength(1);
      expect(notes[0].body).toContain('src="/vault-assets/asset-note/hero.svg"');
      expect(notes[0].preview.image).toBe("/vault-assets/asset-note/hero.svg");
      await expect(
        fsp.readFile(path.join(outRoot, "asset-note", "hero.svg"), "utf8")
      ).resolves.toContain("<svg");
    });
  });

  it("fails loudly when a public note references a missing note-local image", async () => {
    await withTempDir("vault-assets-missing-", async (tmp) => {
      const vaultRoot = path.join(tmp, "vault");
      await fsp.mkdir(path.join(vaultRoot, "notes", "writing"), { recursive: true });
      await fsp.writeFile(
        path.join(vaultRoot, "notes", "writing", "asset-note.md"),
        NOTE_WITH_IMAGE
      );

      await expect(new LocalVaultAdapter(vaultRoot).getPublicNotes()).rejects.toMatchObject({
        name: "VaultParseError",
        reason: "asset",
      } satisfies Partial<VaultParseError>);
    });
  });

  it("rejects backslash traversal references before local path joins see them", () => {
    expect(
      resolveVaultAssetRef("notes/writing/post.md", "post", "..\\..\\private\\imgs\\x.svg")
    ).toBeNull();
  });

  it("rewrites image urls with parentheses and ignores image-looking code blocks", async () => {
    const seen: string[] = [];
    const markdown = [
      '![Hero](imgs/hero(1).svg "Hero title")',
      "",
      "```md",
      "![Code](imgs/code.svg)",
      "```",
    ].join("\n");

    const rewritten = await rewriteMarkdownVaultImageRefs(
      markdown,
      "notes/writing/asset-note.md",
      "asset-note",
      async (asset) => {
        seen.push(asset.sourceRelPath);
      }
    );

    expect(rewritten).toContain('![Hero](/vault-assets/asset-note/hero(1).svg "Hero title")');
    expect(rewritten).toContain("![Code](imgs/code.svg)");
    expect(seen).toEqual(["notes/writing/imgs/hero(1).svg"]);
  });
});

async function createTarball(
  entries: Array<{ relativePath: string; content: string | Buffer }>
): Promise<Buffer> {
  return await withTempDir("vault-assets-gh-src-", async (tmp) => {
    const prefix = "owner-repo-sha123";
    await fsp.mkdir(path.join(tmp, prefix), { recursive: true });
    for (const entry of entries) {
      const full = path.join(tmp, prefix, entry.relativePath);
      await fsp.mkdir(path.dirname(full), { recursive: true });
      await fsp.writeFile(full, entry.content);
    }
    const tarPath = path.join(tmp, "out.tar.gz");
    await tar.c({ gzip: true, cwd: tmp, file: tarPath }, [prefix]);
    return await fsp.readFile(tarPath);
  });
}

function mockFetch(tarball: Buffer) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () =>
        Promise.resolve(
          tarball.buffer.slice(tarball.byteOffset, tarball.byteOffset + tarball.byteLength)
        ),
    })
  );
}

describe("vault asset pipeline — GitHub adapter", () => {
  it("collects tarball image assets and writes public /vault-assets copies", async () => {
    await withTempDir("vault-assets-gh-", async () => {
      const outRoot = path.resolve("public", "vault-assets");
      const tarball = await createTarball([
        { relativePath: "notes/writing/asset-note.md", content: NOTE_WITH_IMAGE },
        { relativePath: "notes/writing/imgs/hero.svg", content: SVG },
      ]);
      mockFetch(tarball);

      const notes = await new GitHubVaultAdapter({
        owner: "o",
        repo: "r",
        token: "t",
      }).getPublicNotes();
      expect(notes).toHaveLength(1);
      expect(notes[0].body).toContain('src="/vault-assets/asset-note/hero.svg"');
      await expect(
        fsp.readFile(path.join(outRoot, "asset-note", "hero.svg"), "utf8")
      ).resolves.toContain("<svg");
    });
  });
});
