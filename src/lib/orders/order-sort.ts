import type { OrderWithCustomer } from "@/types/domain";

export type OrderSortKey = "deliveryDate" | "orderDate" | "receiptNumber" | "balance" | "total";

export const orderSortOptions: { value: OrderSortKey; label: string }[] = [
  { value: "deliveryDate", label: "Delivery date" },
  { value: "orderDate", label: "Order date" },
  { value: "receiptNumber", label: "Receipt number" },
  { value: "balance", label: "Balance" },
  { value: "total", label: "Total" }
];

function orderTieBreaker(a: OrderWithCustomer, b: OrderWithCustomer) {
  return (
    a.deliveryDate.localeCompare(b.deliveryDate) ||
    (a.receiptNumber ?? "").localeCompare(b.receiptNumber ?? "") ||
    a.customer.fullName.localeCompare(b.customer.fullName)
  );
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
