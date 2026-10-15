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

  it("keeps photos, measurements, and history out of list queries but loads them where needed", async () => {
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

    await listOrders();
    await listOrders({ customerId: "customer-1" });
    await getOrderById("order-9");

    const [listSelect, customerSelect, detailSelect] = selects;
    expect(listSelect).not.toContain("cloth_sample_image_url");
    expect(listSelect).not.toContain("order_measurements");
    expect(listSelect).not.toContain("order_status_history");
    expect(customerSelect).not.toContain("cloth_sample_image_url");
    expect(customerSelect).toContain("order_measurements");
    expect(detailSelect).toContain("cloth_sample_image_url");
    expect(detailSelect).toContain("order_measurements");
    expect(detailSelect).toContain("order_status_history");
    expect(filters).toEqual([
      ["customer_id", "customer-1"],
      ["id", "order-9"]
    ]);
  });
});
