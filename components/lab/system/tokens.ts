export const UNIT_PX = 16;

export const U = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  20: 20,
  24: 24,
} as const;

export type Units = keyof typeof U;

export const ux = (n: Units): string => `calc(${U[n]} * var(--u))`;
