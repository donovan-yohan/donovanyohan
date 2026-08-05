// @vitest-environment node

import type { GetStaticPathsContext, GetStaticPropsContext } from "next";
import { beforeEach, describe, expect, test, vi } from "vitest";

const vaultMocks = vi.hoisted(() => ({
  formatEntryNumber: vi.fn((index: number) => String(index).padStart(3, "0")),
  getNoteBySlug: vi.fn(),
  getPublicNotes: vi.fn(),
  getVaultConfig: vi.fn(),
  getVaultTaxonomy: vi.fn(),
  stableIndexBySlug: vi.fn(() => new Map<string, number>()),
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
  vaultMocks.getPublicNotes.mockResolvedValue([]);
  vaultMocks.getVaultTaxonomy.mockResolvedValue({ tags: {} });
  vaultMocks.getVaultConfig.mockReturnValue(null);
  vaultMocks.getNoteBySlug.mockResolvedValue(null);
});

describe("enabled blog feature flag", () => {
  test("enables the blog for the release candidate", () => {
    expect(BLOG_PAGE_ENABLED).toBe(true);
  });

  test("/blog reads the vault and returns an empty public index when unconfigured", async () => {
    const result = await getBlogIndexStaticProps({} as GetStaticPropsContext);

    expect(result).toMatchObject({
      props: {
        cards: [],
        notebookTagFilters: [],
        vaultConfigured: false,
      },
      revalidate: 1800,
    });
    expect(vaultMocks.getPublicNotes).toHaveBeenCalledOnce();
    expect(vaultMocks.getVaultTaxonomy).toHaveBeenCalledOnce();
    expect(vaultMocks.getVaultConfig).toHaveBeenCalledOnce();
  });

  test("/blog/[slug] generates paths from eligible vault notes", async () => {
    const result = await getBlogSlugStaticPaths({} as GetStaticPathsContext);

    expect(result).toEqual({ paths: [], fallback: false });
    expect(vaultMocks.getPublicNotes).toHaveBeenCalledOnce();
  });

  test("/blog/[slug] reads the requested slug and fails closed when it is missing", async () => {
    const context = { params: { slug: "missing" } } as GetStaticPropsContext;

    const result = await getBlogSlugStaticProps(context);

    expect(result).toEqual({ notFound: true });
    expect(vaultMocks.getNoteBySlug).toHaveBeenCalledWith("missing");
  });
});
