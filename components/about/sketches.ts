/**
 * Inline SVG path data for the about-page placeholder doodles. Each sketch
 * is a list of paths drawn into a unit-ish viewBox so they can be scaled
 * to any size and re-rendered through roughjs for the hand-drawn look.
 *
 * Keep paths short and segmented — roughjs adds its own wobble per path,
 * so simpler input produces cleaner rough output.
 */

import type { SketchKey } from "../../global/timeline";

export interface SketchSpec {
  viewBox: string;
  paths: string[];
}

export const sketches: Record<SketchKey, SketchSpec> = {
  star: {
    viewBox: "0 0 100 100",
    paths: [
      "M 50 8 L 61 39 L 94 39 L 67 59 L 78 92 L 50 72 L 22 92 L 33 59 L 6 39 L 39 39 Z",
    ],
  },
  cat: {
    viewBox: "0 0 100 100",
    paths: [
      "M 18 78 C 18 50, 28 38, 50 38 C 72 38, 82 50, 82 78 Z",
      "M 24 42 L 18 22 L 36 36",
      "M 76 42 L 82 22 L 64 36",
      "M 40 60 L 42 64",
      "M 60 60 L 58 64",
      "M 46 70 C 48 74, 52 74, 54 70",
      "M 50 66 L 50 70",
    ],
  },
  arrow: {
    viewBox: "0 0 120 60",
    paths: [
      "M 8 30 C 30 10, 60 50, 95 28",
      "M 86 18 L 100 28 L 88 38",
    ],
  },
  asterisk: {
    viewBox: "0 0 100 100",
    paths: [
      "M 50 12 L 50 88",
      "M 16 50 L 84 50",
      "M 24 24 L 76 76",
      "M 76 24 L 24 76",
    ],
  },
  frame: {
    viewBox: "0 0 120 90",
    paths: [
      "M 8 10 L 112 10 L 112 80 L 8 80 Z",
      "M 8 10 L 112 80",
      "M 112 10 L 8 80",
    ],
  },
  sparkle: {
    viewBox: "0 0 100 100",
    paths: [
      "M 50 18 C 50 36, 50 42, 50 50 C 50 42, 56 42, 82 50 C 56 50, 50 50, 50 50 C 50 58, 50 64, 50 82 C 50 64, 44 58, 18 50 C 44 50, 50 50, 50 50 Z",
      "M 78 20 L 86 28",
      "M 16 78 L 24 86",
    ],
  },
  heart: {
    viewBox: "0 0 100 100",
    paths: [
      "M 50 82 C 18 60, 12 36, 28 24 C 40 16, 50 28, 50 36 C 50 28, 60 16, 72 24 C 88 36, 82 60, 50 82 Z",
    ],
  },
  squiggle: {
    viewBox: "0 0 140 40",
    paths: [
      "M 6 24 C 18 6, 26 38, 40 22 C 54 6, 62 38, 76 22 C 90 6, 98 38, 112 22 C 122 14, 130 22, 134 22",
    ],
  },
  diamond: {
    viewBox: "0 0 100 120",
    paths: [
      "M 50 6 L 88 44 L 50 114 L 12 44 Z",
      "M 12 44 L 88 44",
      "M 30 24 L 50 44",
      "M 70 24 L 50 44",
    ],
  },
  spiral: {
    viewBox: "0 0 100 100",
    paths: [
      "M 50 50 C 56 50, 56 44, 50 44 C 42 44, 42 56, 50 56 C 62 56, 62 38, 50 38 C 34 38, 34 62, 50 62 C 70 62, 70 32, 50 32 C 26 32, 26 68, 50 68",
    ],
  },
};
