import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { VaultNote } from "../lib/vault/schema";

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));
vi.mock("next/head", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/blog/[slug]", asPath: "/blog/revised-article" }),
}));
vi.mock("../components/SiteNav", () => ({
  default: () => null,
}));
vi.mock("../global/fonts", () => ({
  gm500: { className: "gm500" },
  gm800: { className: "gm800" },
  cp400: { className: "cp400" },
}));
vi.mock("../lib/vault", () => ({
  getNoteBySlug: vi.fn(),
  getPublicNotes: vi.fn(),
}));

import BlogSlug from "../pages/blog/[slug]";

const note = (updated: string, changeNote: string): VaultNote =>
  ({
    slug: "revised-article",
    body: "<p>Body</p>",
    preview: {
      kind: "text",
      excerpt: "Article summary",
      accent: "yellow",
    },
    frontmatter: {
      title: "Revised article",
      date: "2026-05-10",
      updated,
      changeNote,
      visibility: "public",
      type: "writing",
    },
  }) as VaultNote;

describe("blog article revision metadata", () => {
  test("renders a change note only for a later revision date", () => {
    const { rerender } = render(
      <BlogSlug note={note("2026-06-04", "Clarified the memory-cost ladder.")} />
    );

    expect(screen.getByText("Updated JUN 4, 2026")).toBeInTheDocument();
    expect(screen.getByText("Change note")).toBeInTheDocument();
    expect(screen.getByText(/Clarified the memory-cost ladder/)).toBeInTheDocument();

    rerender(<BlogSlug note={note("2026-05-10", "Should stay hidden.")} />);

    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
    expect(screen.queryByText("Change note")).not.toBeInTheDocument();
    expect(screen.queryByText(/Should stay hidden/)).not.toBeInTheDocument();
  });
});
