/**
 * Class names and geometry for the DOM that `components/PortfolioCardGrid.tsx`
 * renders. Callers that measure the grid go through here so a rename in the
 * component is a compile-time break rather than a silent mis-measurement.
 */
export const PORTFOLIO_CARD_GRID_CLASS = "portfolioCardGrid";
export const PORTFOLIO_CARD_CLASS = "portfolioCard";

/** Offset of the grid's final card row from the grid's own top, in pixels. */
export const getLastGridRowTop = (grid: HTMLElement): number => {
  const lastCard = grid.querySelector<HTMLElement>(
    `:scope > .${PORTFOLIO_CARD_CLASS}:last-of-type`,
  );
  if (!lastCard) return 0;

  return Math.max(0, lastCard.getBoundingClientRect().top - grid.getBoundingClientRect().top);
};
