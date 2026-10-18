import { renderTemplate } from "@/lib/messages/render-template";
import { formatINR, rupeesToPaise } from "@/lib/utils/money";
import { orderTypeOf, stageLabel, type OnlineOrder } from "@/services/online-orders/online-order-service";
import type { StoreSettings } from "@/types/domain";

function paise(value: string | undefined) {
  return rupeesToPaise(Number.parseFloat(value ?? "0") || 0);
}

/** Money on an online order, in paise. The webstore marks an order paid in full or not at all. */
export function onlineBillAmounts(order: OnlineOrder) {
  const totalPaise = paise(order.total);
  const paidPaise = order.payment_status === "paid" ? totalPaise : 0;
  return {
    subtotalPaise: paise(order.subtotal),
    discountPaise: paise(order.discount_total),
    shippingPaise: paise(order.shipping_total),
    totalPaise,
    paidPaise,
    balancePaise: Math.max(totalPaise - paidPaise, 0)
  };
}

/** "2× Silk Blouse (Custom size), Kurti (M)" for messages. */
export function onlineItemsSummary(order: OnlineOrder) {
  return order.items
    .map((item) => {
      const fit = item.made_to_measure ? "Custom size" : item.size;
      return `${item.quantity > 1 ? `${item.quantity}× ` : ""}${item.product_name}${fit ? ` (${fit})` : ""}`;
    })
    .join(", ");
}

export function onlineBillFileName(orderNumber: string) {
  return `Bill_${orderNumber.toUpperCase()}.pdf`;
}

export function onlineMessageValues(order: OnlineOrder, settings: StoreSettings, billUrl?: string) {
  const amounts = onlineBillAmounts(order);
  return {
    name: order.customer.name,
    store: settings.storeName,
    receipt: order.order_number,
    items: onlineItemsSummary(order),
    total: formatINR(amounts.totalPaise),
    paid: formatINR(amounts.paidPaise),
    balance: formatINR(amounts.balancePaise),
    delivery: order.tracking?.expected_delivery ?? "",
    tracking: trackingLine(order),
    bill_link: billUrl ?? ""
  };
}

/** "Courier: Delhivery · AWB 123 · Track: https://…" once tracking is entered. */
export function trackingLine(order: OnlineOrder) {
  const t = order.tracking;
  if (!t || !t.number) return "";
  return [`Courier: ${t.courier || "—"}`, `AWB ${t.number}`, t.url ? `Track: ${t.url}` : ""].filter(Boolean).join(" · ");
}

const SHIPPED_OR_LATER = new Set(["shipped", "delivered", "completed"]);
const DELIVERED_OR_LATER = new Set(["delivered", "completed"]);

/** WhatsApp messages offered for an online order, matching where the order is. */
export function onlineCustomerMessages(order: OnlineOrder, settings: StoreSettings, billUrl?: string) {
  const values = onlineMessageValues(order, settings, billUrl);
  const templates = settings.messageTemplates;
  const balanceDue = onlineBillAmounts(order).balancePaise > 0 && order.status !== "cancelled";
  return [
    { label: "Order confirmation", text: renderTemplate(templates.onlineOrderConfirmed, values) },
    ...(SHIPPED_OR_LATER.has(order.status) ? [{ label: "Shipped", text: withTracking(renderTemplate(templates.onlineShipped, values), templates.onlineShipped, values.tracking) }] : []),
    ...(DELIVERED_OR_LATER.has(order.status) ? [{ label: "Delivered", text: renderTemplate(templates.onlineDelivered, values) }] : []),
    ...(balanceDue ? [{ label: "Payment reminder", text: renderTemplate(templates.balanceReminder, values) }] : [])
  ];
}

// Older saved templates have no {tracking} placeholder: append it so customers still get the AWB.
function withTracking(text: string, template: string, tracking: string) {
  return tracking && !template.includes("{tracking}") ? `${text} ${tracking}` : text;
}

/** Short fit/stage line for the bill header area. */
export function onlineOrderStatusLine(order: OnlineOrder) {
  return `${stageLabel(order.status, order.status_label)} · ${orderTypeOf(order) === "ready_made" ? "Ready-made" : "Custom size"}`;
}
