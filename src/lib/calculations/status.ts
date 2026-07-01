import type { OrderStatus } from "@/types/domain";
import { STATUS_TRANSITIONS } from "@/lib/constants/business";

export function canTransitionStatus(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextAllowedStatuses(from: OrderStatus): OrderStatus[] {
  return (STATUS_TRANSITIONS[from] ?? []) as OrderStatus[];
}

export function isPastOrderForList(order: { status: OrderStatus; deliveryDate: string }, today: string): boolean {
  return order.status === "Delivered" || order.status === "Cancelled" || order.deliveryDate < today;
}
