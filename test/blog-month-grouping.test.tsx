import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist_Mono: () => ({ className: "geist-mono" }),
  Crimson_Pro: () => ({ className: "crimson-pro" }),
  Caveat: () => ({ className: "caveat" }),
}));

// The page imports the vault barrel at module scope for getStaticProps only;
// the component under test never touches it.
vi.mock("../lib/vault", () => ({
  getNoteBySlug: vi.fn(),
  getPublicNotes: vi.fn(),
  getVaultConfig: vi.fn(),
  getVaultTaxonomy: vi.fn(),
}));

import BlogIndex from "../pages/blog";

type BlogIndexProps = Parameters<typeof BlogIndex>[0];
type BlogCard = BlogIndexProps["cards"][number];

const card = (over: Partial<BlogCard> & Pick<BlogCard, "id" | "date">): BlogCard => ({
  indexLabel: "#001",
  categoryLabel: "article",
  metaLabel: "05/27/26",
  title: `Post ${over.id}`,
  blurb: "",
  tags: [],
  accent: "#78dcff",
  footerLabel: "3 MIN READ",
  typeKey: "article",
  tagSlugs: [],
  ...over,
});

const cards: BlogCard[] = [
  card({ id: "may-a", date: "2026-05-20" }),
  card({ id: "may-b", date: "2026-05-04", typeKey: "share", categoryLabel: "share" }),
  card({ id: "apr-a", date: "2026-04-18", tagSlugs: ["memory"] }),
  card({ id: "mar-a", date: "2026-03-02", typeKey: "share", categoryLabel: "share" }),
];

const renderIndex = () =>
  render(
    <BlogIndex
      cards={cards}
      notebookTagFilters={[{ slug: "memory", label: "Memory" }]}
      vaultSha="test"
      vaultConfigured
    />,
  );

const readMonths = (container: HTMLElement) =>
  [...container.querySelectorAll(".blogMonth")].map((section) => ({
    label: section.querySelector(".blogMonthName")?.textContent,
    year: section.querySelector(".blogMonthYear")?.textContent,
    count: section.querySelector(".blogMonthCount")?.textContent?.replace(/\s+/g, " ").trim(),
    cards: [...section.querySelectorAll(".portfolioCard")].length,
  }));

const readIndexLabels = (container: HTMLElement) =>
  [...container.querySelectorAll(".portfolioCardTopLeft span:first-child")].map(
    (span) => span.textContent,
  );

afterEach(() => vi.unstubAllGlobals());

describe("blog index month grouping", () => {
  test("groups cards into newest-first month blocks with margin-rail headers", () => {
    const { container } = renderIndex();

    expect(readMonths(container)).toEqual([
      { label: "MAY", year: "2026", count: "2 entries", cards: 2 },
      { label: "APR", year: "2026", count: "1 entry", cards: 1 },
      { label: "MAR", year: "2026", count: "1 entry", cards: 1 },
    ]);

    // Each month owns a MarginAnchor rail inside its own sticky zone, and the
    // cards keep the shared portfolio card format rather than notebook cells.
    expect(container.querySelectorAll(".blogMonthStickyZone .marginAnchorInner")).toHaveLength(3);
    expect(container.querySelectorAll(".blogMonthStickyZone .portfolioCardGrid")).toHaveLength(3);
    expect(container.querySelector(".blogMonth .portfolioCardTitle")).not.toBeNull();

    const firstSection = container.querySelector(".blogMonth");
    expect(firstSection?.getAttribute("aria-labelledby")).toBe(
      firstSection?.querySelector(".blogMonthName")?.id,
    );
  });

  test("type and tag filters thin months and drop emptied ones instead of flattening", () => {
    const { container, getByRole } = renderIndex();

    fireEvent.click(getByRole("button", { name: /share/i }));
    expect(readMonths(container)).toEqual([
      { label: "MAY", year: "2026", count: "1 entry", cards: 1 },
      { label: "MAR", year: "2026", count: "1 entry", cards: 1 },
    ]);

    fireEvent.click(getByRole("button", { name: /memory/i }));
    expect(readMonths(container)).toEqual([
      { label: "APR", year: "2026", count: "1 entry", cards: 1 },
    ]);

    fireEvent.click(getByRole("button", { name: /all/i }));
    expect(readMonths(container)).toHaveLength(3);
  });

  test("each card keeps its own stable number through month blocks and filters", () => {
    // Numbers belong to the note (oldest post = #001), so grouping and
    // filtering must never renumber what stays on screen.
    const numbered: BlogCard[] = [
      card({ id: "may-a", date: "2026-05-20", indexLabel: "#004" }),
      card({
        id: "may-b",
        date: "2026-05-04",
        indexLabel: "#003",
        typeKey: "share",
        categoryLabel: "share",
      }),
      card({ id: "apr-a", date: "2026-04-18", indexLabel: "#002", tagSlugs: ["memory"] }),
      card({
        id: "mar-a",
        date: "2026-03-02",
        indexLabel: "#001",
        typeKey: "share",
        categoryLabel: "share",
      }),
    ];

    const { container, getByRole } = render(
      <BlogIndex
        cards={numbered}
        notebookTagFilters={[{ slug: "memory", label: "Memory" }]}
        vaultSha="test"
        vaultConfigured
      />,
    );

    expect(readIndexLabels(container)).toEqual(["#004", "#003", "#002", "#001"]);

    fireEvent.click(getByRole("button", { name: /share/i }));
    expect(readIndexLabels(container)).toEqual(["#003", "#001"]);

    fireEvent.click(getByRole("button", { name: /memory/i }));
    expect(readIndexLabels(container)).toEqual(["#002"]);
  });

  test("keeps the chip rail pinned above the month rails", () => {
    const { container } = renderIndex();

    // Chips are a sibling of the month list, not nested in the intro band, so
    // their sticky range spans the whole timeline.
    const frame = container.querySelector(".blogFrame");
    const filters = container.querySelector(".blogFilters");
    expect(filters?.parentElement).toBe(frame);
    expect(container.querySelector(".blogFilters .blogFiltersInner .blogChip")).not.toBeNull();
  });

  test("measures the filter bar into the month rail's scoped sticky geometry", () => {
    class ResizeObserverMock {
      static instances: ResizeObserverMock[] = [];
      readonly observed: Element[] = [];

      constructor(readonly callback: ResizeObserverCallback) {
        ResizeObserverMock.instances.push(this);
      }

      observe(element: Element) {
        this.observed.push(element);
      }

      disconnect() {}
    }

    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    const { container } = renderIndex();
    const frame = container.querySelector<HTMLElement>(".blogFrame");
    const filters = container.querySelector<HTMLElement>(".blogFilters");
    const observer = ResizeObserverMock.instances.find((instance) =>
      instance.observed.includes(filters!),
    );

    expect(frame).not.toBeNull();
    expect(filters).not.toBeNull();
    expect(observer).toBeDefined();

    filters!.getBoundingClientRect = () => ({ height: 117.2 }) as DOMRect;
    observer!.callback([], observer! as unknown as ResizeObserver);

    expect(frame!.style.getPropertyValue("--blog-filter-height")).toBe("118px");
  });

  test("falls back to the empty state when a filter matches nothing", () => {
    const { container, getByRole } = render(
      <BlogIndex
        cards={[]}
        notebookTagFilters={[]}
        vaultSha="test"
        vaultConfigured={false}
      />,
    );

    expect(container.querySelectorAll(".blogMonth")).toHaveLength(0);
    expect(container.querySelector(".portfolioCardEmpty")?.textContent).toContain(
      "vault not configured",
    );
    expect(getByRole("button", { name: /all/i })).toHaveClass("blogChipActive");
  });
});
