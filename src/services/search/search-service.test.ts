import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => false),
  createSupabaseAdminClient: vi.fn()
}));

describe("search-service", () => {
  it("strips characters that would break PostgREST filters", async () => {
    const { sanitizeSearchTerm } = await import("./search-service");
    expect(sanitizeSearchTerm("  Tanya + (Sharmila),%  ")).toBe("Tanya Sharmila");
    expect(sanitizeSearchTerm("SJD-2026-000043")).toBe("SJD-2026-000043");
  });

  it("returns nothing for very short queries", async () => {
    const { quickSearch } = await import("./search-service");
    await expect(quickSearch("a")).resolves.toEqual({ orders: [], customers: [] });
  });
});
