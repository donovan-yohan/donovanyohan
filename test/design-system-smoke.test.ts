import { describe, expect, it } from "vitest";
import links, { projects, socialLinks, MobileWidth } from "../global/global";

describe("portfolio data smoke test", () => {
  it("keeps navigation and project content available", () => {
    expect(links.length).toBeGreaterThan(0);
    expect(socialLinks.length).toBeGreaterThan(0);
    expect(projects.some((project) => project.label === "donovanyohan.com")).toBe(true);
    expect(MobileWidth).toBe(1024);
  });
});
