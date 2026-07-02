import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSingle = vi.fn();
const mockSelectEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));
const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({ insert: mockInsert, select: mockSelect, update: mockUpdate }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("order-status-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { status: "In Stitching" }, error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("marks an order ready and keeps dresses not delivered for dashboard ready-not-delivered tracking", async () => {
    const { updateOrderStage } = await import("./order-status-service");

    await updateOrderStage("order-1", "Ready");

    expect(mockFrom).toHaveBeenNthCalledWith(1, "orders");
    expect(mockSelect).toHaveBeenCalledWith("status");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "orders");
    expect(mockUpdate).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: "Ready" }));
    expect(mockUpdateEq).toHaveBeenNthCalledWith(1, "id", "order-1");
    expect(mockFrom).toHaveBeenNthCalledWith(3, "order_items");
    expect(mockUpdate).toHaveBeenNthCalledWith(2, expect.objectContaining({ delivered: false, delivered_at: null }));
    expect(mockUpdateEq).toHaveBeenNthCalledWith(2, "order_id", "order-1");
    expect(mockFrom).toHaveBeenNthCalledWith(4, "order_status_history");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: "order-1",
        from_status: "In Stitching",
        to_status: "Ready",
        notes: "Status changed from order edit"
      })
    );
  });

  it("marks an order delivered and all dresses delivered", async () => {
    const { updateOrderStage } = await import("./order-status-service");

    await updateOrderStage("order-1", "Delivered");

    expect(mockUpdate).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: "Delivered" }));
    expect(mockUpdate).toHaveBeenNthCalledWith(2, expect.objectContaining({ delivered: true }));
  });
});
