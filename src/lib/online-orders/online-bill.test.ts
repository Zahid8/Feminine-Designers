import { describe, expect, it } from "vitest";
import { STORE_SETTINGS } from "@/lib/constants/business";
import { onlineOrder } from "./online-order-fixture";
import { onlineBillAmounts, onlineBillFileName, onlineCustomerMessages, onlineItemsSummary } from "./online-bill";

describe("online bill", () => {
  it("works out money in paise; unpaid orders carry the whole total as balance", () => {
    expect(onlineBillAmounts(onlineOrder())).toEqual({
      subtotalPaise: 480000,
      discountPaise: 20000,
      shippingPaise: 10000,
      totalPaise: 470000,
      paidPaise: 0,
      balancePaise: 470000
    });
    expect(onlineBillAmounts(onlineOrder({ payment_status: "paid" })).balancePaise).toBe(0);
  });

  it("summarises items with their fit and names the file after the order", () => {
    expect(onlineItemsSummary(onlineOrder())).toBe("Silk Blouse (M), Zari Blouse (Custom size)");
    expect(onlineBillFileName("fd-20261017-abc123")).toBe("Bill_FD-20261017-ABC123.pdf");
  });

  it("offers WhatsApp messages that match the order stage and include the bill link", () => {
    const link = "https://billing.example.com/bill/online/FD-20261017-ABC123/sig";
    const confirmed = onlineCustomerMessages(onlineOrder(), STORE_SETTINGS, link);
    expect(confirmed.map((m) => m.label)).toEqual(["Order confirmation", "Payment reminder"]);
    expect(confirmed[0].text).toContain("FD-20261017-ABC123");
    expect(confirmed[0].text).toContain(link);
    expect(confirmed[0].text).toContain("Zari Blouse (Custom size)");

    const delivered = onlineCustomerMessages(onlineOrder({ status: "delivered", payment_status: "paid" }), STORE_SETTINGS, link);
    expect(delivered.map((m) => m.label)).toEqual(["Order confirmation", "Shipped", "Delivered"]);
    expect(delivered[2].text).toContain("has been delivered");
  });

  it("drops the bill line cleanly when no link can be signed", () => {
    const [message] = onlineCustomerMessages(onlineOrder(), STORE_SETTINGS, undefined);
    expect(message.text).not.toContain("{bill_link}");
    expect(message.text).not.toContain("Your bill:");
  });
});
