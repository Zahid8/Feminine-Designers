import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDeleteEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
const mockInsert = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ delete: mockDelete, insert: mockInsert, select: mockSelect }));
const mockGetCustomerById = vi.fn();
const mockListOrders = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

vi.mock("@/services/customers/customer-service", () => ({
  getCustomerById: mockGetCustomerById
}));

vi.mock("@/services/orders/order-service", () => ({
  listOrders: mockListOrders
}));

describe("customer measurement service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteEq.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockGetCustomerById.mockResolvedValue({
      id: "customer-1",
      customerCode: "C1",
      fullName: "Bebu",
      phonePrimary: "9000000001",
      preferredCommunication: "WhatsApp",
      tags: [],
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-07-01T00:00:00Z"
    });
    mockListOrders.mockResolvedValue([]);
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
    ]);

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
        source_order_id: null
      },
      {
        customer_id: "customer-1",
        field_key: "crotch",
        value: "NA",
        unit: "in",
        source_order_id: null
      }
    ]);
  });

  it("uses the latest order measurements when profile rows are automatic order snapshots", async () => {
    mockOrder.mockResolvedValueOnce({
      data: [
        {
          id: "profile-length",
          field_key: "length",
          value: "32",
          unit: "in",
          source_order_id: "old-order",
          updated_at: "2026-07-02T00:00:00Z"
        }
      ],
      error: null
    });
    mockListOrders.mockResolvedValueOnce([
      {
        id: "old-order",
        customerId: "customer-1",
        createdAt: "2026-01-01T00:00:00Z",
        measurements: [
          {
            id: "old-length",
            fieldKey: "length",
            displayCode: "L",
            displayLabel: "Length",
            value: "32",
            unit: "in",
            sortOrder: 1
          }
        ]
      },
      {
        id: "latest-order",
        customerId: "customer-1",
        receiptNumber: "SJD-2026-000010",
        createdAt: "2026-07-01T00:00:00Z",
        measurements: [
          {
            id: "latest-length",
            fieldKey: "length",
            displayCode: "L",
            displayLabel: "Length",
            value: "44",
            unit: "in",
            sortOrder: 1
          }
        ]
      }
    ]);
    const { getCustomerMeasurementProfile } = await import("./customer-measurement-service");

    const profile = await getCustomerMeasurementProfile("customer-1");

    expect(profile?.sourceOrderId).toBe("latest-order");
    expect(profile?.values).toEqual([
      expect.objectContaining({
        id: "latest-length",
        fieldKey: "length",
        value: "44"
      })
    ]);
  });
});
