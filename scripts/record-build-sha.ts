/**
 * scripts/record-build-sha.ts — resolve and print the dy-journal HEAD SHA.
 *
 * Used to populate BUILD_VAULT_SHA at build time (P29). Output goes to stdout
 * so the caller can wire it into the env:
 *
 *   BUILD_VAULT_SHA=$(npx ts-node scripts/record-build-sha.ts) next build
 *
 * Slice 0 scope:
 *   - VAULT_SOURCE=local  → runs `git -C $VAULT_PATH rev-parse --short HEAD`
 *   - VAULT_SOURCE=github → prints "github" (placeholder; Slice 1 will call
 *                           the GitHub API for the actual SHA)
 *
 * Simplification per issue #35: pages/writing/index.tsx falls back to
 * process.env.BUILD_VAULT_SHA ?? "dev", so this script is optional in
 * development. Production should export BUILD_VAULT_SHA via Vercel env vars
 * or a build command that runs this script before `next build`.
 */

import { execSync } from "node:child_process";
import path from "node:path";

function main() {
  const source = process.env.VAULT_SOURCE ?? "local";

  if (source === "github") {
    // Slice 1 will resolve the actual commit SHA via the GitHub API.
    // For now, emit a placeholder so the meta tag is present in production.
    process.stdout.write("github\n");
    return;
  }

  // Local source: resolve VAULT_PATH (mirroring getVaultConfig defaults)
  const vaultPath =
    process.env.VAULT_PATH ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : path.resolve("__fixtures__/vault"));

  if (!vaultPath) {
    process.stderr.write(
      "record-build-sha: VAULT_PATH is required in production. " +
        "Set VAULT_PATH or export BUILD_VAULT_SHA manually.\n",
    );
    process.stdout.write("unknown\n");
    process.exit(0); // Don't fail the build for a missing SHA
  }

  try {
    const sha = execSync(`git -C "${vaultPath}" rev-parse --short HEAD`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    process.stdout.write(sha + "\n");
  } catch {
    // Vault path may not be a git repo (e.g. tarball extract). Fall back gracefully.
    process.stderr.write(
      `record-build-sha: could not run git in "${vaultPath}" — emitting "dev"\n`,
    );
    process.stdout.write("dev\n");
  }
}

main();
