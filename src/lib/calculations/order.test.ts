import { describe, expect, it } from "vitest";
import { calculateLineTotal, calculateOrderTotals, daysOverdue, isOrderOverdue } from "@/lib/calculations/order";

describe("order calculations", () => {
  it("calculates line totals using paise-safe integer arithmetic", () => {
    expect(calculateLineTotal({ quantity: 2, ratePaise: 135000, discountPaise: 10000 })).toBe(260000);
  });

  it("calculates subtotal, GST, grand total, advance, and balance", () => {
    const totals = calculateOrderTotals({
      items: [
        { quantity: 2, ratePaise: 135000, discountPaise: 10000 },
        { quantity: 1, ratePaise: 25000, discountPaise: 0 }
      ],
      orderDiscountPaise: 5000,
      cgstRate: 2.5,
      sgstRate: 2.5,
      payments: [{ amountPaise: 150000 }]
    });

    expect(totals.subtotalPaise).toBe(285000);
    expect(totals.taxableAmountPaise).toBe(280000);
    expect(totals.cgstAmountPaise).toBe(7000);
    expect(totals.sgstAmountPaise).toBe(7000);
    expect(totals.grandTotalPaise).toBe(294000);
    expect(totals.balanceDuePaise).toBe(144000);
    expect(totals.paymentStatus).toBe("Partial");
  });

  it("adds accessories and stitching costs globally before bill-level discount and tax", () => {
    const totals = calculateOrderTotals({
      items: [{ quantity: 1, ratePaise: 100000, discountPaise: 0 }],
      accessoriesCostPaise: 25000,
      stitchingCostPaise: 50000,
      orderDiscountPaise: 10000,
      cgstRate: 2.5,
      sgstRate: 2.5
    });

    expect(totals.accessoriesCostPaise).toBe(25000);
    expect(totals.stitchingCostPaise).toBe(50000);
    expect(totals.subtotalPaise).toBe(175000);
    expect(totals.taxableAmountPaise).toBe(165000);
    expect(totals.grandTotalPaise).toBe(173250);
  });

  it("detects overdue orders but excludes delivered and cancelled records", () => {
    const today = new Date("2026-07-05T12:00:00+05:30");
    expect(isOrderOverdue("2026-07-04", "Ready", today)).toBe(true);
    expect(daysOverdue("2026-07-04", "Ready", today)).toBe(1);
    expect(isOrderOverdue("2026-07-04", "Delivered", today)).toBe(false);
    expect(isOrderOverdue("2026-07-04", "Cancelled", today)).toBe(false);
  });
});
