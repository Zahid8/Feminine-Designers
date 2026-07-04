import { beforeEach, describe, expect, it, vi } from "vitest";
import { orders } from "@/lib/data/mock";

const mockEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockDelete = vi.fn(() => ({ eq: mockEq }));
const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({ delete: mockDelete, insert: mockInsert, update: mockUpdate }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("order-edit-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
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
    formData.set("clothSampleDataUrl", "data:image/jpeg;base64,new-photo");
    formData.set("orderDiscountRupees", "100");
    formData.set("accessoriesCostRupees", "50");
    formData.set("customerNotes", "Call before pickup.");
    formData.set("internalNotes", "Steam press before packing.");
    formData.set("items.0.id", orders[0].items[0].id);
    formData.set("items.0.garmentType", "Blouse");
    formData.set("items.0.quantity", "3");
    formData.set("items.0.rateRupees", "1400");
    formData.set("items.0.stitchingCostRupees", "75");
    formData.set("items.0.fabricPriceRupees", "300");
    formData.set("items.0.dyePriceRupees", "125");
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
        assigned_tailor_name: "Shakir",
        cloth_sample_image_url: "data:image/jpeg;base64,new-photo",
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
        stitching_cost: "75.00",
        fabric_price: "300.00",
        dye_price: "125.00",
        line_total: "4600.00",
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
    expect(mockFrom).toHaveBeenCalledWith("order_status_history");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: orders[0].id,
        from_status: orders[0].status,
        to_status: "Ready",
        notes: "Status changed from saved bill edit"
      })
    );
  });

  it("adds measurement rows when a saved order has none yet", async () => {
    const { updateOrderFromForm } = await import("./order-edit-service");
    const orderWithoutMeasurements = {
      ...orders[0],
      measurements: []
    };
    const formData = new FormData();
    formData.set("customerName", orderWithoutMeasurements.customer.fullName);
    formData.set("phonePrimary", orderWithoutMeasurements.customer.phonePrimary);
    formData.set("orderDate", orderWithoutMeasurements.orderDate);
    formData.set("deliveryDate", orderWithoutMeasurements.deliveryDate);
    formData.set("status", orderWithoutMeasurements.status);
    formData.set("priority", orderWithoutMeasurements.priority);
    formData.set("newMeasurement.length", "38");
    formData.set("newMeasurementMeta.length.displayCode", "L");
    formData.set("newMeasurementMeta.length.displayLabel", "Length");
    formData.set("newMeasurementMeta.length.unit", "in");
    formData.set("newMeasurementMeta.length.sortOrder", "1");
    formData.set("newMeasurement.chest", "36");
    formData.set("newMeasurementMeta.chest.displayCode", "C");
    formData.set("newMeasurementMeta.chest.displayLabel", "Chest");
    formData.set("newMeasurementMeta.chest.unit", "in");
    formData.set("newMeasurementMeta.chest.sortOrder", "2");
    formData.set("newMeasurementNotes", "Fresh measurement added after saving.");

    await updateOrderFromForm(orderWithoutMeasurements, formData);

    expect(mockFrom).toHaveBeenCalledWith("order_measurements");
    expect(mockInsert).toHaveBeenCalledWith([
      {
        order_id: orderWithoutMeasurements.id,
        order_item_id: null,
        template_id: null,
        field_key: "length",
        display_code: "L",
        display_label: "Length",
        value: "38",
        unit: "in",
        notes: "Fresh measurement added after saving.",
        sort_order: 1
      },
      {
        order_id: orderWithoutMeasurements.id,
        order_item_id: null,
        template_id: null,
        field_key: "chest",
        display_code: "C",
        display_label: "Chest",
        value: "36",
        unit: "in",
        notes: null,
        sort_order: 2
      }
    ]);
  });

  it("recalculates item rows and order totals when item costs change", async () => {
    const { updateOrderFromForm } = await import("./order-edit-service");
    const formData = new FormData();
    const order = orders[0];
    formData.set("customerName", order.customer.fullName);
    formData.set("phonePrimary", order.customer.phonePrimary);
    formData.set("orderDate", order.orderDate);
    formData.set("deliveryDate", order.deliveryDate);
    formData.set("status", order.status);
    formData.set("priority", order.priority);
    formData.set("orderDiscountRupees", "0");
    formData.set("accessoriesCostRupees", "0");
    formData.set("items.0.id", order.items[0].id);
    formData.set("items.0.garmentType", order.items[0].garmentType);
    formData.set("items.0.quantity", "1");
    formData.set("items.0.rateRupees", "1500");
    formData.set("items.0.stitchingCostRupees", "250");
    formData.set("items.0.fabricPriceRupees", "400");
    formData.set("items.0.dyePriceRupees", "100");
    formData.set("items.0.extraCosts.0.label", "Lace");
    formData.set("items.0.extraCosts.0.amountRupees", "250");
    formData.set("items.0.extraCosts.1.label", "Shantoon");
    formData.set("items.0.extraCosts.1.amountRupees", "600");

    await updateOrderFromForm(order, formData);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        rate: "1500.00",
        stitching_cost: "250.00",
        fabric_price: "400.00",
        dye_price: "100.00",
        extra_cost: "850.00",
        line_total: "3000.00"
      })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: "3250.00",
        stitching_cost: "250.00",
        extra_cost: "850.00",
        taxable_amount: "3250.00",
        cgst_amount: "81.25",
        sgst_amount: "81.25",
        grand_total: "3412.50",
        balance_due: "1912.50",
        payment_status: "Partial"
      })
    );
    expect(mockFrom).toHaveBeenCalledWith("order_item_extra_costs");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith([
      { order_id: order.id, order_item_id: order.items[0].id, item_sort_order: 1, label: "Lace", amount: "250.00", sort_order: 1 },
      { order_id: order.id, order_item_id: order.items[0].id, item_sort_order: 1, label: "Shantoon", amount: "600.00", sort_order: 2 }
    ]);
  });

  it("deletes omitted existing dresses and inserts new dress rows while editing", async () => {
    const { updateOrderFromForm } = await import("./order-edit-service");
    const order = orders[0];
    const formData = new FormData();
    formData.set("customerName", order.customer.fullName);
    formData.set("phonePrimary", order.customer.phonePrimary);
    formData.set("orderDate", order.orderDate);
    formData.set("deliveryDate", order.deliveryDate);
    formData.set("status", order.status);
    formData.set("priority", order.priority);
    formData.set("items.intent", "replace");
    formData.set("orderDiscountRupees", "0");
    formData.set("accessoriesCostRupees", "0");
    formData.set("items.0.id", order.items[0].id);
    formData.set("items.0.garmentType", order.items[0].garmentType);
    formData.set("items.0.quantity", "1");
    formData.set("items.0.rateRupees", "1500");
    formData.set("items.0.stitchingCostRupees", "250");
    formData.set("items.0.fabricPriceRupees", "0");
    formData.set("items.0.dyePriceRupees", "0");
    formData.set("items.1.id", "");
    formData.set("items.1.garmentType", "Lehenga");
    formData.set("items.1.quantity", "2");
    formData.set("items.1.rateRupees", "2100");
    formData.set("items.1.stitchingCostRupees", "350");
    formData.set("items.1.fabricPriceRupees", "500");
    formData.set("items.1.dyePriceRupees", "125");
    formData.set("items.1.fabricLength", "5 m");
    formData.set("items.1.fabricColor", "Wine");
    formData.set("items.1.designReference", "Panel cut");
    formData.set("items.1.stitchingInstructions", "Add can-can");

    await updateOrderFromForm(order, formData);

    expect(mockFrom).toHaveBeenCalledWith("order_items");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", order.items[1].id);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: order.id,
        garment_type: "Lehenga",
        quantity: "2",
        rate: "2100.00",
        stitching_cost: "350.00",
        fabric_price: "500.00",
        dye_price: "125.00",
        line_total: "5175.00",
        fabric_length: "5 m",
        fabric_color: "Wine",
        design_reference: "Panel cut",
        stitching_instructions: "Add can-can",
        sort_order: 2
      })
    );
  });

  it("preserves existing order dates when unchanged date inputs submit blank values", async () => {
    const { updateOrderFromForm } = await import("./order-edit-service");
    const formData = new FormData();
    const order = orders[0];
    formData.set("customerName", order.customer.fullName);
    formData.set("phonePrimary", order.customer.phonePrimary);
    formData.set("orderDate", "");
    formData.set("deliveryDate", "");
    formData.set("status", order.status);
    formData.set("priority", order.priority);

    await updateOrderFromForm(order, formData);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        order_date: order.orderDate,
        delivery_date: order.deliveryDate
      })
    );
  });
});
