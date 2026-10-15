import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockEq }));
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })) }));
const mockFrom = vi.fn(() => ({ delete: mockDelete, select: mockSelect }));
const mockRemove = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom, storage: { from: vi.fn(() => ({ remove: mockRemove })) } }))
}));

describe("order-delete-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
    mockMaybeSingle.mockResolvedValue({ data: { cloth_sample_image_url: null }, error: null });
    mockRemove.mockResolvedValue({ data: [], error: null });
  });

  it("clears customer measurement profile references before deleting the selected order", async () => {
    const { deleteOrderById } = await import("./order-delete-service");

    await deleteOrderById("order-1");

    expect(mockFrom).toHaveBeenNthCalledWith(1, "orders");
    expect(mockSelect).toHaveBeenCalledWith("cloth_sample_image_url");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "customer_measurement_profiles");
    expect(mockDelete).toHaveBeenCalledTimes(2);
    expect(mockEq).toHaveBeenNthCalledWith(1, "source_order_id", "order-1");

    expect(mockFrom).toHaveBeenNthCalledWith(3, "orders");
    expect(mockEq).toHaveBeenNthCalledWith(2, "id", "order-1");
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("removes the stored cloth sample photo after deleting the order", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { cloth_sample_image_url: "https://example.supabase.co/storage/v1/object/public/cloth-samples/2026/photo.jpg" },
      error: null
    });
    const { deleteOrderById } = await import("./order-delete-service");

    await deleteOrderById("order-1");

    expect(mockRemove).toHaveBeenCalledWith(["2026/photo.jpg"]);
  });
});
