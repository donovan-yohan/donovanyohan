import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Grid, GridItem } from "../components/lab/system/Grid";
import { MarginAnchor } from "../components/lab/system/MarginAnchor";

describe("lab layout primitives", () => {
  test("MarginAnchor exposes CSS variable fallbacks for responsive overrides", () => {
    const { container } = render(<MarginAnchor>Month</MarginAnchor>);
    const outer = container.querySelector(".marginAnchor");
    const inner = container.querySelector(".marginAnchorInner");

    expect(outer?.getAttribute("style")).toContain(
      "position: var(--margin-anchor-position, sticky);",
    );
    expect(outer?.getAttribute("style")).toContain(
      "top: var(--margin-anchor-top, calc(4 * var(--u)));",
    );
    expect(inner?.getAttribute("style")).toContain(
      "width: var(--margin-anchor-inner-width, var(--gutter-w));",
    );
  });

  test("Grid exposes CSS variable fallbacks for mobile stacking", () => {
    const { getByTestId } = render(
      <Grid cols={3} rows={2} data-testid="grid">
        <GridItem colSpan={2} rowSpan={3} data-testid="cell" />
      </Grid>,
    );

    expect(getByTestId("grid").getAttribute("style")).toContain(
      "grid-template-columns: var(--grid-template-columns, repeat(3, minmax(0, 1fr)));",
    );
    expect(getByTestId("grid").getAttribute("style")).toContain(
      "grid-template-rows: var(--grid-template-rows, repeat(2, minmax(min-content, auto)));",
    );
    expect(getByTestId("cell").getAttribute("style")).toContain(
      "grid-column: var(--grid-column, span 2);",
    );
    expect(getByTestId("cell").getAttribute("style")).toContain(
      "grid-row: var(--grid-row, span 3);",
    );
  });
});
