import { describe, expect, it } from "vitest";
import { normalizeArticleImageSrc } from "../components/articleimage";
import { shopdonovanyohanInfo } from "../global/content";
import links, { projects, socialLinks, MobileWidth } from "../global/global";
import { getAbsoluteSiteUrl, siteMetadata } from "../global/site";

describe("article image src normalization", () => {
  it("keeps valid image src values and normalizes public img paths", () => {
    expect(normalizeArticleImageSrc("/img/photos/work/dy-problem.png")).toBe(
      "/img/photos/work/dy-problem.png"
    );
    expect(normalizeArticleImageSrc("img/photos/work/dy-problem.png")).toBe(
      "/img/photos/work/dy-problem.png"
    );
    expect(normalizeArticleImageSrc("https://example.com/image.png")).toBe(
      "https://example.com/image.png"
    );
    expect(normalizeArticleImageSrc("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(normalizeArticleImageSrc("blob:https://example.com/image-id")).toBe(
      "blob:https://example.com/image-id"
    );
  });

  it("rejects empty, placeholder, and non-public relative image src values", () => {
    expect(normalizeArticleImageSrc()).toBeNull();
    expect(normalizeArticleImageSrc("")).toBeNull();
    expect(normalizeArticleImageSrc("src")).toBeNull();
    expect(normalizeArticleImageSrc("SRC")).toBeNull();
    expect(normalizeArticleImageSrc("photos/work/example.png")).toBeNull();
  });
});

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
