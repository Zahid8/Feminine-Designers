import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDeleteEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({ delete: mockDelete, insert: mockInsert }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("customer measurement service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteEq.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("replaces a customer measurement profile with edited values", async () => {
    const { saveCustomerMeasurementProfile } = await import("./customer-measurement-service");

    await saveCustomerMeasurementProfile("customer-1", [
      {
        id: "measurement-1",
        fieldKey: "length",
        displayCode: "L",
        displayLabel: "Length",
        value: "38",
        unit: "in",
        sortOrder: 1
      },
      {
        id: "measurement-2",
        fieldKey: "crotch",
        displayCode: "C",
        displayLabel: "Crotch",
        value: "",
        unit: "in",
        sortOrder: 2
      }
    ], "order-1");

    expect(mockFrom).toHaveBeenNthCalledWith(1, "customer_measurement_profiles");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith("customer_id", "customer-1");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "customer_measurement_profiles");
    expect(mockInsert).toHaveBeenCalledWith([
      {
        customer_id: "customer-1",
        field_key: "length",
        value: "38",
        unit: "in",
        source_order_id: "order-1"
      },
      {
        customer_id: "customer-1",
        field_key: "crotch",
        value: "NA",
        unit: "in",
        source_order_id: "order-1"
      }
    ]);
  });
});
