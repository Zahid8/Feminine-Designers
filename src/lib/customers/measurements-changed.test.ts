import { describe, expect, it } from "vitest";
import type { MeasurementValue } from "@/types/domain";
import { measurementsChanged } from "./measurements-changed";

const m = (fieldKey: string, value: string): MeasurementValue => ({ id: fieldKey, fieldKey, displayCode: fieldKey, displayLabel: fieldKey, value, unit: "in", sortOrder: 1 });

describe("measurementsChanged", () => {
  it("is false when the form returns the values already saved (NA and blank count the same)", () => {
    expect(measurementsChanged([m("length", "38"), m("chest", "")], { values: [m("length", "38"), m("chest", "NA")] })).toBe(false);
  });

  it("is true when a value differs or a new field is filled in", () => {
    expect(measurementsChanged([m("length", "39")], { values: [m("length", "38")] })).toBe(true);
    expect(measurementsChanged([m("waist", "30")], { values: [m("length", "38")] })).toBe(true);
  });

  it("is false when nothing was submitted", () => {
    expect(measurementsChanged([], undefined)).toBe(false);
  });
});
