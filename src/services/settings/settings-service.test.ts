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
