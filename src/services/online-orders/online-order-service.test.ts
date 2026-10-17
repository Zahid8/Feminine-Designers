import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOnlineOrder, listOnlineOrders, updateOnlineOrder, WebstoreError } from "./online-order-service";

const sampleOrder = {
  order_number: "FD-20261017-ABC123",
  status: "pending",
  payment_status: "pending",
  payment_method: "manual_upi",
  items: [],
  total: "2400.00"
};

describe("online-order-service", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.WEBSTORE_API_URL = "https://shop.example.com/";
    process.env.WEBSTORE_API_TOKEN = "secret-token";
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    delete process.env.WEBSTORE_API_URL;
    delete process.env.WEBSTORE_API_TOKEN;
  });

  it("lists orders with the bearer token and query params", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ orders: [sampleOrder], has_more: false, statuses: [], payment_statuses: [], generated_at: "now" }), { status: 200 })
    );
    const result = await listOnlineOrders({ query: "asha", status: "pending" });
    expect(result.orders).toHaveLength(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://shop.example.com/api/online-orders/?q=asha&status=pending&limit=200");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret-token");
    expect(init.cache).toBe("no-store");
  });

  it("returns null for an unknown order and throws on other errors", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Order not found." }), { status: 404 }));
    expect(await getOnlineOrder("FD-NOPE")).toBeNull();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Invalid or missing API token." }), { status: 401 }));
    await expect(getOnlineOrder("FD-X")).rejects.toMatchObject({ name: "WebstoreError", status: 401 });
  });

  it("posts status changes as JSON", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ order: { ...sampleOrder, status: "confirmed" } }), { status: 200 }));
    const order = await updateOnlineOrder("FD-20261017-ABC123", { status: "confirmed" });
    expect(order.status).toBe("confirmed");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"status":"confirmed"}');
  });

  it("fails clearly when the connection is not configured", async () => {
    delete process.env.WEBSTORE_API_TOKEN;
    await expect(listOnlineOrders()).rejects.toBeInstanceOf(WebstoreError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
