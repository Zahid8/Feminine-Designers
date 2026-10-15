import type { OrderStatus } from "@/types/domain";
import { STATUS_TRANSITIONS } from "@/lib/constants/business";

export function canTransitionStatus(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextAllowedStatuses(from: OrderStatus): OrderStatus[] {
  return (STATUS_TRANSITIONS[from] ?? []) as OrderStatus[];
}

export function isCompletedOrderForList(order: { status: OrderStatus }): boolean {
  return order.status === "Delivered";
}

export function isPastOrderForList(order: { status: OrderStatus; deliveryDate: string }, today: string): boolean {
  return !isCompletedOrderForList(order) && order.deliveryDate < today;
}

export type DeliveryUrgencyTone = "overdue" | "today" | "soon" | "later";

export interface DeliveryUrgency {
  label: string;
  tone: DeliveryUrgencyTone;
  days: number;
}

function isoDayNumber(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/**
 * Human-friendly delivery countdown for open orders, based on India-date ISO
 * strings (`todayISO()`). Delivered and cancelled orders have no urgency.
 */
export function deliveryUrgency(deliveryDate: string, status: OrderStatus, today: string): DeliveryUrgency | undefined {
  if (status === "Delivered" || status === "Cancelled" || !deliveryDate) return undefined;
  const days = isoDayNumber(deliveryDate) - isoDayNumber(today);
  if (Number.isNaN(days)) return undefined;
  if (days < 0) return { label: `Overdue ${-days}d`, tone: "overdue", days };
  if (days === 0) return { label: "Due today", tone: "today", days };
  if (days === 1) return { label: "Tomorrow", tone: "soon", days };
  if (days <= 3) return { label: `In ${days} days`, tone: "soon", days };
  return { label: `In ${days} days`, tone: "later", days };
}
