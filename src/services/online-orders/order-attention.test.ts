import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onlineOrder } from "@/lib/online-orders/online-order-fixture";
import { STORE_SETTINGS } from "@/lib/constants/business";
import { onlineCustomerMessages, trackingLine } from "@/lib/online-orders/online-bill";
import {
  courierTrackingUrl,
  missingTracking,
  openRequests,
  refundDue,
  updateOnlineOrderRequest,
  type OnlineOrderRequest
} from "./online-order-service";

const tracking = { courier: "Delhivery", number: "AWB9", url: "https://www.delhivery.com/track/package/AWB9", expected_delivery: "2026-10-21", shipped_at: "2026-10-18T10:00:00Z", delivered_at: null };
const req = (status: OnlineOrderRequest["status"]): OnlineOrderRequest => ({
  id: 1, kind: "exchange", kind_label: "Exchange (ready-made)", reason: "Size or fit is not right", details: "", preferred_size: "L",
  status, status_label: status, items: ["Blouse"], created_at: "2026-10-18T10:00:00Z"
});

describe("online order attention flags", () => {
  it("flags a refund only when a paid order is cancelled", () => {
    expect(refundDue(onlineOrder({ status: "cancelled", payment_status: "paid" }))).toBe(true);
    expect(refundDue(onlineOrder({ status: "cancelled", payment_status: "pending" }))).toBe(false);
    expect(refundDue(onlineOrder({ status: "shipped", payment_status: "paid" }))).toBe(false);
  });

  it("counts only requests still waiting on the shop", () => {
    expect(openRequests(onlineOrder({ requests: [req("requested"), req("pickup"), req("completed"), req("rejected")] }))).toHaveLength(2);
    expect(openRequests(onlineOrder())).toHaveLength(0);
  });

  it("asks for tracking on shipped orders without an AWB (newer webstores only)", () => {
    expect(missingTracking(onlineOrder({ status: "shipped", tracking: { ...tracking, number: "" } }))).toBe(true);
    expect(missingTracking(onlineOrder({ status: "shipped", tracking }))).toBe(false);
    expect(missingTracking(onlineOrder({ status: "shipped" }))).toBe(false);
  });

  it("builds courier tracking links", () => {
    expect(courierTrackingUrl("delhivery", " 1490 22 ")).toBe("https://www.delhivery.com/track/package/1490%2022");
    expect(courierTrackingUrl("Unknown Co", "1")).toBe("");
    expect(courierTrackingUrl("DTDC", "")).toBe("");
  });

  it("puts courier and AWB in the Shipped WhatsApp message, even with an older saved template", () => {
    const order = onlineOrder({ status: "shipped", tracking });
    expect(trackingLine(order)).toBe("Courier: Delhivery · AWB AWB9 · Track: https://www.delhivery.com/track/package/AWB9");
    const shipped = onlineCustomerMessages(order, STORE_SETTINGS).find((m) => m.label === "Shipped");
    expect(shipped?.text).toContain("AWB AWB9");
    const legacy = { ...STORE_SETTINGS, messageTemplates: { ...STORE_SETTINGS.messageTemplates, onlineShipped: "Hi {name}, {receipt} shipped." } };
    expect(onlineCustomerMessages(order, legacy).find((m) => m.label === "Shipped")?.text).toBe(
      "Hi Asha Rao, FD-20261017-ABC123 shipped. Courier: Delhivery · AWB AWB9 · Track: https://www.delhivery.com/track/package/AWB9"
    );
  });
});

describe("request updates", () => {
  beforeEach(() => {
    vi.stubEnv("WEBSTORE_API_URL", "https://shop.example");
    vi.stubEnv("WEBSTORE_API_TOKEN", "t");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("posts status and reply to the webstore request endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ order: { order_number: "FD-1" } }), { status: 200 }));
    await updateOnlineOrderRequest("FD-1", 7, { status: "approved", staff_note: "Pickup Monday" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://shop.example/api/online-orders/FD-1/requests/7/");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ status: "approved", staff_note: "Pickup Monday" });
  });
});
