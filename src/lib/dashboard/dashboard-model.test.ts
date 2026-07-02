import { describe, expect, it } from "vitest";
import { orders } from "@/lib/data/mock";
import { buildDashboardModel } from "@/lib/dashboard/dashboard-model";

describe("buildDashboardModel", () => {
  it("builds clickable dashboard cards and filtered workbench views", () => {
    const model = buildDashboardModel(orders, "2026-07-01");

    expect(model.cards.map((card) => card.id)).toEqual([
      "orders-today",
      "deliveries-today",
      "pending",
      "overdue",
      "collected-today",
      "outstanding"
    ]);
    expect(model.cards.find((card) => card.id === "orders-today")).toEqual(
      expect.objectContaining({ label: "Orders Today", value: 1, valueType: "count" })
    );
    expect(model.cards.find((card) => card.id === "collected-today")).toEqual(
      expect.objectContaining({ label: "Collected Today", value: 150000, valueType: "money" })
    );

    expect(model.views["orders-today"].orders.map((order) => order.id)).toEqual(["order-1"]);
    expect(model.views["deliveries-today"].orders.map((order) => order.id)).toEqual(["order-2"]);
    expect(model.views.pending.orders.map((order) => order.id)).toEqual(["order-2", "order-1"]);
    expect(model.views.outstanding.orders.map((order) => order.totals.balanceDuePaise)).toEqual([196500, 94500]);
  });

  it("derives collected-today payment rows with order and customer context", () => {
    const model = buildDashboardModel(orders, "2026-07-01");

    expect(model.views["collected-today"].payments).toEqual([
      expect.objectContaining({
        id: "pay-1",
        orderId: "order-1",
        receiptNumber: "SJD-2026-000001",
        customerName: "Ayesha Khan",
        amountPaise: 150000,
        method: "UPI"
      })
    ]);
    expect(model.insights.highestOutstanding.map((order) => order.id)).toEqual(["order-1", "order-2"]);
    expect(model.insights.recentCollections[0]).toEqual(expect.objectContaining({ id: "pay-1" }));
  });
});
