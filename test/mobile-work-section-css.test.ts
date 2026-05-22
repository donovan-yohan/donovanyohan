import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (filePath: string) => readFileSync(filePath, "utf8");

describe("mobile work section layout", () => {
  test("month anchors expose stable classes for mobile sticky headers", () => {
    const source = read("components/lab/system/MarginAnchor.tsx");

    expect(source).toContain("marginAnchor");
    expect(source).toContain("marginAnchorInner");
  });

  test("notebook stacks month grids and turns side labels into sticky headers on mobile", () => {
    const source = read("components/lab/Notebook.tsx");

    expect(source).toContain(".monthSection .marginAnchor");
    expect(source).toContain(".monthSection .marginAnchorInner");
    expect(source).toContain("--grid-template-columns: minmax(0, 1fr);");
    expect(source).toContain("--grid-column: auto;");
    expect(source).toContain("--grid-row: auto;");
    expect(source).not.toContain("!important");
  });

  test("homepage removes the desktop side gutter from the work section on mobile", () => {
    const source = read("pages/index.tsx");

    expect(source).toContain("--gutter-w: 0px;");
    expect(source).toContain(".historyFrame::before,");
    expect(source).toContain(".historyFrame::after");
    expect(source).toContain("display: none;");
  });
});
