import { paiseToRupees } from "@/lib/utils/money";
import type { OrderWithCustomer } from "@/types/domain";

function cell(value: string | number) {
  const text = String(value);
  // Quote everything that could break a row; prefix formula-like text so spreadsheets don't execute it.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function ordersToCsv(orders: OrderWithCustomer[]) {
  const header = ["Receipt", "Order date", "Delivery date", "Customer", "Phone", "Status", "Garments", "Grand total", "Paid", "Balance", "Payment status"];
  const rows = orders.map((order) => [
    order.receiptNumber ?? "Draft",
    order.orderDate,
    order.deliveryDate,
    order.customer.fullName,
    order.customer.phonePrimary,
    order.status,
    order.items.map((item) => `${item.garmentType} x${item.quantity}`).join("; "),
    paiseToRupees(order.totals.grandTotalPaise).toFixed(2),
    paiseToRupees(order.totals.totalPaidPaise).toFixed(2),
    paiseToRupees(order.totals.balanceDuePaise).toFixed(2),
    order.totals.paymentStatus
  ]);
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
