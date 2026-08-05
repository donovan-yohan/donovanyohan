// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  getVaultPublicationMode,
  shouldIncludePreviewNotes,
} from "../../lib/vault/publication-mode";

function env(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as unknown as NodeJS.ProcessEnv;
}

describe("vault publication mode", () => {
  it("defaults to public-only with no branch/env override", () => {
    expect(getVaultPublicationMode(env({}))).toBe("public");
    expect(shouldIncludePreviewNotes(env({}))).toBe(false);
  });

  it("enables preview visibility on the default development branches", () => {
    expect(
      getVaultPublicationMode(env({ VERCEL_GIT_COMMIT_REF: "develop" })),
    ).toBe("preview");
    expect(
      getVaultPublicationMode(env({ VERCEL_GIT_COMMIT_REF: "development" })),
    ).toBe("preview");
  });

  it("keeps master/main production branches public-only", () => {
    expect(
      getVaultPublicationMode(env({ VERCEL_GIT_COMMIT_REF: "master" })),
    ).toBe("public");
    expect(
      getVaultPublicationMode(env({ VERCEL_GIT_COMMIT_REF: "main" })),
    ).toBe("public");
  });

  it("supports an explicit preview branch allowlist", () => {
    expect(
      getVaultPublicationMode(env({
        VERCEL_GIT_COMMIT_REF: "staging",
        VAULT_PREVIEW_BRANCHES: "staging,preview",
      })),
    ).toBe("preview");
  });

  it("explicit production mode overrides branch detection", () => {
    expect(
      getVaultPublicationMode(env({
        VERCEL_GIT_COMMIT_REF: "develop",
        VAULT_PUBLICATION_MODE: "production",
      })),
    ).toBe("public");
  });
});
