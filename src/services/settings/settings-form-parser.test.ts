import { describe, expect, it } from "vitest";
import {
  parseGarmentTypeFormData,
  parseRemoveSettingFormData,
  parseMeasurementFieldFormData,
  parseMeasurementTemplateFormData
} from "@/services/settings/settings-form-parser";

describe("settings form parsers", () => {
  it("parses a new garment type name", () => {
    const formData = new FormData();
    formData.set("name", "Sharara");

    expect(parseGarmentTypeFormData(formData)).toEqual({ name: "Sharara" });
  });

  it("parses a new measurement template", () => {
    const formData = new FormData();
    formData.set("name", "Sharara measurements");
    formData.set("garmentCategories", "Sharara, Suit");
    formData.set("description", "Lower garment template");

    expect(parseMeasurementTemplateFormData(formData)).toEqual({
      name: "Sharara measurements",
      garmentCategories: ["Sharara", "Suit"],
      description: "Lower garment template"
    });
  });

  it("parses a new measurement field for an existing template", () => {
    const formData = new FormData();
    formData.set("templateId", "tmpl-general");
    formData.set("fieldKey", "ankle_round");
    formData.set("displayCode", "AR");
    formData.set("displayLabel", "AR");
    formData.set("longLabel", "Ankle Round");
    formData.set("inputType", "number");
    formData.set("unit", "in");
    formData.set("isRequired", "on");

    expect(parseMeasurementFieldFormData(formData)).toMatchObject({
      templateId: "tmpl-general",
      fieldKey: "ankle_round",
      displayCode: "AR",
      displayLabel: "AR",
      longLabel: "Ankle Round",
      inputType: "number",
      unit: "in",
      isRequired: true
    });
  });

  it("parses a remove settings form target", () => {
    const formData = new FormData();
    formData.set("id", "garment-1");

    expect(parseRemoveSettingFormData(formData)).toEqual({ id: "garment-1" });
  });
});

describe("parseStoreSettingsFormData", () => {
  function storeForm(overrides: Record<string, string> = {}) {
    const formData = new FormData();
    const values: Record<string, string> = {
      storeName: "Feminine Designer by Sajida",
      gstin: "06aywpb8525d1zb",
      phonePrimary: "97189 26185",
      phoneSecondary: "",
      email: "",
      address: "Shop 222\n\nGurugram-122002",
      defaultCgstRate: "2.5",
      defaultSgstRate: "2.5",
      termsAndConditions: "Store terms",
      customerTerms: "One\nTwo",
      "template.orderConfirmation": "Hi {name}",
      "template.readyForPickup": "Ready {name}",
      "template.balanceReminder": "Due {balance}",
      "template.onlineOrderConfirmed": "Online {name}",
      "template.onlineShipped": "Shipped {receipt}",
      "template.onlineDelivered": "Delivered {receipt}",
      ...overrides
    };
    for (const [key, value] of Object.entries(values)) formData.set(key, value);
    return formData;
  }

  it("normalises GSTIN, phones, address lines, rates, and terms", async () => {
    const { parseStoreSettingsFormData } = await import("./settings-form-parser");
    const parsed = parseStoreSettingsFormData(storeForm());
    expect(parsed.gstin).toBe("06AYWPB8525D1ZB");
    expect(parsed.phonePrimary).toBe("9718926185");
    expect(parsed.addressLines).toEqual(["Shop 222", "Gurugram-122002"]);
    expect(parsed.defaultCgstRate).toBe(2.5);
    expect(parsed.customerTerms).toEqual(["One", "Two"]);
  });

  it("rejects an invalid GSTIN or GST rate with a readable message", async () => {
    const { parseStoreSettingsFormData } = await import("./settings-form-parser");
    expect(() => parseStoreSettingsFormData(storeForm({ gstin: "123" }))).toThrow(/GSTIN must be 15/);
    expect(() => parseStoreSettingsFormData(storeForm({ defaultCgstRate: "45" }))).toThrow(/too high/);
    expect(() => parseStoreSettingsFormData(storeForm({ phonePrimary: "12" }))).toThrow(/10-digit/);
  });
});
