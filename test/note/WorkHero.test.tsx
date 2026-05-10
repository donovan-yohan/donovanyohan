/**
 * test/note/WorkHero.test.tsx — tests for the WorkHero component.
 *
 * Tests:
 *   - Renders banner.light image when provided.
 *   - Renders spacer when no banner is provided.
 *   - Renders subtitle as a paragraph when provided.
 *   - Renders info[] as a list.
 *   - Info items with href render as links; items without href render as text.
 *   - Works with no optional props (only title required).
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { WorkHero } from "../../components/note/WorkHero";

describe("WorkHero", () => {
  it("renders the title", () => {
    const { container } = render(<WorkHero title="My Work" />);
    const heading = container.querySelector("h1");
    expect(heading).toBeTruthy();
    expect(heading?.textContent).toContain("My Work");
  });

  it("renders banner.light image when provided", () => {
    const { container } = render(
      <WorkHero
        title="Work Page"
        banner={{ light: "/img/banners/my-project.jpg" }}
      />
    );
    // next/image renders an img element
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    // The src attribute for next/image may be encoded, just check it exists
    expect(img?.getAttribute("alt")).toBe("Work Page");
  });

  it("renders spacer div when no banner is provided", () => {
    const { container } = render(<WorkHero title="No Banner" />);
    const img = container.querySelector("img");
    // No image when no banner
    expect(img).toBeNull();
    // Spacer element should exist
    const spacer = container.querySelector(".note-workhero-spacer");
    expect(spacer).toBeTruthy();
  });

  it("renders subtitle as a paragraph when provided", () => {
    const { container } = render(
      <WorkHero title="Work" subtitle="A great project" />
    );
    const subtitle = container.querySelector(".note-workhero-subtitle");
    expect(subtitle).toBeTruthy();
    expect(subtitle?.textContent).toBe("A great project");
  });

  it("does not render subtitle element when absent", () => {
    const { container } = render(<WorkHero title="Work" />);
    const subtitle = container.querySelector(".note-workhero-subtitle");
    expect(subtitle).toBeNull();
  });

  it("renders info[] as a list", () => {
    const info = [
      { label: "Designer" },
      { label: "2026" },
      { label: "GitHub", href: "https://github.com/example" },
    ];
    const { container } = render(<WorkHero title="Work" info={info} />);
    const items = container.querySelectorAll(".note-workhero-info li");
    expect(items.length).toBe(3);
  });

  it("renders info items with href as anchor links", () => {
    const info = [{ label: "GitHub", href: "https://github.com/example" }];
    const { container } = render(<WorkHero title="Work" info={info} />);
    const link = container.querySelector(".note-workhero-info-link");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("https://github.com/example");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link?.textContent).toBe("GitHub");
  });

  it("renders info items without href as plain text", () => {
    const info = [{ label: "Product Designer" }];
    const { container } = render(<WorkHero title="Work" info={info} />);
    const link = container.querySelector(".note-workhero-info-link");
    expect(link).toBeNull();
    const items = container.querySelectorAll(".note-workhero-info li");
    expect(items[0]?.textContent).toBe("Product Designer");
  });

  it("renders with no optional props (title only)", () => {
    const { container } = render(<WorkHero title="Minimal" />);
    expect(container.querySelector("h1")).toBeTruthy();
    expect(container.querySelector(".note-workhero-subtitle")).toBeNull();
    expect(container.querySelector(".note-workhero-info")).toBeNull();
  });

  it("renders bgColor.light as background-color on the banner wrapper", () => {
    const { container } = render(
      <WorkHero
        title="Colored Banner"
        banner={{ light: "/img/banner.jpg" }}
        bgColor={{ light: "#ffaabb" }}
      />
    );
    const bannerDiv = container.querySelector(".note-workhero-banner");
    expect(bannerDiv).toBeTruthy();
    expect((bannerDiv as HTMLElement)?.style.backgroundColor).toBe("rgb(255, 170, 187)");
  });
});
