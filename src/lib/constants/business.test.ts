import { describe, expect, it } from "vitest";
import { MEASUREMENT_TEMPLATES } from "@/lib/constants/business";

describe("measurement templates", () => {
  it("include the requested collar, thigh, knee, cup, backcross, and frontcross fields", () => {
    const codes = MEASUREMENT_TEMPLATES[0].fields.map((field) => field.displayCode);

    expect(codes).toEqual(expect.arrayContaining(["CL", "TH", "KN", "CP", "BC", "FC"]));
  });

  it("keeps duplicate display labels as unique form field keys", () => {
    const fields = MEASUREMENT_TEMPLATES[0].fields;
    const fieldKeys = fields.map((field) => field.fieldKey);

    expect(new Set(fieldKeys).size).toBe(fieldKeys.length);
    expect(fields.map((field) => field.longLabel)).toEqual(expect.arrayContaining(["Hip", "Opening", "Thigh"]));
    expect(fieldKeys).toEqual(expect.arrayContaining(["hip", "hip_2", "opening", "opening_2", "thigh", "thigh_2"]));
  });

  it("includes the current upper and lower body measurement list around crotch", () => {
    const labels = MEASUREMENT_TEMPLATES[0].fields.map((field) => field.longLabel);

    expect(labels).toEqual(
      expect.arrayContaining(["Crotch", "Lower Length", "Belt", "Asan", "Ankle", "Knee"])
    );
  });
});
