import { describe, expect, it } from "vitest";
import { orders } from "@/lib/data/mock";
import { sortOrders } from "@/lib/orders/order-sort";

describe("sortOrders", () => {
  it("uses priority before delivery date for the default delivery sort", () => {
    const urgentLater = {
      ...orders[0],
      id: "urgent-later",
      priority: "Urgent" as const,
      deliveryDate: "2026-07-10",
      receiptNumber: "SJD-2026-000003"
    };
    const expressMiddle = {
      ...orders[1],
      id: "express-middle",
      priority: "Express" as const,
      deliveryDate: "2026-07-05",
      receiptNumber: "SJD-2026-000002"
    };
    const normalEarlier = {
      ...orders[1],
      id: "normal-earlier",
      priority: "Normal" as const,
      deliveryDate: "2026-07-01",
      receiptNumber: "SJD-2026-000001"
    };

    expect(sortOrders([normalEarlier, expressMiddle, urgentLater], "deliveryDate").map((order) => order.id)).toEqual([
      "express-middle",
      "urgent-later",
      "normal-earlier"
    ]);
  });

  it("sorts by delivery date inside the same priority group", () => {
    const urgentLater = {
      ...orders[0],
      id: "urgent-later",
      priority: "Urgent" as const,
      deliveryDate: "2026-07-10",
      receiptNumber: "SJD-2026-000002"
    };
    const urgentEarlier = {
      ...orders[0],
      id: "urgent-earlier",
      priority: "Urgent" as const,
      deliveryDate: "2026-07-04",
      receiptNumber: "SJD-2026-000001"
    };

    expect(sortOrders([urgentLater, urgentEarlier], "deliveryDate").map((order) => order.id)).toEqual([
      "urgent-earlier",
      "urgent-later"
    ]);
  });
});
