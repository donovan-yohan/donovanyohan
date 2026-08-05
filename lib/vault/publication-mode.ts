/**
 * publication-mode.ts — decides whether preview-visible vault notes are rendered.
 *
 * Default is production/public-only. Preview visibility is enabled only by an
 * explicit env override or by building one of the configured development
 * branches. No module-init env reads; callers evaluate this at build time.
 */

export type VaultPublicationMode = "public" | "preview";

const DEFAULT_PREVIEW_BRANCHES = ["develop", "development"];

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function currentBranch(env: NodeJS.ProcessEnv): string | undefined {
  return (
    env.VERCEL_GIT_COMMIT_REF ??
    env.GITHUB_REF_NAME ??
    env.CF_PAGES_BRANCH ??
    env.BRANCH ??
    undefined
  );
}

export function getVaultPublicationMode(
  env: NodeJS.ProcessEnv = process.env,
): VaultPublicationMode {
  const explicit = env.VAULT_PUBLICATION_MODE ?? env.VAULT_VISIBILITY_MODE;

  if (explicit === "preview") return "preview";
  if (explicit === "public" || explicit === "production") return "public";

  const branch = currentBranch(env);
  if (!branch) return "public";

  const previewBranches = splitList(env.VAULT_PREVIEW_BRANCHES);
  const allowed = previewBranches.length > 0 ? previewBranches : DEFAULT_PREVIEW_BRANCHES;

  return allowed.includes(branch) ? "preview" : "public";
}

export function shouldIncludePreviewNotes(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getVaultPublicationMode(env) === "preview";
}