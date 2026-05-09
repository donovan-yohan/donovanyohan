import { describe, expect, it } from "vitest";
import { normalizeArticleImageSrc } from "../components/articleimage";
import { shopdonovanyohanInfo } from "../global/content";
import links, { projects, socialLinks, MobileWidth } from "../global/global";
import { getAbsoluteSiteUrl, siteMetadata } from "../global/site";

describe("portfolio data smoke test", () => {
  it("keeps navigation and project content available", () => {
    expect(links.length).toBeGreaterThan(0);
    expect(socialLinks.length).toBeGreaterThan(0);
    expect(projects.some((project) => project.label === "donovanyohan.com")).toBe(true);
    expect(MobileWidth).toBe(1024);
    expect(siteMetadata.url).toBe("https://donovanyohan.com");
    expect(getAbsoluteSiteUrl(siteMetadata.ogImagePath)).toBe(
      "https://donovanyohan.com/ogimage.jpg"
    );
  });

  it("keeps icon font glyphs on nav and social links", () => {
    expect(links.every((link) => link.icon.length > 0)).toBe(true);
    expect(socialLinks.every((link) => link.icon.length > 0)).toBe(true);
  });

  it("uses fully qualified external portfolio links", () => {
    const externalLinks = shopdonovanyohanInfo.filter((item) => item.isLink);

    expect(externalLinks.every((item) => item.href?.startsWith("https://"))).toBe(true);
  });

  it("normalizes legacy ArticleImage sources without rendering placeholders", () => {
    expect(normalizeArticleImageSrc("src")).toBeNull();
    expect(normalizeArticleImageSrc("SRC")).toBeNull();
    expect(normalizeArticleImageSrc("img/photos/example.png")).toBe("/img/photos/example.png");
    expect(normalizeArticleImageSrc("/img/photos/example.png")).toBe("/img/photos/example.png");
  });
});
