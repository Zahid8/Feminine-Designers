import { describe, expect, it } from "vitest";
import { createMeasurementSnapshot, copyMeasurementGroup } from "@/lib/calculations/measurements";
import { MEASUREMENT_TEMPLATES } from "@/lib/constants/business";

describe("measurement reuse", () => {
  it("creates immutable order snapshots from configurable template fields", () => {
    const snapshot = createMeasurementSnapshot(MEASUREMENT_TEMPLATES[0], {
      length: "14",
      chest: "36",
      shoulder: ""
    });
    expect(snapshot).toHaveLength(2);
    expect(snapshot[0]).toMatchObject({ fieldKey: "length", displayCode: "L", value: "14" });
  });

  it("copies all or selected measurement fields", () => {
    const snapshot = createMeasurementSnapshot(MEASUREMENT_TEMPLATES[0], {
      length: "14",
      chest: "36",
      waist: "32"
    });
    expect(copyMeasurementGroup(snapshot)).toEqual({ length: "14", chest: "36", waist: "32" });
    expect(copyMeasurementGroup(snapshot, ["chest"])).toEqual({ chest: "36" });
  });
});
