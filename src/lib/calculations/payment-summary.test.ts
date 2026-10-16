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

describe("billSummaryLines", () => {
  it("takes only the advance off the bill total for the bold grand total", async () => {
    const { billSummaryLines } = await import("./payment-summary");
    // Fully paid later, but the bill still shows total minus the booking advance.
    const lines = billSummaryLines({ ...base, totalPaidPaise: base.grandTotalPaise, balanceDuePaise: 0 }, { advancePaise: 500_000 });
    expect(lines.slice(-3).map((line) => [line.label, line.amountPaise])).toEqual([
      ["SGST 2.5%", 63_213],
      ["Advance", -500_000],
      ["Grand total", base.grandTotalPaise - 500_000]
    ]);
    expect(lines.some((line) => line.kind === "balance")).toBe(false);
  });

  it("shows the full bill total when there was no advance", async () => {
    const { billSummaryLines } = await import("./payment-summary");
    const lines = billSummaryLines({ ...base, totalPaidPaise: base.grandTotalPaise, balanceDuePaise: 0 });
    expect(lines.some((line) => line.key === "advance")).toBe(false);
    expect(lines.at(-1)).toMatchObject({ label: "Grand total", amountPaise: base.grandTotalPaise });
  });

  it("never lets the advance push the total below zero", async () => {
    const { billSummaryLines } = await import("./payment-summary");
    expect(billSummaryLines(base, { advancePaise: 99_999_999 }).at(-1)?.amountPaise).toBe(0);
  });
});

describe("advancePaidPaise", () => {
  it("counts only payments recorded as an advance", async () => {
    const { advancePaidPaise } = await import("./payment-summary");
    expect(
      advancePaidPaise([
        { amountPaise: 50_000, notes: "Advance collected at order creation" },
        { amountPaise: 300_000, notes: "Marked paid from order edit" },
        { amountPaise: 20_000, notes: "Payment recorded on order page" }
      ])
    ).toBe(50_000);
    expect(advancePaidPaise([{ amountPaise: 300_000, notes: "Marked paid from dashboard" }])).toBe(0);
    expect(advancePaidPaise([])).toBe(0);
  });
});
