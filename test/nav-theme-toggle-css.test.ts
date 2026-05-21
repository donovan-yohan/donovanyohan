import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const NAV_STYLE_FILES = [
  "pages/index.tsx",
  "components/SiteNav.tsx",
  "pages/work/[slug].tsx",
] as const;

function themeToggleBlock(source: string): string {
  const match = source.match(/\.themeToggle\s*\{([\s\S]*?)\n\s*\}/);
  return match?.[1] ?? "";
}

describe("theme toggle nav sizing", () => {
  test.each(NAV_STYLE_FILES)(
    "%s keeps the theme toggle circular in tight mobile nav layouts",
    (filePath) => {
      const block = themeToggleBlock(readFileSync(filePath, "utf8"));

      expect(block).toContain("width: 32px;");
      expect(block).toContain("height: 32px;");
      expect(block).toContain("flex: 0 0 32px;");
      expect(block).toContain("min-width: 32px;");
      expect(block).toContain("min-height: 32px;");
    },
  );
});
