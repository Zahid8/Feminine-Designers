import { afterEach, describe, expect, it, vi } from "vitest";
import { billLinkPath, billLinkSignature, verifyBillLink } from "./bill-link";

const orderId = "a7963b0c-dd18-4f10-8627-f839dda96798";

afterEach(() => vi.unstubAllEnvs());

describe("bill links", () => {
  it("signs order ids and verifies only the matching signature", () => {
    vi.stubEnv("BILL_LINK_SECRET", "test-secret");
    const path = billLinkPath(orderId)!;
    const signature = path.split("/").at(-1)!;

    expect(path).toMatch(new RegExp(`^/bill/${orderId}/[A-Za-z0-9_-]{22}$`));
    expect(verifyBillLink(orderId, signature)).toBe(true);
    expect(verifyBillLink(orderId, signature.slice(0, -1) + (signature.endsWith("A") ? "B" : "A"))).toBe(false);
    expect(verifyBillLink("d37974d8-05bf-45cf-9f60-4c296268e066", signature)).toBe(false);
    expect(verifyBillLink(orderId, "short")).toBe(false);
  });

  it("changes every signature when the secret changes", () => {
    vi.stubEnv("BILL_LINK_SECRET", "first");
    const first = billLinkSignature(orderId);
    vi.stubEnv("BILL_LINK_SECRET", "second");
    expect(billLinkSignature(orderId)).not.toBe(first);
  });

  it("refuses to sign without a secret or for non-UUID ids", () => {
    vi.stubEnv("BILL_LINK_SECRET", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(billLinkPath(orderId)).toBeUndefined();
    vi.stubEnv("BILL_LINK_SECRET", "test-secret");
    expect(billLinkPath("order-1")).toBeUndefined();
    expect(verifyBillLink("../etc", "x".repeat(22))).toBe(false);
  });
});
