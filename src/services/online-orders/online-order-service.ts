import { webstoreEnv, hasWebstoreEnv } from "@/lib/webstore/env";

export type OnlineOrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "completed" | "cancelled";
/** ready_made: every piece off the rack; made_to_measure: every piece custom size; mixed: both. */
export type OnlineOrderType = "ready_made" | "made_to_measure" | "mixed";
export type OnlinePaymentStatus = "pending" | "awaiting_review" | "paid" | "failed" | "refunded";

export interface OnlineOrderItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  line_total: string;
  color: string;
  size: string;
  made_to_measure: boolean;
  customization: { measurements: Record<string, string>; sleeve_style: string; notes: string } | null;
  customization_summary: { label: string; value: string }[];
  product_url: string | null;
  // Sent by newer webstore versions.
  sleeve_style?: string;
  sleeve_style_label?: string;
  tailor_notes?: string;
  category?: string;
  image_url?: string | null;
}

export type OnlineRequestStatus = "requested" | "approved" | "pickup" | "completed" | "rejected";

export interface OnlineOrderTracking {
  courier: string;
  number: string;
  url: string | null;
  expected_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface OnlineOrderEvent {
  status: OnlineOrderStatus;
  label: string;
  note: string;
  at: string;
}

export interface OnlineOrderRequest {
  id: number;
  kind: "exchange" | "alteration" | "problem";
  kind_label: string;
  reason: string;
  details: string;
  preferred_size: string;
  status: OnlineRequestStatus;
  status_label: string;
  items: string[];
  created_at: string;
}

export interface OnlineOrder {
  order_number: string;
  status: OnlineOrderStatus;
  status_label: string;
  payment_status: OnlinePaymentStatus;
  payment_status_label: string;
  payment_method: string;
  payment_method_label: string;
  payment_reference: string;
  payment_notes?: string;
  gateway?: { order_id: string; payment_id: string } | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    account_id: number | null;
    has_account?: boolean;
    account_username?: string;
    verified_phone?: string;
    orders_count?: number;
  };
  shipping_address: string;
  /** Optional Google Maps pin the customer added at checkout. */
  location_url?: string | null;
  notes: string;
  currency: string;
  subtotal: string;
  discount_total: string;
  shipping_total: string;
  total: string;
  item_count: number;
  has_made_to_measure: boolean;
  /** Sent by newer webstore versions; use orderTypeOf() to read it safely. */
  order_type?: OnlineOrderType;
  order_type_label?: string;
  items: OnlineOrderItem[];
  // Sent by newer webstore versions (courier tracking, history, customer requests).
  tracking?: OnlineOrderTracking;
  cancellation?: { at: string; by: "customer" | "staff" | "system" | ""; reason: string; refund_due: boolean } | null;
  timeline?: OnlineOrderEvent[];
  requests?: OnlineOrderRequest[];
  links: { admin: string; staff: string };
}

export interface OnlineOrderChanges {
  status?: OnlineOrderStatus;
  payment_status?: OnlinePaymentStatus;
  payment_notes?: string;
  courier?: string;
  tracking_number?: string;
  tracking_url?: string;
  expected_delivery?: string | null;
  cancel_reason?: string;
}

export interface OnlineOrderListResult {
  orders: OnlineOrder[];
  hasMore: boolean;
  statuses: { value: OnlineOrderStatus; label: string }[];
  paymentStatuses: { value: OnlinePaymentStatus; label: string }[];
  requestStatuses: { value: OnlineRequestStatus; label: string }[];
  generatedAt: string;
}

export type OnlineOrderTypeFilter = "ready_made" | "made_to_measure" | "All";

export interface OnlineOrderFilters {
  query?: string;
  status?: OnlineOrderStatus | "All";
  /** made_to_measure includes mixed orders (anything with a custom-size piece). */
  type?: OnlineOrderTypeFilter;
  limit?: number;
}

export class WebstoreError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "WebstoreError";
  }
}

async function webstoreFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!hasWebstoreEnv()) {
    throw new WebstoreError("Webstore connection is not configured (WEBSTORE_API_URL / WEBSTORE_API_TOKEN).");
  }
  const { url, token } = webstoreEnv();
  let response: Response;
  try {
    response = await fetch(`${url}${path}`, {
      ...init,
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(init.headers ?? {}) }
    });
  } catch (error) {
    throw new WebstoreError(`Could not reach the webstore at ${url}: ${error instanceof Error ? error.message : "network error"}`);
  }
  const body = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new WebstoreError(body.error ?? `Webstore returned HTTP ${response.status}.`, response.status);
  }
  return body;
}

export async function listOnlineOrders(filters: OnlineOrderFilters = {}): Promise<OnlineOrderListResult> {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status && filters.status !== "All") params.set("status", filters.status);
  if (filters.type && filters.type !== "All") params.set("type", filters.type);
  params.set("limit", String(filters.limit ?? 200));
  const data = await webstoreFetch<{
    orders: OnlineOrder[];
    has_more: boolean;
    statuses: OnlineOrderListResult["statuses"];
    payment_statuses: OnlineOrderListResult["paymentStatuses"];
    request_statuses?: OnlineOrderListResult["requestStatuses"];
    generated_at: string;
  }>(`/api/online-orders/?${params.toString()}`);
  return {
    orders: data.orders,
    hasMore: data.has_more,
    statuses: data.statuses,
    paymentStatuses: data.payment_statuses,
    requestStatuses: data.request_statuses ?? DEFAULT_REQUEST_STATUSES,
    generatedAt: data.generated_at
  };
}

export async function getOnlineOrder(orderNumber: string): Promise<OnlineOrder | null> {
  try {
    const data = await webstoreFetch<{ order: OnlineOrder }>(`/api/online-orders/${encodeURIComponent(orderNumber)}/`);
    return data.order;
  } catch (error) {
    if (error instanceof WebstoreError && error.status === 404) return null;
    throw error;
  }
}

export async function updateOnlineOrder(orderNumber: string, changes: OnlineOrderChanges): Promise<OnlineOrder> {
  const data = await webstoreFetch<{ order: OnlineOrder }>(`/api/online-orders/${encodeURIComponent(orderNumber)}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes)
  });
  return data.order;
}

export async function updateOnlineOrderRequest(
  orderNumber: string,
  requestId: number,
  changes: { status?: OnlineRequestStatus; staff_note?: string }
): Promise<OnlineOrder> {
  const data = await webstoreFetch<{ order: OnlineOrder }>(
    `/api/online-orders/${encodeURIComponent(orderNumber)}/requests/${requestId}/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) }
  );
  return data.order;
}

export const DEFAULT_REQUEST_STATUSES: { value: OnlineRequestStatus; label: string }[] = [
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "pickup", label: "Pickup arranged" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Not approved" }
];

/** Customer requests still waiting on the shop. */
export function openRequests(order: Pick<OnlineOrder, "requests">) {
  return (order.requests ?? []).filter((r) => r.status === "requested" || r.status === "approved" || r.status === "pickup");
}

/** Cancelled after an online payment: money has to go back. */
export function refundDue(order: Pick<OnlineOrder, "status" | "payment_status" | "cancellation">) {
  return order.status === "cancelled" && order.payment_status === "paid";
}

/** Shipped (or later) but nobody has entered the courier details yet. */
export function missingTracking(order: Pick<OnlineOrder, "status" | "tracking">) {
  return order.status === "shipped" && Boolean(order.tracking) && !order.tracking?.number;
}

// Common Indian couriers and their public tracking pages ({awb} is replaced).
export const COURIERS: { name: string; url: string }[] = [
  { name: "Delhivery", url: "https://www.delhivery.com/track/package/{awb}" },
  { name: "Blue Dart", url: "https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo={awb}" },
  { name: "DTDC", url: "https://www.dtdc.in/tracking.asp?strCnno={awb}" },
  { name: "India Post", url: "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consignmentnumber={awb}" },
  { name: "Ekart", url: "https://ekartlogistics.com/shipmenttrack/{awb}" },
  { name: "Xpressbees", url: "https://www.xpressbees.com/shipment/tracking?awbNo={awb}" },
  { name: "Shiprocket", url: "https://shiprocket.co/tracking/{awb}" },
  { name: "Shadowfax", url: "https://tracker.shadowfax.in/#/track/{awb}" }
];

export function courierTrackingUrl(courier: string, awb: string) {
  const match = COURIERS.find((c) => c.name.toLowerCase() === courier.trim().toLowerCase());
  return match && awb.trim() ? match.url.replace("{awb}", encodeURIComponent(awb.trim())) : "";
}

// Buckets used by the Online Orders tabs.
export const OPEN_STATUSES: OnlineOrderStatus[] = ["pending", "confirmed", "processing"];

export function isOpenOnlineOrder(order: OnlineOrder) {
  return OPEN_STATUSES.includes(order.status);
}

export function needsPaymentCheck(order: OnlineOrder) {
  return order.payment_status === "awaiting_review" || (order.payment_status === "pending" && order.payment_method === "manual_upi");
}

// Fulfilment stages, in the order an order moves through them. The webstore
// calls the last one "Completed"; staff know it as "Fulfilled".
export const FULFILMENT_STAGES: OnlineOrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "completed"];

const STAGE_LABELS: Partial<Record<OnlineOrderStatus, string>> = { completed: "Fulfilled" };

export function stageLabel(status: OnlineOrderStatus, fallback?: string) {
  return STAGE_LABELS[status] ?? fallback ?? status.charAt(0).toUpperCase() + status.slice(1);
}

/** The next stage to move an order to, or null once it is fulfilled or cancelled. */
export function nextStage(status: OnlineOrderStatus): OnlineOrderStatus | null {
  const index = FULFILMENT_STAGES.indexOf(status);
  if (index === -1 || index === FULFILMENT_STAGES.length - 1) return null;
  return FULFILMENT_STAGES[index + 1];
}

export const ORDER_TYPE_LABELS: Record<OnlineOrderType, string> = {
  ready_made: "Ready-made",
  made_to_measure: "Custom size",
  mixed: "Ready-made + custom size"
};

export function orderTypeOf(order: Pick<OnlineOrder, "order_type" | "items">): OnlineOrderType {
  if (order.order_type) return order.order_type;
  const custom = order.items.map((item) => item.made_to_measure);
  if (custom.length > 0 && custom.every(Boolean)) return "made_to_measure";
  return custom.some(Boolean) ? "mixed" : "ready_made";
}
