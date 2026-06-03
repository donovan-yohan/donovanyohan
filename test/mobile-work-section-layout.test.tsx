import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";

import Notebook, { type NotebookMonth } from "../components/lab/Notebook";
import { MarginAnchor } from "../components/lab/system/MarginAnchor";

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
});

const months: NotebookMonth[] = [
  {
    key: "2026-05",
    monthLabel: "MAY",
    year: "2026",
    rows: [
      {
        cols: 2,
        cells: [
          {
            entry: {
              id: "agents-loop",
              date: "2026-05-09",
              index: 1,
              type: "essay",
              title: "Shipping with agents in the loop.",
              blurb: "A working note.",
              read: "7 min",
              tags: ["memory"],
            },
          },
        ],
      },
    ],
  },
];

describe("mobile work section layout", () => {
  test("margin anchors expose css-variable hooks for full-bleed sticky rows", () => {
    const { container } = render(
      <MarginAnchor className="mono">
        <span>MAY</span>
      </MarginAnchor>,
    );

    const anchor = container.querySelector<HTMLElement>(".marginAnchor");
    const inner = container.querySelector<HTMLElement>(".marginAnchorInner");

    expect(anchor).not.toBeNull();
    expect(anchor?.style.marginLeft).toBe(
      "var(--margin-anchor-margin-left, calc(-1 * var(--content-pad-left)))",
    );
    expect(anchor?.style.marginRight).toBe("var(--margin-anchor-margin-right, 0)");
    expect(inner?.style.padding).toBe("var(--margin-anchor-inner-padding)");
  });

  test("notebook renders mobile filter and month-header landmarks without source-code assertions", () => {
    const { container } = render(
      <Notebook
        monoClass="mono"
        serifClass="serif"
        italicSerifClass="italic"
        months={months}
        tagFilters={[
          { slug: "memory", label: "Memory" },
          { slug: "private-only", label: "Private Only" },
        ]}
        cardHrefBuilder={(entry) => `/work/${entry.id}`}
      />,
    );

    expect(screen.getByRole("button", { name: /all/i })).toHaveClass("chipActive");
    expect(screen.getByRole("button", { name: /article/i })).toHaveClass("chip");
    expect(screen.getByRole("button", { name: /memory/i })).toHaveClass("chipTag");
    expect(screen.queryByRole("button", { name: /private only/i })).toBeNull();
    expect(screen.getByText("MAY")).toHaveClass("monthName");
    expect(container.querySelector(".chipsBar")).not.toBeNull();
    expect(container.querySelector(".notebookStack")).toHaveStyle({
      gap: "var(--notebook-stack-gap, var(--u))",
    });
    expect(container.querySelector(".monthSection .marginAnchorInner")).not.toBeNull();
    expect(screen.getByRole("link", { name: /shipping with agents/i })).toHaveAttribute(
      "href",
      "/work/agents-loop",
    );
  });
});
