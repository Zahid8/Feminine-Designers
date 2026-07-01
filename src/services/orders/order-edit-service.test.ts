import { beforeEach, describe, expect, it, vi } from "vitest";
import { orders } from "@/lib/data/mock";

const mockEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("order-edit-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  it("updates customer, order, items, measurements, and editable notes", async () => {
    const { updateOrderFromForm } = await import("./order-edit-service");
    const formData = new FormData();
    formData.set("customerName", "Bebu Updated");
    formData.set("phonePrimary", "9810547398");
    formData.set("orderDate", "2026-07-02");
    formData.set("deliveryDate", "2026-07-08");
    formData.set("status", "Ready");
    formData.set("priority", "Express");
    formData.set("assignedTailor", "Shakir");
    formData.set("orderDiscountRupees", "100");
    formData.set("accessoriesCostRupees", "50");
    formData.set("stitchingCostRupees", "75");
    formData.set("customerNotes", "Call before pickup.");
    formData.set("internalNotes", "Steam press before packing.");
    formData.set("items.0.id", orders[0].items[0].id);
    formData.set("items.0.garmentType", "Blouse");
    formData.set("items.0.quantity", "3");
    formData.set("items.0.rateRupees", "1400");
    formData.set("items.0.fabricLength", "3 m");
    formData.set("items.0.fabricColor", "Pink");
    formData.set("items.0.designReference", "Deep back");
    formData.set("items.0.stitchingInstructions", "Add margin inside.");
    formData.set("measurementNotes", "Check shoulder slope.");
    formData.set("measurements.0.id", orders[0].measurements[0].id);
    formData.set("measurements.0.value", "15");

    await updateOrderFromForm(orders[0], formData);

    expect(mockFrom).toHaveBeenCalledWith("customers");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Bebu Updated",
        phone_primary: "9810547398"
      })
    );
    expect(mockFrom).toHaveBeenCalledWith("orders");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "Ready",
        priority: "Express",
        customer_notes: "Call before pickup.",
        internal_notes: "Steam press before packing.",
        accessories_cost: "50.00",
        stitching_cost: "75.00"
      })
    );
    expect(mockFrom).toHaveBeenCalledWith("order_items");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: "3",
        rate: "1400.00",
        fabric_length: "3 m",
        stitching_instructions: "Add margin inside."
      })
    );
    expect(mockFrom).toHaveBeenCalledWith("order_measurements");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "15",
        notes: "Check shoulder slope."
      })
    );
  });
});

