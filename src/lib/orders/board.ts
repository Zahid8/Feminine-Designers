import type { OrderStatus } from "@/types/domain";

export type BoardColumnId = "new" | "stitching" | "ready" | "delivered";

export const BOARD_COLUMNS: { id: BoardColumnId; title: string; hint: string; status: OrderStatus }[] = [
  { id: "new", title: "New", hint: "Waiting to be cut", status: "New" },
  { id: "stitching", title: "In Stitching", hint: "On the machines", status: "In Stitching" },
  { id: "ready", title: "Ready", hint: "Waiting for pickup", status: "Ready" },
  { id: "delivered", title: "Delivered", hint: "Handed over in the last 7 days", status: "Delivered" }
];

/** Delivered orders stay on the board for a week so mistakes can be moved back. */
export const DELIVERED_BOARD_DAYS = 7;

/** Which column an order belongs to; drafts sit with new orders. Cancelled orders are not on the board. */
export function boardColumnFor(status: OrderStatus): BoardColumnId | undefined {
  if (status === "Draft" || status === "New") return "new";
  if (status === "In Stitching") return "stitching";
  if (status === "Ready") return "ready";
  if (status === "Delivered") return "delivered";
  return undefined;
}

/** Open orders, plus delivered orders last touched within the delivered window. */
export function isOnBoard(order: { status: OrderStatus; updatedAt: string }, now = new Date()) {
  if (order.status === "Delivered") {
    const updated = new Date(order.updatedAt).getTime();
    return Number.isFinite(updated) && now.getTime() - updated <= DELIVERED_BOARD_DAYS * 86_400_000;
  }
  return boardColumnFor(order.status) !== undefined;
}

/** Next and previous workflow stage for the board's move buttons. */
export function boardMoves(status: OrderStatus): { next?: OrderStatus; previous?: OrderStatus } {
  switch (status) {
    case "Draft":
    case "New":
      return { next: "In Stitching" };
    case "In Stitching":
      return { next: "Ready", previous: "New" };
    case "Ready":
      return { next: "Delivered", previous: "In Stitching" };
    case "Delivered":
      return { previous: "Ready" };
    default:
      return {};
  }
}
