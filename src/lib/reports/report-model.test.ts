import { describe, expect, it } from "vitest";
import { orders } from "@/lib/data/mock";
import { buildReportModel, resolveReportRange } from "./report-model";

describe("resolveReportRange", () => {
  it("turns presets into inclusive India-date ranges", () => {
    expect(resolveReportRange("7d", "2026-10-15")).toMatchObject({ from: "2026-10-09", to: "2026-10-15" });
    expect(resolveReportRange(undefined, "2026-10-15")).toMatchObject({ id: "month", from: "2026-10-01", to: "2026-10-15" });
    expect(resolveReportRange("last-month", "2026-03-15")).toMatchObject({ from: "2026-02-01", to: "2026-02-28" });
    expect(resolveReportRange("year", "2026-10-15")).toMatchObject({ from: "2026-01-01" });
    expect(resolveReportRange("bogus", "2026-10-15").id).toBe("month");
  });
});

describe("buildReportModel", () => {
  const base = orders[0];
  const order = (id: string, orderDate: string, total: number, paid: { amount: number; at: string; method: "Cash" | "UPI" }[], garment = "Blouse") => ({
    ...base,
    id,
    customerId: `c-${id}`,
    status: "New" as const,
    orderDate,
    items: [{ ...base.items[0], garmentType: garment, quantity: 1, lineTotalPaise: total }],
    payments: paid.map((payment, index) => ({ id: `${id}-p${index}`, orderId: id, amountPaise: payment.amount, method: payment.method, paidAt: payment.at })),
    totals: { ...base.totals, grandTotalPaise: total, balanceDuePaise: total - paid.reduce((sum, payment) => sum + payment.amount, 0) }
  });

  it("totals billing, collections by method, garments, and outstanding for the range", () => {
    const sample = [
      order("a", "2026-10-02", 100_000, [{ amount: 40_000, at: "2026-10-02T06:00:00Z", method: "Cash" }]),
      order("b", "2026-10-10", 50_000, [{ amount: 50_000, at: "2026-10-10T06:00:00Z", method: "UPI" }], "Suit"),
      order("c", "2026-09-20", 70_000, [{ amount: 20_000, at: "2026-10-05T06:00:00Z", method: "UPI" }])
    ];

    const model = buildReportModel(sample, resolveReportRange("month", "2026-10-15"), "2026-10-15");

    expect(model.ordersCount).toBe(2);
    expect(model.billedPaise).toBe(150_000);
    expect(model.averageOrderPaise).toBe(75_000);
    expect(model.collectedPaise).toBe(110_000);
    expect(model.collectedByMethod).toEqual([
      { method: "UPI", amountPaise: 70_000, count: 2 },
      { method: "Cash", amountPaise: 40_000, count: 1 }
    ]);
    expect(model.outstandingPaise).toBe(110_000);
    expect(model.collections).toHaveLength(15);
    expect(model.collectionsGrouping).toBe("day");
    expect(model.garmentMix.map((garment) => garment.key)).toEqual(["Blouse", "Suit"]);
  });

  it("groups long ranges by month", () => {
    const model = buildReportModel([], resolveReportRange("year", "2026-10-15"), "2026-10-15");
    expect(model.collectionsGrouping).toBe("month");
    expect(model.collections.map((bucket) => bucket.key)).toEqual(["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
  });
});
