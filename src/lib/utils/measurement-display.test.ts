import { describe, expect, it } from "vitest";
import { formatMeasurementValue, isPrintableMeasurementValue } from "@/lib/utils/measurement-display";

describe("formatMeasurementValue", () => {
  it("shows NA without a unit for missing measurements", () => {
    expect(formatMeasurementValue("NA", "in")).toBe("NA");
    expect(formatMeasurementValue("", "in")).toBe("NA");
  });

  it("shows units for filled measurements", () => {
    expect(formatMeasurementValue("14", "in")).toBe("14 in");
    expect(formatMeasurementValue("Padded", "text")).toBe("Padded");
  });

  it("marks only filled measurements as printable on receipts", () => {
    expect(isPrintableMeasurementValue("14")).toBe(true);
    expect(isPrintableMeasurementValue("Padded")).toBe(true);
    expect(isPrintableMeasurementValue("")).toBe(false);
    expect(isPrintableMeasurementValue("   ")).toBe(false);
    expect(isPrintableMeasurementValue("NA")).toBe(false);
    expect(isPrintableMeasurementValue("na")).toBe(false);
  });
});
