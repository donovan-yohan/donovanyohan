import { describe, expect, test } from "vitest";

import { resolveContentAwareDensity } from "../components/lab/HatchScene";

describe("resolveContentAwareDensity", () => {
  test("raises default resting density and caps peak density for compact content boxes", () => {
    const compact = resolveContentAwareDensity({
      contentWidth: 640,
      contentHeight: 340,
      baseDensity: 0,
      peakDensity: 1,
      autoBaseDensity: true,
      autoPeakDensity: true,
    });

    expect(compact.shortSide).toBe(340);
    expect(compact.baseDensity).toBeCloseTo(0.48, 5);
    expect(compact.peakDensity).toBeCloseTo(0.78, 5);
  });

  test("keeps desktop-sized defaults unchanged", () => {
    const desktop = resolveContentAwareDensity({
      contentWidth: 1024,
      contentHeight: 800,
      baseDensity: 0,
      peakDensity: 1,
      autoBaseDensity: true,
      autoPeakDensity: true,
    });

    expect(desktop.baseDensity).toBe(0);
    expect(desktop.peakDensity).toBe(1);
  });

  test("does not override explicit density controls", () => {
    const explicit = resolveContentAwareDensity({
      contentWidth: 320,
      contentHeight: 240,
      baseDensity: 0.2,
      peakDensity: 0.95,
      autoBaseDensity: false,
      autoPeakDensity: false,
    });

    expect(explicit.baseDensity).toBe(0.2);
    expect(explicit.peakDensity).toBe(0.95);
  });
});
