import { describe, expect, test } from "vitest";

import { measuredStickyHeight } from "../lib/blog-month-sticky-geometry";
import { PORTFOLIO_CARD_CLASS, getLastGridRowTop } from "../lib/portfolio-card-grid-geometry";

const rectAt =
  (top: number) =>
  (): DOMRect =>
    ({ top }) as DOMRect;

/** Builds a grid whose top is the first card's top, as a real flow layout would. */
const makeGrid = (...cardTops: number[]) => {
  const grid = document.createElement("div");
  grid.getBoundingClientRect = rectAt(cardTops[0] ?? 0);

  for (const top of cardTops) {
    const card = document.createElement("article");
    card.className = PORTFOLIO_CARD_CLASS;
    card.getBoundingClientRect = rectAt(top);
    grid.append(card);
  }

  return grid;
};

describe("blog month sticky track", () => {
  test("rounds a measured filter height up so the sticky rail cannot overlap it", () => {
    expect(measuredStickyHeight(57.1)).toBe(58);
    expect(measuredStickyHeight(57)).toBe(57);
    expect(measuredStickyHeight(-1)).toBe(0);
    expect(measuredStickyHeight(Number.NaN)).toBe(0);
  });

  test("has no sticky travel when the final card is in the first row", () => {
    expect(getLastGridRowTop(makeGrid(120))).toBe(0);
  });

  test("ends the sticky track at the top of the final card row", () => {
    expect(getLastGridRowTop(makeGrid(120, 660))).toBe(540);
  });

  test("has no sticky travel for an empty grid", () => {
    expect(getLastGridRowTop(makeGrid())).toBe(0);
  });
});
