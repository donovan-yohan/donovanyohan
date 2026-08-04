// @vitest-environment node

import type { GetStaticPathsContext, GetStaticPropsContext } from "next";
import { beforeEach, describe, expect, test, vi } from "vitest";

const vaultMocks = vi.hoisted(() => ({
  getNoteBySlug: vi.fn(),
  getPublicNotes: vi.fn(),
  getVaultConfig: vi.fn(),
  getVaultTaxonomy: vi.fn(),
}));

vi.mock("../lib/vault", () => vaultMocks);
vi.mock("next/font/google", () => ({
  Geist_Mono: () => ({ className: "geist-mono" }),
  Crimson_Pro: () => ({ className: "crimson-pro" }),
  Caveat: () => ({ className: "caveat" }),
}));

import { BLOG_PAGE_ENABLED } from "../lib/flags";
import { getStaticProps as getBlogIndexStaticProps } from "../pages/blog";
import {
  getStaticPaths as getBlogSlugStaticPaths,
  getStaticProps as getBlogSlugStaticProps,
} from "../pages/blog/[slug]";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("disabled blog feature flag", () => {
  test("defaults to false", () => {
    expect(BLOG_PAGE_ENABLED).toBe(false);
  });

  test("/blog returns notFound before any vault reads", async () => {
    const result = await getBlogIndexStaticProps({} as GetStaticPropsContext);

    expect(result).toEqual({ notFound: true });
    expect(vaultMocks.getPublicNotes).not.toHaveBeenCalled();
    expect(vaultMocks.getVaultTaxonomy).not.toHaveBeenCalled();
    expect(vaultMocks.getVaultConfig).not.toHaveBeenCalled();
  });

  test("/blog/[slug] generates no paths without reading the vault", async () => {
    const result = await getBlogSlugStaticPaths({} as GetStaticPathsContext);

    expect(result).toEqual({ paths: [], fallback: false });
    expect(vaultMocks.getPublicNotes).not.toHaveBeenCalled();
  });

  test("/blog/[slug] returns notFound before reading params or the vault", async () => {
    const context = Object.defineProperty({}, "params", {
      get: () => {
        throw new Error("disabled blog route read params");
      },
    }) as GetStaticPropsContext;

    const result = await getBlogSlugStaticProps(context);

    expect(result).toEqual({ notFound: true });
    expect(vaultMocks.getNoteBySlug).not.toHaveBeenCalled();
  });
});
