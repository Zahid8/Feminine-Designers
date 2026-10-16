import { describe, expect, it } from "vitest";
import { paymentSummaryLines } from "./payment-summary";

const base = {
  subtotalPaise: 2_528_500,
  accessoriesCostPaise: 0,
  stitchingCostPaise: 0,
  fabricPricePaise: 78_500,
  dyePricePaise: 0,
  extraCostPaise: 0,
  orderDiscountPaise: 0,
  cgstRate: 2.5,
  cgstAmountPaise: 63_213,
  sgstRate: 2.5,
  sgstAmountPaise: 63_213,
  grandTotalPaise: 2_654_926,
  totalPaidPaise: 0,
  balanceDuePaise: 2_654_926
};

describe("paymentSummaryLines", () => {
  it("lists the parts that make up the subtotal before it, and they add up exactly", () => {
    const lines = paymentSummaryLines(base);
    const parts = lines.filter((line) => line.kind === "part");
    expect(lines.map((line) => line.key)).toEqual(["garments", "fabric", "subtotal", "cgst", "sgst", "total", "paid", "balance"]);
    expect(parts.reduce((sum, line) => sum + line.amountPaise, 0)).toBe(base.subtotalPaise);
    expect(parts[0]).toMatchObject({ label: "Garments", amountPaise: 2_450_000 });
    expect(lines.find((line) => line.key === "cgst")?.label).toBe("CGST 2.5%");
  });

  it("skips the breakdown when garments are the only part", () => {
    const lines = paymentSummaryLines({ ...base, fabricPricePaise: 0 });
    expect(lines.some((line) => line.kind === "part")).toBe(false);
    expect(lines[0].key).toBe("subtotal");
  });

  it("shows a discount only when one was given and labels a settled bill", () => {
    const lines = paymentSummaryLines({ ...base, orderDiscountPaise: 10_000, totalPaidPaise: 2_654_926, balanceDuePaise: 0 });
    expect(lines.find((line) => line.key === "discount")?.amountPaise).toBe(-10_000);
    expect(lines.at(-1)).toMatchObject({ label: "Paid in full", amountPaise: 0 });
  });

  it("never shows a negative garment amount for inconsistent data", () => {
    const lines = paymentSummaryLines({ ...base, fabricPricePaise: 9_999_999 });
    expect(lines.some((line) => line.kind === "part")).toBe(false);
  });

  it("uses named extras when they account for the whole extras total", () => {
    const totals = { ...base, fabricPricePaise: 0, extraCostPaise: 85_000 };
    const named = paymentSummaryLines(totals, { namedExtras: [{ label: "Lace price", amountPaise: 25_000 }, { label: "Shantoon price", amountPaise: 60_000 }] });
    expect(named.filter((line) => line.kind === "part").map((line) => line.label)).toEqual(["Garments", "Lace price", "Shantoon price"]);
    const mismatched = paymentSummaryLines(totals, { namedExtras: [{ label: "Lace price", amountPaise: 1 }] });
    expect(mismatched.some((line) => line.label.startsWith("Extras"))).toBe(true);
  });
});
