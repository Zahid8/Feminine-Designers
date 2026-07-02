import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ParsedOrderForm } from "@/services/orders/order-form-parser";

const mockRpc = vi.fn();
const mockSingle = vi.fn();
const mockSelectEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));
const mockDeleteEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({ delete: mockDelete, insert: mockInsert, select: mockSelect }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom, rpc: mockRpc }))
}));

function makeParsedOrder(advancePaidRupees: number): ParsedOrderForm {
  return {
    intent: "order",
    order: {
      customerName: "Bebu",
      phonePrimary: "9000000001",
      orderDate: "2026-07-01",
      deliveryDate: "2026-07-05",
      priority: "Normal",
      status: "New",
      assignedTailor: "",
      internalNotes: "",
      customerNotes: "",
      orderDiscountRupees: 0,
      accessoriesCostRupees: 0,
      advancePaidRupees,
      paymentMethod: "Cash",
      items: [
        {
          garmentType: "Blouse",
          customGarmentType: "",
          quantity: 1,
          rateRupees: 1000,
          discountRupees: 0,
          stitchingCostRupees: 125,
          fabricLength: "",
          fabricColor: "",
          designReference: "",
          stitchingInstructions: ""
        }
      ]
    },
    measurementValues: {},
    measurements: []
  };
}

describe("saveParsedOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: { order_id: "order-1", receipt_number: "SJD-2026-000001" }, error: null });
    mockSingle.mockResolvedValue({ data: { customer_id: "customer-1" }, error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("omits the payment payload when advance paid is zero", async () => {
    const { saveParsedOrder } = await import("./order-save-service");

    await saveParsedOrder(makeParsedOrder(0));

    const payload = mockRpc.mock.calls[0]?.[1]?.p_payload as Record<string, unknown>;
    expect(Object.hasOwn(payload, "payment")).toBe(false);
  });

  it("sends a payment payload only when advance paid is positive", async () => {
    const { saveParsedOrder } = await import("./order-save-service");

    await saveParsedOrder(makeParsedOrder(500));

    expect(mockRpc).toHaveBeenCalledWith(
      "create_order_from_payload",
      expect.objectContaining({
        p_payload: expect.objectContaining({
          payment: expect.objectContaining({
            amount: "500.00",
            payment_method: "Cash"
          })
        })
      })
    );
  });

  it("sends measurements without an item sort order when they are order-level measurements", async () => {
    const { saveParsedOrder } = await import("./order-save-service");
    const parsed = makeParsedOrder(0);
    parsed.measurements = [
      {
        id: "form-global-length",
        fieldKey: "length",
        displayCode: "L",
        displayLabel: "Length",
        value: "14",
        unit: "in",
        notes: "Check shoulder slope before cutting.",
        sortOrder: 1
      }
    ];

    await saveParsedOrder(parsed);

    const payload = mockRpc.mock.calls[0]?.[1]?.p_payload as { measurements?: Array<Record<string, unknown>> };
    expect(payload.measurements).toEqual([
      expect.objectContaining({
        field_key: "length",
        value: "14",
        item_sort_order: null,
        notes: "Check shoulder slope before cutting."
      })
    ]);
  });

  it("stores a customer measurement profile snapshot for the saved order", async () => {
    const { saveParsedOrder } = await import("./order-save-service");
    const parsed = makeParsedOrder(0);
    parsed.measurements = [
      {
        id: "form-global-length",
        fieldKey: "length",
        displayCode: "L",
        displayLabel: "Length",
        value: "14",
        unit: "in",
        sortOrder: 1
      },
      {
        id: "form-global-chest",
        fieldKey: "chest",
        displayCode: "C",
        displayLabel: "Chest",
        value: "36",
        unit: "in",
        sortOrder: 2
      }
    ];

    await saveParsedOrder(parsed);

    expect(mockFrom).toHaveBeenNthCalledWith(1, "orders");
    expect(mockSelect).toHaveBeenCalledWith("customer_id");
    expect(mockSelectEq).toHaveBeenCalledWith("id", "order-1");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "customer_measurement_profiles");
    expect(mockDeleteEq).toHaveBeenCalledWith("source_order_id", "order-1");
    expect(mockFrom).toHaveBeenNthCalledWith(3, "customer_measurement_profiles");
    expect(mockInsert).toHaveBeenCalledWith([
      {
        customer_id: "customer-1",
        field_key: "length",
        value: "14",
        unit: "in",
        source_order_id: "order-1"
      },
      {
        customer_id: "customer-1",
        field_key: "chest",
        value: "36",
        unit: "in",
        source_order_id: "order-1"
      }
    ]);
  });

  it("sends stitching cost on each garment item and totals it on the order", async () => {
    const { saveParsedOrder } = await import("./order-save-service");

    await saveParsedOrder(makeParsedOrder(0));

    const payload = mockRpc.mock.calls[0]?.[1]?.p_payload as {
      order?: Record<string, unknown>;
      items?: Array<Record<string, unknown>>;
    };
    expect(payload.order).toEqual(
      expect.objectContaining({
        stitching_cost: "125.00",
        subtotal: "1125.00"
      })
    );
    expect(payload.items?.[0]).toEqual(
      expect.objectContaining({
        stitching_cost: "125.00",
        line_total: "1125.00"
      })
    );
  });
});
