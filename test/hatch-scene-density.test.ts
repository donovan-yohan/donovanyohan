import { describe, expect, test } from "vitest";

import { resolveContentAwareDensity } from "../components/lab/HatchScene";

describe("resolveContentAwareDensity", () => {
  test("tightens spacing and raises default resting density for compact content boxes", () => {
    const compact = resolveContentAwareDensity({
      contentWidth: 640,
      contentHeight: 340,
      hatchScale: 7,
      baseDensity: 0,
      peakDensity: 1,
      autoHatchScale: true,
      autoBaseDensity: true,
      autoPeakDensity: true,
    });

    expect(compact.shortSide).toBe(340);
    expect(compact.hatchScale).toBeCloseTo(5.04, 5);
    expect(compact.baseDensity).toBeCloseTo(0.48, 5);
    expect(compact.peakDensity).toBeCloseTo(0.96, 5);
  });

  test("keeps desktop-sized defaults unchanged", () => {
    const desktop = resolveContentAwareDensity({
      contentWidth: 1024,
      contentHeight: 800,
      hatchScale: 16,
      baseDensity: 0,
      peakDensity: 1,
      autoHatchScale: true,
      autoBaseDensity: true,
      autoPeakDensity: true,
    });

    expect(desktop.hatchScale).toBe(16);
    expect(desktop.baseDensity).toBe(0);
    expect(desktop.peakDensity).toBe(1);
  });

  test("does not override explicit density controls", () => {
    const explicit = resolveContentAwareDensity({
      contentWidth: 320,
      contentHeight: 240,
      hatchScale: 10,
      baseDensity: 0.2,
      peakDensity: 0.95,
      autoHatchScale: false,
      autoBaseDensity: false,
      autoPeakDensity: false,
    });

    expect(explicit.hatchScale).toBe(10);
    expect(explicit.baseDensity).toBe(0.2);
    expect(explicit.peakDensity).toBe(0.95);
  });
});
