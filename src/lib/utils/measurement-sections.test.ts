import { describe, expect, it } from "vitest";
import { shouldBreakAfterMeasurement } from "@/lib/utils/measurement-sections";

describe("measurement sections", () => {
  it("adds a section break after crotch measurement regardless of display code", () => {
    expect(
      shouldBreakAfterMeasurement({
        fieldKey: "crotch",
        displayCode: "C",
        displayLabel: "C",
        longLabel: "Crotch"
      })
    ).toBe(true);
  });

  it("does not add a section break after normal upper measurements", () => {
    expect(
      shouldBreakAfterMeasurement({
        fieldKey: "frontcross",
        displayCode: "FC",
        displayLabel: "FC",
        longLabel: "Frontcross"
      })
    ).toBe(false);
  });
});
