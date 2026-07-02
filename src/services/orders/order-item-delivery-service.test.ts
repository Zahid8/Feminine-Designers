import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEq = vi.fn();
const mockSelectEq = vi.fn();
const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ update: mockUpdate, select: mockSelect }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("order delivery service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
    mockSelectEq.mockResolvedValue({ data: [], error: null });
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

  it("marks the order delivered when all dresses are marked delivered", async () => {
    const { updateAllOrderItemsDelivered } = await import("./order-item-delivery-service");

    await updateAllOrderItemsDelivered("order-1", true);

    expect(mockFrom).toHaveBeenNthCalledWith(1, "order_items");
    expect(mockUpdate).toHaveBeenNthCalledWith(1, expect.objectContaining({ delivered: true }));
    expect(mockEq).toHaveBeenNthCalledWith(1, "order_id", "order-1");

    expect(mockFrom).toHaveBeenNthCalledWith(2, "orders");
    expect(mockUpdate).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: "Delivered" }));
    expect(mockEq).toHaveBeenNthCalledWith(2, "id", "order-1");
  });

  it("marks the order delivered after the last undelivered dress is checked", async () => {
    mockSelectEq.mockResolvedValueOnce({
      data: [
        { delivered: true },
        { delivered: true }
      ],
      error: null
    });
    const { updateOrderItemDelivered } = await import("./order-item-delivery-service");

    await updateOrderItemDelivered("order-1", "item-1", true);

    expect(mockFrom).toHaveBeenNthCalledWith(1, "order_items");
    expect(mockUpdate).toHaveBeenNthCalledWith(1, expect.objectContaining({ delivered: true }));
    expect(mockEq).toHaveBeenNthCalledWith(1, "id", "item-1");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "order_items");
    expect(mockSelect).toHaveBeenCalledWith("delivered");
    expect(mockSelectEq).toHaveBeenCalledWith("order_id", "order-1");
    expect(mockFrom).toHaveBeenNthCalledWith(3, "orders");
    expect(mockUpdate).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: "Delivered" }));
    expect(mockEq).toHaveBeenNthCalledWith(2, "id", "order-1");
  });
});
