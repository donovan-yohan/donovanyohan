/**
 * ResizeObserver reports fractional CSS pixels, while the sticky ceiling is
 * represented by a CSS custom property. Round up so the rail never overlaps
 * the filter bar because of a sub-pixel measurement.
 */
export const measuredStickyHeight = (height: number): number =>
  Number.isFinite(height) ? Math.max(0, Math.ceil(height)) : 0;
