import type { OrderWithCustomer, Priority } from "@/types/domain";

export type OrderSortKey = "deliveryDate" | "orderDate" | "receiptNumber" | "balance" | "total";

export const orderSortOptions: { value: OrderSortKey; label: string }[] = [
  { value: "deliveryDate", label: "Delivery date" },
  { value: "orderDate", label: "Order date" },
  { value: "receiptNumber", label: "Receipt number" },
  { value: "balance", label: "Balance" },
  { value: "total", label: "Total" }
];

const prioritySortRank: Record<Priority, number> = {
  Express: 0,
  Urgent: 1,
  Normal: 2
};

export type PriorityDeliverySortable = {
  priority: Priority;
  deliveryDate: string;
  receiptNumber?: string | null;
  customer: {
    fullName: string;
  };
};

export function compareOrdersByPriorityAndDelivery<T extends PriorityDeliverySortable>(a: T, b: T) {
  return (
    prioritySortRank[a.priority] - prioritySortRank[b.priority] ||
    a.deliveryDate.localeCompare(b.deliveryDate) ||
    (a.receiptNumber ?? "").localeCompare(b.receiptNumber ?? "") ||
    a.customer.fullName.localeCompare(b.customer.fullName)
  );
}

function orderTieBreaker(a: OrderWithCustomer, b: OrderWithCustomer) {
  return compareOrdersByPriorityAndDelivery(a, b) || a.orderDate.localeCompare(b.orderDate);
}

export function sortOrders<T extends OrderWithCustomer>(orders: T[], sortKey: OrderSortKey): T[] {
  return [...orders].sort((a, b) => {
    if (sortKey === "balance") {
      return b.totals.balanceDuePaise - a.totals.balanceDuePaise || orderTieBreaker(a, b);
    }
    if (sortKey === "total") {
      return b.totals.grandTotalPaise - a.totals.grandTotalPaise || orderTieBreaker(a, b);
    }
    if (sortKey === "orderDate") {
      return a.orderDate.localeCompare(b.orderDate) || orderTieBreaker(a, b);
    }
    if (sortKey === "receiptNumber") {
      return (a.receiptNumber ?? "").localeCompare(b.receiptNumber ?? "") || orderTieBreaker(a, b);
    }
    return orderTieBreaker(a, b);
  });
}
