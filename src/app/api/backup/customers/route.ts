import { csvCell } from "@/lib/reports/orders-csv";
import { todayISO } from "@/lib/utils/date";
import { listCustomers } from "@/services/customers/customer-service";
import { listOrders } from "@/services/orders/order-service";

/** Staff-only backup: every customer with order count and outstanding balance. */
export async function GET() {
  const [customers, orders] = await Promise.all([listCustomers(), listOrders()]);
  const stats = new Map<string, { orders: number; duePaise: number; lastOrder: string }>();
  for (const order of orders) {
    const current = stats.get(order.customerId) ?? { orders: 0, duePaise: 0, lastOrder: "" };
    current.orders += 1;
    current.duePaise += Math.max(0, order.totals.balanceDuePaise);
    if (order.orderDate > current.lastOrder) current.lastOrder = order.orderDate;
    stats.set(order.customerId, current);
  }
  const rows = [
    ["Name", "Phone", "Other phone", "Email", "Address", "Orders", "Last order", "Outstanding", "Customer since"],
    ...customers.map((customer) => {
      const stat = stats.get(customer.id);
      return [
        customer.fullName,
        customer.phonePrimary,
        customer.phoneSecondary ?? "",
        customer.email ?? "",
        customer.address ?? "",
        String(stat?.orders ?? 0),
        stat?.lastOrder ?? "",
        ((stat?.duePaise ?? 0) / 100).toFixed(2),
        customer.createdAt.slice(0, 10)
      ];
    })
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${todayISO()}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
