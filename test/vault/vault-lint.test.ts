/**
 * Tests for scripts/vault-lint.ts
 *
 * Strategy: we import main() directly (the function is pure over argv and
 * returns an exit code). We swap process.stdout.write / process.stderr.write
 * to capture output, and restore them after each test. We create a temporary
 * fixture directory for each test scenario via Node's fs module.
 *
 * Coverage:
 *   - Clean vault → exit 0
 *   - Duplicate slug → exit 1 with paths in output
 *   - Malformed-public note → exit 1
 *   - --report lists every file with status
 *   - --json emits valid JSON matching schema; no human text on stdout
 *   - Pre-commit hook scenario: exit code propagates correctly
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { main } from "../../scripts/vault-lint.js";

// ── Capture helpers ───────────────────────────────────────────────────────────

interface Captured {
  stdout: string;
  stderr: string;
}

function withCapture(fn: () => number): { code: number } & Captured {
  let stdout = "";
  let stderr = "";

  const origStdout = process.stdout.write.bind(process.stdout);
  const origStderr = process.stderr.write.bind(process.stderr);

  process.stdout.write = (chunk: string | Uint8Array): boolean => {
    stdout += chunk.toString();
    return true;
  };
  process.stderr.write = (chunk: string | Uint8Array): boolean => {
    stderr += chunk.toString();
    return true;
  };

  let code: number;
  try {
    code = fn();
  } finally {
    process.stdout.write = origStdout;
    process.stderr.write = origStderr;
  }

  return { code, stdout, stderr };
}

// ── Fixture builder ───────────────────────────────────────────────────────────

const VALID_PUBLIC = (title = "Hello World", date = "2026-05-10") => `---
title: ${title}
date: ${date}
visibility: public
---

Body text.
`;

const VALID_PRIVATE = `---
title: Private Note
date: 2026-05-09
visibility: private
---

Private body.
`;

const NO_VISIBILITY = `---
title: No Visibility
date: 2026-05-08
---

No visibility field — defaults to private.
`;

const MALFORMED_YAML = `---
title: Malformed YAML
date: this is not a date
visibility public
---

Bad frontmatter (missing colon on visibility).
`;

let tmpDir: string;

function makeVault(notes: Record<string, string>): string {
  const vaultDir = join(tmpDir, "vault");
  const notesDir = join(vaultDir, "notes");
  mkdirSync(notesDir, { recursive: true });
  for (const [name, content] of Object.entries(notes)) {
    writeFileSync(join(notesDir, name), content, "utf-8");
  }
  return vaultDir;
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  tmpDir = join(
    tmpdir(),
    `vault-lint-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("vault-lint CLI", () => {
  describe("clean vault", () => {
    it("exits 0 when all notes are valid", () => {
      const vault = makeVault({
        "hello-world.md": VALID_PUBLIC(),
        "private.md": VALID_PRIVATE,
        "no-vis.md": NO_VISIBILITY,
      });

      const { code } = withCapture(() =>
        main(["node", "vault-lint.ts", vault]),
      );

      expect(code).toBe(0);
    });

    it("emits no errors to stderr on clean vault (default mode)", () => {
      const vault = makeVault({
        "hello-world.md": VALID_PUBLIC(),
      });

      const { code, stderr } = withCapture(() =>
        main(["node", "vault-lint.ts", vault]),
      );

      expect(code).toBe(0);
      expect(stderr).not.toMatch(/\[schema\]|\[yaml\]|\[duplicate-slug\]/);
    });
  });

  describe("duplicate slug detection", () => {
    it("exits 1 when two files produce the same slug", () => {
      const vault = makeVault({
        "hello-world.md": VALID_PUBLIC("Hello World"),
        // 'Hello World.md' → same slug as 'hello-world.md'
        "Hello World.md": VALID_PUBLIC("Hello World Dupe"),
      });

      const { code } = withCapture(() =>
        main(["node", "vault-lint.ts", vault]),
      );

      expect(code).toBe(1);
    });

    it("reports both colliding paths in stderr output", () => {
      const vault = makeVault({
        "hello-world.md": VALID_PUBLIC("Hello World"),
        "Hello World.md": VALID_PUBLIC("Hello World Dupe"),
      });

      const { stderr } = withCapture(() =>
        main(["node", "vault-lint.ts", vault]),
      );

      expect(stderr).toMatch(/duplicate-slug|duplicate slug/i);
      expect(stderr).toMatch(/hello-world/);
    });

    it("exits 1 when frontmatter slug override collides with another file", () => {
      const withSlugOverride = `---
title: My Note
date: 2026-05-10
visibility: private
slug: hello-world
---

Body.
`;
      const vault = makeVault({
        "hello-world.md": VALID_PUBLIC("Hello World"),
        "other-note.md": withSlugOverride,
      });

      const { code } = withCapture(() =>
        main(["node", "vault-lint.ts", vault]),
      );

      expect(code).toBe(1);
    });
  });

  describe("malformed notes", () => {
    it("exits 1 on YAML parse error", () => {
      const vault = makeVault({
        "good.md": VALID_PUBLIC(),
        "malformed.md": MALFORMED_YAML,
      });

      const { code } = withCapture(() =>
        main(["node", "vault-lint.ts", vault]),
      );

      expect(code).toBe(1);
    });

    it("reports yaml error kind in stderr", () => {
      const vault = makeVault({
        "malformed.md": MALFORMED_YAML,
      });

      const { stderr } = withCapture(() =>
        main(["node", "vault-lint.ts", vault]),
      );

      expect(stderr).toMatch(/\[yaml\]/);
    });

    it("does not crash on a file with missing required fields (treats as private)", () => {
      const missingTitle = `---
date: 2026-05-10
visibility: public
---

No title field — schema should fail, resolves to private.
`;
      const vault = makeVault({
        "no-title.md": missingTitle,
      });

      const { code } = withCapture(() =>
        main(["node", "vault-lint.ts", vault]),
      );

      // Missing title on public note → schema error → exit 1
      // (resolveVisibility returns 'private' since schema fails → no error from lint)
      // Actually: resolveVisibility uses safeParse; missing title → returns private → no error
      // So exit 0 (it's just treated as private)
      expect(code).toBe(0);
    });
  });

  describe("--report flag", () => {
    it("lists every file with its status", () => {
      const vault = makeVault({
        "public-note.md": VALID_PUBLIC(),
        "private-note.md": VALID_PRIVATE,
        "no-vis.md": NO_VISIBILITY,
      });

      const { stderr } = withCapture(() =>
        main(["node", "vault-lint.ts", "--report", vault]),
      );

      expect(stderr).toMatch(/public-note\.md/);
      expect(stderr).toMatch(/private-note\.md/);
      expect(stderr).toMatch(/no-vis\.md/);
    });

    it("marks public files with [public] tag", () => {
      const vault = makeVault({
        "my-post.md": VALID_PUBLIC(),
      });

      const { stderr } = withCapture(() =>
        main(["node", "vault-lint.ts", "--report", vault]),
      );

      expect(stderr).toMatch(/\[public\]/i);
      expect(stderr).toMatch(/my-post\.md/);
    });

    it("marks private files with [private] tag and includes reason", () => {
      const vault = makeVault({
        "private.md": VALID_PRIVATE,
      });

      const { stderr } = withCapture(() =>
        main(["node", "vault-lint.ts", "--report", vault]),
      );

      expect(stderr).toMatch(/\[private\]/i);
      expect(stderr).toMatch(/private\.md/);
    });

    it("exits 0 on clean vault even with --report", () => {
      const vault = makeVault({
        "post.md": VALID_PUBLIC(),
      });

      const { code } = withCapture(() =>
        main(["node", "vault-lint.ts", "--report", vault]),
      );

      expect(code).toBe(0);
    });

    it("exits 1 and reports errors in --report mode", () => {
      const vault = makeVault({
        // "hello-world.md" and "Hello World.md" both derive slug "hello-world"
        "hello-world.md": VALID_PUBLIC("Note A"),
        "Hello World.md": VALID_PUBLIC("Note A Dup"),
      });

      const { code, stderr } = withCapture(() =>
        main(["node", "vault-lint.ts", "--report", vault]),
      );

      expect(code).toBe(1);
      expect(stderr).toMatch(/duplicate/i);
    });
  });

  describe("--json flag", () => {
    it("emits valid JSON to stdout", () => {
      const vault = makeVault({
        "hello.md": VALID_PUBLIC(),
        "private.md": VALID_PRIVATE,
      });

      const { stdout } = withCapture(() =>
        main(["node", "vault-lint.ts", "--json", vault]),
      );

      const parsed = JSON.parse(stdout) as unknown;
      expect(parsed).toBeTruthy();
    });

    it("JSON output matches the expected schema shape", () => {
      const vault = makeVault({
        "hello.md": VALID_PUBLIC(),
        "private.md": VALID_PRIVATE,
      });

      const { stdout } = withCapture(() =>
        main(["node", "vault-lint.ts", "--json", vault]),
      );

      const result = JSON.parse(stdout) as {
        summary: { walked: number; public: number; private: number; errors: number };
        files: Array<{ path: string; status: string; reason?: string }>;
        errors: Array<{ path: string; kind: string; message: string }>;
      };

      expect(typeof result.summary.walked).toBe("number");
      expect(typeof result.summary.public).toBe("number");
      expect(typeof result.summary.private).toBe("number");
      expect(typeof result.summary.errors).toBe("number");
      expect(Array.isArray(result.files)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);

      // Verify a file entry shape
      const publicFile = result.files.find((f) => f.path.includes("hello"));
      expect(publicFile).toBeDefined();
      expect(publicFile?.status).toBe("public");

      const privateFile = result.files.find((f) => f.path.includes("private"));
      expect(privateFile).toBeDefined();
      expect(privateFile?.status).toBe("private");
    });

    it("emits no human-readable text to stdout in --json mode", () => {
      const vault = makeVault({
        "hello.md": VALID_PUBLIC(),
      });

      const { stdout } = withCapture(() =>
        main(["node", "vault-lint.ts", "--json", vault]),
      );

      // The only stdout content should be parseable JSON
      expect(() => JSON.parse(stdout)).not.toThrow();
      // Verify it's not wrapped in extra prose
      expect(stdout.trim()).toMatch(/^\{/);
    });

    it("summary counts match actual files", () => {
      const vault = makeVault({
        "pub1.md": VALID_PUBLIC("Note 1"),
        "pub2.md": VALID_PUBLIC("Note 2"),
        "priv.md": VALID_PRIVATE,
      });

      const { stdout } = withCapture(() =>
        main(["node", "vault-lint.ts", "--json", vault]),
      );

      const result = JSON.parse(stdout) as {
        summary: { walked: number; public: number; private: number; errors: number };
        files: Array<{ path: string; status: string }>;
        errors: Array<unknown>;
      };

      expect(result.summary.walked).toBe(3);
      expect(result.summary.public).toBe(2);
      expect(result.summary.private).toBe(1);
      expect(result.summary.errors).toBe(0);
    });

    it("exits 1 and reports errors in JSON", () => {
      const vault = makeVault({
        // "hello-world.md" and "Hello World.md" both derive slug "hello-world"
        "hello-world.md": VALID_PUBLIC("Note A"),
        "Hello World.md": VALID_PUBLIC("Note A Dup"),
      });

      const { code, stdout } = withCapture(() =>
        main(["node", "vault-lint.ts", "--json", vault]),
      );

      const result = JSON.parse(stdout) as {
        errors: Array<{ kind: string; path: string; message: string }>;
      };

      expect(code).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("does not emit human-readable output to stderr in --json mode", () => {
      const vault = makeVault({
        "hello.md": VALID_PUBLIC(),
      });

      const { stderr } = withCapture(() =>
        main(["node", "vault-lint.ts", "--json", vault]),
      );

      // No human-readable summary lines in stderr for json mode
      expect(stderr).not.toMatch(/vault-lint:/);
      expect(stderr).not.toMatch(/walked/);
    });
  });

  describe("hidden directory skipping", () => {
    it("does not walk .obsidian or .trash directories", () => {
      const vaultDir = join(tmpDir, "vault");
      const notesDir = join(vaultDir, "notes");
      const obsidianDir = join(vaultDir, ".obsidian");
      const trashDir = join(vaultDir, ".trash");

      mkdirSync(notesDir, { recursive: true });
      mkdirSync(obsidianDir, { recursive: true });
      mkdirSync(trashDir, { recursive: true });

      writeFileSync(join(notesDir, "public.md"), VALID_PUBLIC(), "utf-8");
      // These malformed files in hidden dirs should NOT be walked
      writeFileSync(join(obsidianDir, "settings.md"), MALFORMED_YAML, "utf-8");
      writeFileSync(join(trashDir, "deleted.md"), MALFORMED_YAML, "utf-8");

      const { code, stdout } = withCapture(() =>
        main(["node", "vault-lint.ts", "--json", vaultDir]),
      );

      // Only the one note in notes/ should be walked; no errors from hidden dirs
      const result = JSON.parse(stdout) as {
        summary: { walked: number; errors: number };
      };

      expect(code).toBe(0);
      expect(result.summary.walked).toBe(1);
    });
  });

  describe("pre-commit hook scenario", () => {
    it("exit code propagates correctly for CI use", () => {
      const cleanVault = makeVault({
        "note.md": VALID_PUBLIC(),
      });

      const { code: cleanCode } = withCapture(() =>
        main(["node", "vault-lint.ts", cleanVault]),
      );
      expect(cleanCode).toBe(0);

      const dupVault = makeVault({
        // "hello-world.md" and "Hello World.md" both derive slug "hello-world"
        "hello-world.md": VALID_PUBLIC("Note"),
        "Hello World.md": VALID_PUBLIC("Note Dup"),
      });

      const { code: errCode } = withCapture(() =>
        main(["node", "vault-lint.ts", dupVault]),
      );
      expect(errCode).toBe(1);
    });
  });

  describe("static fixture vault", () => {
    it("lints the __fixtures__/vault directory cleanly", () => {
      const fixtureVault = join(
        process.cwd(),
        "__fixtures__",
        "vault",
      );

      const { code } = withCapture(() =>
        main(["node", "vault-lint.ts", fixtureVault]),
      );

      expect(code).toBe(0);
    });
  });
});
