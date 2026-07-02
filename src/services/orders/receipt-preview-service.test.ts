import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("getNextReceiptPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the receipt sequence without consuming the next number", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { current_value: 10 }, error: null });
    const { getNextReceiptPreview } = await import("./receipt-preview-service");

    await expect(getNextReceiptPreview("2026-07-02")).resolves.toBe("SJD-2026-000011");

    expect(mockFrom).toHaveBeenCalledWith("receipt_sequence");
    expect(mockSelect).toHaveBeenCalledWith("current_value");
    expect(mockEq).toHaveBeenCalledWith("sequence_key", "SJD-2026");
  });

  it("falls back to the first serial when the sequence row does not exist yet", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const { getNextReceiptPreview } = await import("./receipt-preview-service");

    await expect(getNextReceiptPreview("2026-07-02")).resolves.toBe("SJD-2026-000001");
  });
});
