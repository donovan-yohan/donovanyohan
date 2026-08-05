import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist_Mono: () => ({ className: "geist-mono" }),
  Crimson_Pro: () => ({ className: "crimson-pro" }),
  Caveat: () => ({ className: "caveat" }),
}));

import PortfolioCardGrid, { type PortfolioCardItem } from "../components/PortfolioCardGrid";

const item = (over: Partial<PortfolioCardItem> = {}): PortfolioCardItem => ({
  id: "typed-not-day",
  indexLabel: "#001",
  categoryLabel: "article",
  title: "Typed, Not Day",
  blurb: "",
  accent: "#78dcff",
  ...over,
});

const renderGrid = (items: PortfolioCardItem[]) =>
  render(<PortfolioCardGrid items={items} ariaLabel="cards" />);

describe("portfolio card cover fallback", () => {
  test("renders the flat dot-grid placeholder instead of a letter monogram", () => {
    const { container } = renderGrid([item()]);

    const placeholder = container.querySelector(".portfolioCardPlaceholder");
    expect(placeholder).not.toBeNull();
    expect(container.querySelector(".portfolioCardMonogram")).toBeNull();
    expect(container.querySelector(".portfolioCardCover img")).toBeNull();

    // No letters derived from the title — the mark is drawn, never spelled.
    expect(placeholder?.textContent).toBe("");
    expect(placeholder?.querySelector(".portfolioCardPlaceholderTint")).not.toBeNull();
    expect(placeholder?.querySelector(".portfolioCardPlaceholderDots")).not.toBeNull();
    expect(placeholder?.querySelector("svg.portfolioCardPlaceholderMark")).not.toBeNull();
  });

  test("picks the type mark from the card's category label", () => {
    const cases: Array<[string, string]> = [
      ["article", "article"],
      ["case study", "work"],
      ["work", "work"],
      ["share", "share"],
      ["photo", "photo"],
      ["video", "video"],
      ["quote", "quote"],
      ["note", "note"],
      ["something else", "note"],
    ];

    for (const [categoryLabel, glyph] of cases) {
      const { container, unmount } = renderGrid([item({ categoryLabel })]);
      expect(container.querySelector(".portfolioCardPlaceholder")?.getAttribute("data-glyph")).toBe(
        glyph,
      );
      unmount();
    }
  });

  test("the placeholder stays theme-driven: ink strokes plus the card accent", () => {
    const { container } = renderGrid([item({ accent: "#ff82c8" })]);

    const glyph = container.querySelector(".portfolioCardPlaceholderGlyph");
    expect(glyph?.getAttribute("stroke")).toBe("var(--ink)");
    expect(container.querySelector(".portfolioCardPlaceholderTick")).not.toBeNull();
    expect(container.querySelector(".portfolioCard")?.getAttribute("style")).toContain(
      "--portfolio-card-accent: #ff82c8",
    );
  });

  test("real artwork still wins the fallback chain", () => {
    const single = renderGrid([item({ image: "/vault-assets/cover.png" })]);
    expect(single.container.querySelector(".portfolioCardPlaceholder")).toBeNull();
    expect(single.container.querySelectorAll(".portfolioCardImage")).toHaveLength(1);
    single.unmount();

    const paired = renderGrid([
      item({ imageLight: "/light.png", imageDark: "/dark.png", image: "/fallback.png" }),
    ]);
    expect(paired.container.querySelector(".portfolioCardPlaceholder")).toBeNull();
    expect(paired.container.querySelectorAll(".portfolioCardImage")).toHaveLength(2);
  });
});
