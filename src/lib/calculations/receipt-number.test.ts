import { describe, expect, it } from "vitest";
import { formatReceiptNumber, nextSequenceValue } from "@/lib/calculations/receipt-number";

describe("receipt numbering", () => {
  it("formats the default yearly sequence", () => {
    expect(formatReceiptNumber({ prefix: "SJD", year: 2026, sequence: 1 })).toBe("SJD-2026-000001");
    expect(formatReceiptNumber({ prefix: "SJD", year: 2027, sequence: 18 })).toBe("SJD-2027-000018");
  });

  it("returns starting serial for a new sequence and increments existing sequences", () => {
    expect(nextSequenceValue(0, 10)).toBe(10);
    expect(nextSequenceValue(10, 10)).toBe(11);
  });

  it("rejects invalid prefixes", () => {
    expect(() => formatReceiptNumber({ prefix: "sjd", year: 2026, sequence: 1 })).toThrow();
  });
});
