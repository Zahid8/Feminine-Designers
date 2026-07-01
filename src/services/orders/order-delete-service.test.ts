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

  it("deletes the selected order from Supabase", async () => {
    const { deleteOrderById } = await import("./order-delete-service");

    await deleteOrderById("order-1");

    expect(mockFrom).toHaveBeenCalledWith("orders");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "order-1");
  });
});
