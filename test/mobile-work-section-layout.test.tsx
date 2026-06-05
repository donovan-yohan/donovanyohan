import { fireEvent, render, screen } from "@testing-library/react";
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
            colSpan: 3,
            rowSpan: 2,
            entry: {
              id: "agents-loop",
              date: "2026-05-09",
              index: 1,
              type: "essay",
              title: "Shipping with agents in the loop.",
              blurb: "A working note.",
              read: "7 min",
              image: "/vault-assets/agents-loop/cover.png",
              imageAlt: "Shipping with agents in the loop.",
              imageAspectRatio: "1376 / 768",
              tags: ["memory"],
            },
          },
          {
            entry: {
              id: "design-log",
              date: "2026-05-10",
              index: 2,
              type: "project",
              title: "A design log card.",
              blurb: "A project note.",
              meta: "project · draft",
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
    expect(inner?.style.padding).toBe(
      "var(--margin-anchor-inner-padding, 0 var(--margin-anchor-inner-padding-right, var(--gutter-pad)) 0 0)",
    );
    expect(inner?.style.boxSizing).toBe("border-box");
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
    expect(screen.getByRole("button", { name: /project/i })).toHaveClass("chip");
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

    fireEvent.click(screen.getByRole("button", { name: /article/i }));

    expect(screen.getByRole("button", { name: /article/i })).toHaveClass("chipActive");
    expect(screen.getByText("MAY")).toHaveClass("monthName");
    expect(screen.getByText("1 entry")).toHaveClass("monthCount");
    expect(screen.getByRole("link", { name: /shipping with agents/i })).toHaveAttribute(
      "href",
      "/work/agents-loop",
    );
    expect(screen.queryByRole("link", { name: /design log card/i })).toBeNull();
    expect(container.querySelector('.monthSection [data-cols="2"]')).not.toBeNull();
  });

  test("notebook keeps desktop spans as css variables and renders uncropped preview images", () => {
    const { container } = render(
      <Notebook
        monoClass="mono"
        serifClass="serif"
        italicSerifClass="italic"
        months={months}
        cardHrefBuilder={(entry) => `/work/${entry.id}`}
      />,
    );

    const card = container.querySelector<HTMLElement>('[data-entry-id="agents-loop"]');
    const image = screen.getByRole("img", {
      name: /shipping with agents in the loop/i,
    });

    expect(card?.style.getPropertyValue("--card-grid-column-desktop")).toBe("span 3");
    expect(card?.style.getPropertyValue("--card-grid-row-desktop")).toBe("span 2");
    expect(image).toHaveClass("cardCoverImage");
    expect(image).toHaveStyle({ objectFit: "contain" });
    expect(image.getAttribute("style")).toContain("--card-image-aspect: 1376 / 768");
  });
});
