import { webstoreEnv, hasWebstoreEnv } from "@/lib/webstore/env";

export type OnlineOrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "completed" | "cancelled";
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
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  customer: { name: string; email: string; phone: string; account_id: number | null };
  shipping_address: string;
  notes: string;
  currency: string;
  subtotal: string;
  discount_total: string;
  shipping_total: string;
  total: string;
  item_count: number;
  has_made_to_measure: boolean;
  items: OnlineOrderItem[];
  links: { admin: string; staff: string };
}

export interface OnlineOrderListResult {
  orders: OnlineOrder[];
  hasMore: boolean;
  statuses: { value: OnlineOrderStatus; label: string }[];
  paymentStatuses: { value: OnlinePaymentStatus; label: string }[];
  generatedAt: string;
}

export interface OnlineOrderFilters {
  query?: string;
  status?: OnlineOrderStatus | "All";
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
  params.set("limit", String(filters.limit ?? 200));
  const data = await webstoreFetch<{
    orders: OnlineOrder[];
    has_more: boolean;
    statuses: OnlineOrderListResult["statuses"];
    payment_statuses: OnlineOrderListResult["paymentStatuses"];
    generated_at: string;
  }>(`/api/online-orders/?${params.toString()}`);
  return {
    orders: data.orders,
    hasMore: data.has_more,
    statuses: data.statuses,
    paymentStatuses: data.payment_statuses,
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

export async function updateOnlineOrder(
  orderNumber: string,
  changes: { status?: OnlineOrderStatus; payment_status?: OnlinePaymentStatus; payment_notes?: string }
): Promise<OnlineOrder> {
  const data = await webstoreFetch<{ order: OnlineOrder }>(`/api/online-orders/${encodeURIComponent(orderNumber)}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes)
  });
  return data.order;
}

// Buckets used by the Online Orders tabs.
export const OPEN_STATUSES: OnlineOrderStatus[] = ["pending", "confirmed", "processing"];

export function isOpenOnlineOrder(order: OnlineOrder) {
  return OPEN_STATUSES.includes(order.status);
}

export function needsPaymentCheck(order: OnlineOrder) {
  return order.payment_status === "awaiting_review" || (order.payment_status === "pending" && order.payment_method === "manual_upi");
}
