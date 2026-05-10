/**
 * Tests for lib/vault/fail-closed.ts
 *
 * Exhaustively covers the resolveVisibility table from VAULT.md / AGENTS.md.
 * Each row in the table below is a discrete test case.
 *
 * Privacy boundary per P10. Fail-closed: anything not explicitly `public`
 * resolves to `private`.
 *
 * Table (source of truth):
 *   null                                                      → private
 *   undefined                                                 → private
 *   {}                                                        → private
 *   { visibility: undefined }                                 → private
 *   { visibility: null }                                      → private
 *   { visibility: 'private' }                                 → private
 *   { visibility: 'PUBLIC' }                                  → private (case mismatch)
 *   { visibility: 'public ' }                                 → private (whitespace)
 *   { visibility: ['public'] }                                → private (wrong type)
 *   { visibility: 'public' }                                  → private (missing title/date)
 *   { title: '', date: '2026-05-10', visibility: 'public' }   → private (empty title)
 *   { title: 'X', date: 'not-a-date', visibility: 'public' }  → private (bad date)
 *   { title: 'X', date: '2026-05-10', visibility: 'public' }  → public  (the only public)
 *   { title: 'X', date: '2026-05-10', visibility: 'public', mood: 'ok' } → public (passthrough)
 *   { title: 'X', date: new Date('2026-05-10'), visibility: 'public' }   → public (Date coercion P24)
 */

import { describe, expect, it } from "vitest";
import { resolveVisibility } from "../../lib/vault/fail-closed";

describe("resolveVisibility — fail-closed privacy boundary (P10)", () => {
  // ── Always private ──────────────────────────────────────────────────────────

  it("null → private", () => {
    expect(resolveVisibility(null)).toBe("private");
  });

  it("undefined → private", () => {
    expect(resolveVisibility(undefined)).toBe("private");
  });

  it("{} → private", () => {
    expect(resolveVisibility({})).toBe("private");
  });

  it("{ visibility: undefined } → private", () => {
    expect(resolveVisibility({ visibility: undefined })).toBe("private");
  });

  it("{ visibility: null } → private", () => {
    expect(resolveVisibility({ visibility: null })).toBe("private");
  });

  it("{ visibility: 'private' } → private", () => {
    expect(resolveVisibility({ visibility: "private" })).toBe("private");
  });

  it("{ visibility: 'PUBLIC' } → private (case mismatch)", () => {
    expect(resolveVisibility({ visibility: "PUBLIC" })).toBe("private");
  });

  it("{ visibility: 'public ' } → private (trailing whitespace)", () => {
    expect(resolveVisibility({ visibility: "public " })).toBe("private");
  });

  it("{ visibility: ['public'] } → private (wrong type — array)", () => {
    expect(resolveVisibility({ visibility: ["public"] })).toBe("private");
  });

  it("{ visibility: 'public' } → private (missing title and date)", () => {
    expect(resolveVisibility({ visibility: "public" })).toBe("private");
  });

  it("{ title: '', date: '2026-05-10', visibility: 'public' } → private (empty title)", () => {
    expect(
      resolveVisibility({ title: "", date: "2026-05-10", visibility: "public" }),
    ).toBe("private");
  });

  it("{ title: 'X', date: 'not-a-date', visibility: 'public' } → private (bad date)", () => {
    expect(
      resolveVisibility({ title: "X", date: "not-a-date", visibility: "public" }),
    ).toBe("private");
  });

  // ── Additional private edge cases ──────────────────────────────────────────

  it("number input → private", () => {
    expect(resolveVisibility(42)).toBe("private");
  });

  it("string input → private", () => {
    expect(resolveVisibility("public")).toBe("private");
  });

  it("array input → private", () => {
    expect(resolveVisibility(["public"])).toBe("private");
  });

  it("{ visibility: 'public', title: 'X' } (missing date) → private", () => {
    expect(resolveVisibility({ visibility: "public", title: "X" })).toBe("private");
  });

  it("{ visibility: 'public', date: '2026-05-10' } (missing title) → private", () => {
    expect(
      resolveVisibility({ visibility: "public", date: "2026-05-10" }),
    ).toBe("private");
  });

  it("{ visibility: 'draft', title: 'X', date: '2026-05-10' } → private", () => {
    expect(
      resolveVisibility({ visibility: "draft", title: "X", date: "2026-05-10" }),
    ).toBe("private");
  });

  // ── The only public case ────────────────────────────────────────────────────

  it("{ title: 'X', date: '2026-05-10', visibility: 'public' } → public", () => {
    expect(
      resolveVisibility({ title: "X", date: "2026-05-10", visibility: "public" }),
    ).toBe("public");
  });

  it("{ title: 'X', date: '2026-05-10', visibility: 'public', mood: 'ok' } → public (passthrough extra keys)", () => {
    expect(
      resolveVisibility({
        title: "X",
        date: "2026-05-10",
        visibility: "public",
        mood: "ok",
      }),
    ).toBe("public");
  });

  it("{ title: 'X', date: new Date('2026-05-10'), visibility: 'public' } → public (Date coercion P24)", () => {
    expect(
      resolveVisibility({
        title: "X",
        date: new Date("2026-05-10"),
        visibility: "public",
      }),
    ).toBe("public");
  });
});
