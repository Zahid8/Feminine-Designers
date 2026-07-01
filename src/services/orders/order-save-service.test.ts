import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ParsedOrderForm } from "@/services/orders/order-form-parser";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ rpc: mockRpc }))
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
      stitchingCostRupees: 0,
      advancePaidRupees,
      paymentMethod: "Cash",
      items: [
        {
          garmentType: "Blouse",
          customGarmentType: "",
          quantity: 1,
          rateRupees: 1000,
          discountRupees: 0,
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
});
