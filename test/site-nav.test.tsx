import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist_Mono: () => ({ className: "geist-mono" }),
  Crimson_Pro: () => ({ className: "crimson-pro" }),
  Caveat: () => ({ className: "caveat" }),
}));

import Context from "../components/context";
import SiteNav from "../components/SiteNav";

describe("SiteNav", () => {
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
});
