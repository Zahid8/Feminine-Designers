import { createHmac, timingSafeEqual } from "node:crypto";

// Server-only: imports node:crypto and reads secrets.
const ORDER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNATURE_LENGTH = 22; // 22 base64url chars ≈ 132 bits

/**
 * Key for customer bill links. Uses BILL_LINK_SECRET when set, otherwise derives a
 * dedicated key from the Supabase service-role key (already a server-only secret),
 * so links work without extra configuration. Changing either secret invalidates
 * every previously shared link.
 */
function signingKey() {
  const secret = process.env.BILL_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return undefined;
  return createHmac("sha256", secret).update("feminine-designer/bill-link/v1").digest();
}

export function billLinkSignature(orderId: string) {
  const key = signingKey();
  if (!key || !ORDER_ID_PATTERN.test(orderId)) return undefined;
  return createHmac("sha256", key).update(orderId.toLowerCase()).digest("base64url").slice(0, SIGNATURE_LENGTH);
}

/** Public path for an order's customer bill, or undefined when links can't be signed. */
export function billLinkPath(orderId: string) {
  const signature = billLinkSignature(orderId);
  return signature ? `/bill/${orderId}/${signature}` : undefined;
}

export function verifyBillLink(orderId: string, signature: string) {
  const expected = billLinkSignature(orderId);
  if (!expected || typeof signature !== "string" || signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Online (webstore) orders are identified by their order number, e.g. FD-20261017-ABC123.
// They use their own key context so a signature for one kind of id never verifies the other.
const ONLINE_ORDER_PATTERN = /^[A-Z0-9][A-Z0-9-]{3,39}$/i;

function onlineSigningKey() {
  const secret = process.env.BILL_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return undefined;
  return createHmac("sha256", secret).update("feminine-designer/online-bill-link/v1").digest();
}

export function onlineBillLinkSignature(orderNumber: string) {
  const key = onlineSigningKey();
  if (!key || !ONLINE_ORDER_PATTERN.test(orderNumber)) return undefined;
  return createHmac("sha256", key).update(orderNumber.toUpperCase()).digest("base64url").slice(0, SIGNATURE_LENGTH);
}

/** Public path for an online order's bill, or undefined when links can't be signed. */
export function onlineBillLinkPath(orderNumber: string) {
  const signature = onlineBillLinkSignature(orderNumber);
  return signature ? `/bill/online/${encodeURIComponent(orderNumber.toUpperCase())}/${signature}` : undefined;
}

export function verifyOnlineBillLink(orderNumber: string, signature: string) {
  const expected = onlineBillLinkSignature(orderNumber);
  if (!expected || typeof signature !== "string" || signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
