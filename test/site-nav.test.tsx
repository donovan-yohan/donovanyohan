import { render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist_Mono: () => ({ className: "geist-mono" }),
  Crimson_Pro: () => ({ className: "crimson-pro" }),
  Caveat: () => ({ className: "caveat" }),
}));

import Context from "../components/context";
import SiteNav from "../components/SiteNav";

describe("SiteNav", () => {
  test("includes Blog in desktop and mobile navigation with a six-column mobile grid", () => {
    const { container } = render(
      <Context.Provider value={{ theme: "light", toggleTheme: vi.fn() }}>
        <SiteNav current="work" />
      </Context.Provider>,
    );

    const desktopNav = container.querySelector(".navTabs");
    expect(desktopNav).not.toBeNull();
    expect(within(desktopNav as HTMLElement).getByRole("link", { name: "Blog" })).toHaveAttribute(
      "href",
      "/blog",
    );

    const mobileNav = container.querySelector('[aria-label="Mobile navigation"]');
    expect(mobileNav).not.toBeNull();
    expect((mobileNav as HTMLElement).querySelector('a[href="/blog"]')).not.toBeNull();
    expect((mobileNav as HTMLElement).querySelectorAll(".mobileNavItem")).toHaveLength(6);
    expect(mobileNav as HTMLElement).toHaveStyle({
      gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    });

    expect(within(desktopNav as HTMLElement).getByRole("link", { name: "Work" })).toHaveAttribute(
      "href",
      "/#work",
    );
    expect((mobileNav as HTMLElement).querySelector('a[aria-label="Work"]')).toHaveAttribute(
      "href",
      "/#work",
    );
  });

  test("renders a stable circular theme-toggle control", async () => {
    const toggleTheme = vi.fn();
    render(
      <Context.Provider value={{ theme: "light", toggleTheme }}>
        <SiteNav current="work" />
      </Context.Provider>,
    );

    const button = screen.getByRole("button", { name: "Switch to dark mode" });
    expect(button).toHaveClass("themeToggle");
    expect(button.querySelectorAll("svg")).toHaveLength(2);

    await button.click();
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  test("can render sticky when embedded in the homepage flow", () => {
    render(
      <Context.Provider value={{ theme: "dark", toggleTheme: vi.fn() }}>
        <SiteNav position="sticky" />
      </Context.Provider>,
    );

    expect(screen.getByRole("navigation")).toHaveClass("topnav-sticky");
  });
});
