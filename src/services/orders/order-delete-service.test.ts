import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ delete: mockDelete }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("order-delete-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  it("clears customer measurement profile references before deleting the selected order", async () => {
    const { deleteOrderById } = await import("./order-delete-service");

    await deleteOrderById("order-1");

    expect(mockFrom).toHaveBeenNthCalledWith(1, "customer_measurement_profiles");
    expect(mockDelete).toHaveBeenCalledTimes(2);
    expect(mockEq).toHaveBeenNthCalledWith(1, "source_order_id", "order-1");

    expect(mockFrom).toHaveBeenNthCalledWith(2, "orders");
    expect(mockEq).toHaveBeenNthCalledWith(2, "id", "order-1");
  });
});
