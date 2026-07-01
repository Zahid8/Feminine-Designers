import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("order delivery service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  it("marks an order complete by delivering the order and all of its items", async () => {
    const { updateOrderCompleted } = await import("./order-item-delivery-service");

    await updateOrderCompleted("order-1", true);

    expect(mockFrom).toHaveBeenNthCalledWith(1, "orders");
    expect(mockUpdate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        status: "Delivered"
      })
    );
    expect(mockEq).toHaveBeenNthCalledWith(1, "id", "order-1");

    expect(mockFrom).toHaveBeenNthCalledWith(2, "order_items");
    expect(mockUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        delivered: true
      })
    );
    expect(mockEq).toHaveBeenNthCalledWith(2, "order_id", "order-1");
  });
});
