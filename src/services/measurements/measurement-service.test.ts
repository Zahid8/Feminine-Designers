import { beforeEach, describe, expect, it, vi } from "vitest";

const mockOrder = vi.fn();
const mockSelect = vi.fn(() => ({ order: mockOrder }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("measurement-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges code-defined measurement fields into Supabase-backed templates", async () => {
    mockOrder.mockResolvedValueOnce({
      data: [
        {
          id: "db-template-1",
          name: "Blouse measurements",
          garment_category: "Blouse",
          is_active: true,
          description: null,
          fields: [
            {
              id: "db-length",
              field_key: "length",
              display_code: "L",
              display_label: "L",
              long_label: "Length",
              input_type: "number",
              unit: "in",
              is_required: true,
              sort_order: 1
            }
          ]
        }
      ],
      error: null
    });

    const { listMeasurementTemplates } = await import("./measurement-service");

    const templates = await listMeasurementTemplates();
    const fields = templates[0].fields;

    expect(fields.map((field) => field.longLabel)).toEqual(
      expect.arrayContaining(["Crotch", "Lower Length", "Belt", "Asan", "Ankle", "Knee"])
    );
    expect(fields.map((field) => field.fieldKey)).toEqual(expect.arrayContaining(["crotch", "lower-length", "hip_2"]));
  });
});
