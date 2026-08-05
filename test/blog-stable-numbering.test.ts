// @vitest-environment node

/**
 * Card numbers are an identity, not a list position: the oldest published post
 * is #001 forever and a new post takes the next number instead of pushing the
 * whole archive down one.
 */

import type { GetStaticPropsContext } from "next";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { VaultNote } from "../lib/vault/schema";

const vaultMocks = vi.hoisted(() => ({
  getNoteBySlug: vi.fn(),
  getPublicNotes: vi.fn(),
  getVaultConfig: vi.fn(),
  getVaultTaxonomy: vi.fn(),
}));

// The page reads the vault through the barrel; the numbering helpers it also
// imports from there stay real so this exercises the shipped rule.
vi.mock("../lib/vault", async () => {
  const stableIndex = await import("../lib/vault/stable-index");
  return { ...vaultMocks, ...stableIndex };
});

// Numbering is orthogonal to the release flag; force the route on so the
// assertions don't depend on the flag's current value.
vi.mock("../lib/flags", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/flags")>()),
  BLOG_PAGE_ENABLED: true,
}));

vi.mock("next/font/google", () => ({
  Geist_Mono: () => ({ className: "geist-mono" }),
  Crimson_Pro: () => ({ className: "crimson-pro" }),
  Caveat: () => ({ className: "caveat" }),
}));

import { stableIndexBySlug } from "../lib/vault/stable-index";
import { getStaticProps } from "../pages/blog";

const note = (
  slug: string,
  date: string,
  type: VaultNote["frontmatter"]["type"] = "writing",
): VaultNote => ({
  slug,
  path: `notes/${type}/${slug}.md`,
  frontmatter: {
    title: slug,
    date,
    visibility: "public",
    type,
    tags: [],
  },
  body: "<p>body</p>",
  bodyMarkdown: "body",
  preview: { kind: "text", span: 3, headline: slug, excerpt: "excerpt" },
});

const numbersFor = async (notes: VaultNote[]) => {
  vaultMocks.getPublicNotes.mockResolvedValue(notes);
  vaultMocks.getVaultTaxonomy.mockResolvedValue({ tags: {} });
  vaultMocks.getVaultConfig.mockReturnValue({ source: "local", path: "/tmp/vault" });

  const result = await getStaticProps({} as GetStaticPropsContext);
  if (!("props" in result)) throw new Error("expected /blog to render props");

  return result.props.cards.map((card) => [card.id, card.indexLabel] as const);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("stableIndexBySlug", () => {
  test("numbers notes 1-based oldest-first regardless of input order", () => {
    const index = stableIndexBySlug([
      note("newest", "2026-05-20"),
      note("oldest", "2026-04-03"),
      note("middle", "2026-05-04"),
    ]);

    expect([...index.entries()].sort()).toEqual([
      ["middle", 2],
      ["newest", 3],
      ["oldest", 1],
    ]);
  });

  test("breaks same-day ties by slug so the ordering is deterministic", () => {
    const index = stableIndexBySlug([
      note("beta", "2026-04-03"),
      note("alpha", "2026-04-03"),
    ]);

    expect(index.get("alpha")).toBe(1);
    expect(index.get("beta")).toBe(2);
  });
});

describe("/blog card numbering", () => {
  test("oldest post is #001 while the list still renders newest-first", async () => {
    expect(
      await numbersFor([
        note("middle", "2026-05-04"),
        note("newest", "2026-05-20"),
        note("oldest", "2026-04-03"),
      ]),
    ).toEqual([
      ["newest", "#003"],
      ["middle", "#002"],
      ["oldest", "#001"],
    ]);
  });

  test("publishing a new post never renumbers the existing archive", async () => {
    const archive = [
      note("oldest", "2026-04-03"),
      note("middle", "2026-05-04"),
      note("newest", "2026-05-20"),
    ];

    const before = new Map(await numbersFor(archive));
    const after = new Map(await numbersFor([...archive, note("fresh", "2026-06-01")]));

    for (const [slug, label] of before) {
      expect(after.get(slug)).toBe(label);
    }
    expect(after.get("fresh")).toBe("#004");
  });

  test("numbers only the posts this index publishes, so the run has no gaps", async () => {
    // Plain `note` entries without a blog opt-in never get a card, so they must
    // not burn an entry number either.
    expect(
      await numbersFor([
        note("scratch-a", "2026-04-01", "note"),
        note("scratch-b", "2026-04-02", "note"),
        note("first-post", "2026-04-03"),
        note("second-post", "2026-04-08"),
      ]),
    ).toEqual([
      ["second-post", "#002"],
      ["first-post", "#001"],
    ]);
  });
});
