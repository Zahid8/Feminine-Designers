import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("settings-service removal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  it("removes garment types by deactivating them instead of hard deleting history", async () => {
    const { removeGarmentType } = await import("./settings-service");

    await removeGarmentType("garment-1");

    expect(mockFrom).toHaveBeenCalledWith("garment_types");
    expect(mockUpdate).toHaveBeenCalledWith({ active: false });
    expect(mockEq).toHaveBeenCalledWith("id", "garment-1");
  });

  it("removes measurement templates and fields by marking them inactive", async () => {
    const { removeMeasurementField, removeMeasurementTemplate } = await import("./settings-service");

    await removeMeasurementTemplate("template-1");
    await removeMeasurementField("field-1");

    expect(mockFrom).toHaveBeenCalledWith("measurement_templates");
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    expect(mockEq).toHaveBeenCalledWith("id", "template-1");
    expect(mockFrom).toHaveBeenCalledWith("measurement_template_fields");
    expect(mockUpdate).toHaveBeenCalledWith({ active: false });
    expect(mockEq).toHaveBeenCalledWith("id", "field-1");
  });
});

describe("mapStoreSettings", () => {
  const row = {
    id: "s1",
    store_name: "Feminine Designer by Sajida",
    brand_subtitle: "By Sajida",
    gstin: "06AYWPB8525D1ZB",
    phone_primary: "9718926185",
    phone_secondary: "8447371925",
    email: "shop@example.com",
    address_line_1: "Shop No. 222, 2nd Floor, City Centre Mall",
    address_line_2: "MG Road Metro Station",
    city: "Gurugram",
    postal_code: "122002",
    default_cgst_rate: "2.50",
    default_sgst_rate: 2.5,
    receipt_prefix: "SJD",
    terms_and_conditions: "Store terms"
  };

  it("builds address lines from the older split columns and falls back to default terms/templates", async () => {
    const { mapStoreSettings } = await import("./settings-service");
    const { STORE_SETTINGS } = await import("@/lib/constants/business");
    const settings = mapStoreSettings(row);
    expect(settings.addressLines).toEqual(["Shop No. 222, 2nd Floor, City Centre Mall", "MG Road Metro Station", "Gurugram-122002"]);
    expect(settings.defaultCgstRate).toBe(2.5);
    expect(settings.customerTerms).toEqual(STORE_SETTINGS.customerTerms);
    expect(settings.messageTemplates).toEqual(STORE_SETTINGS.messageTemplates);
  });

  it("reads a saved multi-line address, custom terms, and partial templates", async () => {
    const { mapStoreSettings } = await import("./settings-service");
    const { STORE_SETTINGS } = await import("@/lib/constants/business");
    const settings = mapStoreSettings({
      ...row,
      address_line_1: "Line one\nLine two",
      customer_terms: "First term\nSecond term",
      message_templates: { readyForPickup: "Ready, {name}!" }
    });
    expect(settings.addressLines).toEqual(["Line one", "Line two"]);
    expect(settings.customerTerms).toEqual(["First term", "Second term"]);
    expect(settings.messageTemplates.readyForPickup).toBe("Ready, {name}!");
    expect(settings.messageTemplates.orderConfirmation).toBe(STORE_SETTINGS.messageTemplates.orderConfirmation);
  });
});
