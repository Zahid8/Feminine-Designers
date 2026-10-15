import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

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

  it("leaves inline cloth-sample photos out of list queries but loads them for a single order", async () => {
    const selects: string[] = [];
    const filters: Array<[string, string]> = [];
    const query = {
      select: vi.fn((columns: string) => {
        selects.push(columns);
        return query;
      }),
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value]);
        return query;
      }),
      order: vi.fn(async () => ({ data: [], error: null }))
    };
    vi.mocked(hasSupabaseAdminEnv).mockReturnValue(true);
    vi.mocked(createSupabaseAdminClient).mockReturnValue({ from: vi.fn(() => query) } as never);
    const { getOrderById, listOrders } = await import("./order-service");

    await listOrders({ customerId: "customer-1" });
    await getOrderById("order-9");

    expect(selects[0]).not.toContain("cloth_sample_image_url");
    expect(selects[1]).toContain("cloth_sample_image_url");
    expect(filters).toEqual([
      ["customer_id", "customer-1"],
      ["id", "order-9"]
    ]);
  });
});
