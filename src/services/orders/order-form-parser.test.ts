import { describe, expect, it } from "vitest";
import { parseOrderFormData } from "@/services/orders/order-form-parser";

describe("parseOrderFormData", () => {
  it("parses save intent, garment item, payment, and measurement fields from form data", () => {
    const formData = new FormData();
    formData.set("intent", "print");
    formData.set("customerName", "Ayesha Khan");
    formData.set("phonePrimary", "9718926185");
    formData.set("orderDate", "2026-07-01");
    formData.set("deliveryDate", "2026-07-05");
    formData.set("priority", "Urgent");
    formData.set("garmentType", "Blouse");
    formData.set("quantity", "2");
    formData.set("rateRupees", "1200");
    formData.set("discountRupees", "100");
    formData.set("advancePaidRupees", "500");
    formData.set("paymentMethod", "UPI");
    formData.set("clothSampleDataUrl", "data:image/jpeg;base64,abc123");
    formData.set("measurement.length", "14");
    formData.set("measurementMeta.length.displayCode", "L");
    formData.set("measurementMeta.length.displayLabel", "L");
    formData.set("measurement.collar", "15");
    formData.set("measurementMeta.collar.displayCode", "CL");
    formData.set("measurementMeta.collar.displayLabel", "CL");
    formData.set("measurement.frontcross", "13.5");
    formData.set("measurementMeta.frontcross.displayCode", "FC");
    formData.set("measurementMeta.frontcross.displayLabel", "FC");

    const parsed = parseOrderFormData(formData);

    expect(parsed.intent).toBe("print");
    expect(parsed.order.status).toBe("New");
    expect(parsed.order.items).toEqual([
      expect.objectContaining({ garmentType: "Blouse", quantity: 2, rateRupees: 1200, discountRupees: 0 })
    ]);
    expect(parsed.measurementValues).toMatchObject({
      global: {
        length: "14",
        collar: "15",
        frontcross: "13.5"
      }
    });
    expect(parsed.measurements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: "collar", displayCode: "CL", value: "15", orderItemSortOrder: undefined }),
        expect.objectContaining({ fieldKey: "frontcross", displayCode: "FC", value: "13.5", orderItemSortOrder: undefined })
      ])
    );
    expect(parsed.clothSampleDataUrl).toBe("data:image/jpeg;base64,abc123");
  });

  it("turns draft intent into Draft status", () => {
    const formData = new FormData();
    formData.set("intent", "draft");
    formData.set("customerName", "Ayesha Khan");
    formData.set("phonePrimary", "9718926185");
    formData.set("orderDate", "2026-07-01");
    formData.set("deliveryDate", "2026-07-05");
    formData.set("priority", "Normal");
    formData.set("garmentType", "Blouse");
    formData.set("quantity", "1");
    formData.set("rateRupees", "1200");
    formData.set("discountRupees", "0");
    formData.set("advancePaidRupees", "0");
    formData.set("paymentMethod", "Cash");

    expect(parseOrderFormData(formData).order.status).toBe("Draft");
  });

  it("keeps blank global measurement fields as NA before receipt filtering", () => {
    const formData = new FormData();
    formData.set("intent", "order");
    formData.set("customerName", "Ayesha Khan");
    formData.set("phonePrimary", "9718926185");
    formData.set("orderDate", "2026-07-01");
    formData.set("deliveryDate", "2026-07-05");
    formData.set("priority", "Normal");
    formData.set("garmentType", "Blouse");
    formData.set("quantity", "1");
    formData.set("rateRupees", "1200");
    formData.set("discountRupees", "0");
    formData.set("advancePaidRupees", "0");
    formData.set("paymentMethod", "Cash");
    formData.set("measurement.collar", "");
    formData.set("measurementMeta.collar.displayCode", "CL");
    formData.set("measurementMeta.collar.displayLabel", "Collar");
    formData.set("measurementMeta.collar.unit", "in");
    formData.set("measurementMeta.collar.sortOrder", "19");

    expect(parseOrderFormData(formData).measurements).toEqual([
      expect.objectContaining({
        fieldKey: "collar",
        displayCode: "CL",
        displayLabel: "Collar",
        value: "NA",
        unit: "in",
        sortOrder: 19,
        orderItemSortOrder: undefined
      })
    ]);
  });

  it("parses multiple garment sections with one global measurement set and global charges", () => {
    const formData = new FormData();
    formData.set("intent", "order");
    formData.set("customerName", "Ayesha Khan");
    formData.set("phonePrimary", "9718926185");
    formData.set("orderDate", "2026-07-01");
    formData.set("deliveryDate", "2026-07-05");
    formData.set("priority", "Normal");
    formData.set("items.0.garmentType", "Blouse");
    formData.set("items.0.quantity", "1");
    formData.set("items.0.rateRupees", "1200");
    formData.set("items.0.fabricLength", "2.5 m");
    formData.set("items.1.garmentType", "Kurti");
    formData.set("items.1.quantity", "2");
    formData.set("items.1.rateRupees", "900");
    formData.set("items.1.fabricLength", "4 m");
    formData.set("orderDiscountRupees", "100");
    formData.set("accessoriesCostRupees", "250");
    formData.set("stitchingCostRupees", "500");
    formData.set("advancePaidRupees", "500");
    formData.set("paymentMethod", "Cash");
    formData.set("measurement.length", "14");
    formData.set("measurementMeta.length.displayCode", "L");
    formData.set("measurementMeta.length.displayLabel", "Length");
    formData.set("measurementMeta.length.unit", "in");

    const parsed = parseOrderFormData(formData);

    expect(parsed.order.items).toEqual([
      expect.objectContaining({ garmentType: "Blouse", quantity: 1, rateRupees: 1200, fabricLength: "2.5 m", discountRupees: 0 }),
      expect.objectContaining({ garmentType: "Kurti", quantity: 2, rateRupees: 900, fabricLength: "4 m", discountRupees: 0 })
    ]);
    expect(parsed.order).toEqual(
      expect.objectContaining({
        orderDiscountRupees: 100,
        accessoriesCostRupees: 250,
        stitchingCostRupees: 500
      })
    );
    expect(parsed.measurements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: "length", value: "14", orderItemSortOrder: undefined })
      ])
    );
    expect(parsed.measurements).toHaveLength(1);
  });
});
