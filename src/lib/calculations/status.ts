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
