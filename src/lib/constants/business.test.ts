import { describe, expect, it } from "vitest";
import { MEASUREMENT_TEMPLATES } from "@/lib/constants/business";

describe("measurement templates", () => {
  it("include the requested collar, thigh, knee, cup, backcross, and frontcross fields", () => {
    const codes = MEASUREMENT_TEMPLATES[0].fields.map((field) => field.displayCode);

    expect(codes).toEqual(expect.arrayContaining(["CL", "TH", "KN", "CP", "BC", "FC"]));
  });
});
