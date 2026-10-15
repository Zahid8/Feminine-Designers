import { describe, expect, it } from "vitest";
import { summarizeGarments } from "./garment-summary";

describe("summarizeGarments", () => {
  it("groups repeated garment types with their quantities", () => {
    expect(
      summarizeGarments([
        { garmentType: "Blouse", quantity: 1 },
        { garmentType: "Suit", quantity: 1 },
        { garmentType: "Blouse", quantity: 2 }
      ])
    ).toBe("Blouse ×3, Suit");
  });
});
