import { describe, expect, it } from "vitest";
import { formatMeasurementValue } from "@/lib/utils/measurement-display";

describe("formatMeasurementValue", () => {
  it("shows NA without a unit for missing measurements", () => {
    expect(formatMeasurementValue("NA", "in")).toBe("NA");
    expect(formatMeasurementValue("", "in")).toBe("NA");
  });

  it("shows units for filled measurements", () => {
    expect(formatMeasurementValue("14", "in")).toBe("14 in");
    expect(formatMeasurementValue("Padded", "text")).toBe("Padded");
  });
});
