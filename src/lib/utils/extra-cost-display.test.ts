import { describe, expect, it } from "vitest";
import { formatExtraCostLabel } from "@/lib/utils/extra-cost-display";

describe("formatExtraCostLabel", () => {
  it("adds price to custom extra cost labels", () => {
    expect(formatExtraCostLabel("Lace")).toBe("Lace price");
    expect(formatExtraCostLabel("Shantoon")).toBe("Shantoon price");
  });

  it("does not duplicate price when the label already includes it", () => {
    expect(formatExtraCostLabel("Lace price")).toBe("Lace price");
    expect(formatExtraCostLabel("Fabric Price")).toBe("Fabric Price");
  });

  it("falls back to Extra cost when the label is blank", () => {
    expect(formatExtraCostLabel("   ")).toBe("Extra cost");
  });
});
