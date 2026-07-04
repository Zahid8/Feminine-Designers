import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => false),
  createSupabaseAdminClient: vi.fn()
}));

describe("order-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists orders sorted by priority before delivery date", async () => {
    const { listOrders } = await import("./order-service");

    const result = await listOrders();

    expect(result.map((order) => order.id)).toEqual(["order-1", "order-2"]);
  });
});
