"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { OrderWithCustomer } from "@/types/domain";
import { StatusBadge, PaymentBadge, PriorityBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils/date";
import { formatINR } from "@/lib/utils/money";
import { orderSortOptions, sortOrders, type OrderSortKey } from "@/lib/orders/order-sort";
import { setOrderCompletedAction } from "@/app/orders/actions";

export function OrderTable({ orders }: { orders: (OrderWithCustomer & { overdue?: boolean; daysOverdue?: number })[] }) {
  const router = useRouter();
  const [pendingOrderIds, setPendingOrderIds] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<OrderSortKey>("deliveryDate");
  const sortedOrders = sortOrders(orders, sortKey);
  const [visibleColumns, setVisibleColumns] = useState({
    complete: true,
    receipt: true,
    customer: true,
    garments: true,
    dates: true,
    status: true,
    total: true,
    balance: true,
    action: true
  });
  const columns = [
    ["complete", "Complete"],
    ["receipt", "Receipt"],
    ["customer", "Customer"],
    ["garments", "Garments"],
    ["dates", "Dates"],
    ["status", "Status"],
    ["total", "Total"],
    ["balance", "Balance"],
    ["action", "Action"]
  ] as const;

  function toggleColumn(column: keyof typeof visibleColumns) {
    setVisibleColumns((current) => ({ ...current, [column]: !current[column] }));
  }

  function setOrderCompleted(orderId: string, completed: boolean) {
    setPendingOrderIds((current) => [...current, orderId]);
    startTransition(() => {
      void setOrderCompletedAction(orderId, completed)
        .then(() => router.refresh())
        .finally(() => {
          setPendingOrderIds((current) => current.filter((id) => id !== orderId));
        });
    });
  }

  if (sortedOrders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#dfc5a8] bg-white/90 p-8 text-center text-sm text-[#7c6d66] shadow-sm">
        No orders match this view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#ead8c3] bg-white/95 shadow-[0_18px_45px_rgba(76,21,37,0.08)] ring-1 ring-white/70">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#ead8c3] bg-gradient-to-r from-[#fff7ec] to-[#fffdfa] p-3">
        <label className="flex items-center gap-2 rounded-md border border-[#dfc5a8] bg-white/95 px-2 py-1 text-xs font-semibold shadow-sm">
          Sort by
          <select
            aria-label="Sort orders by"
            className="bg-transparent text-xs outline-none"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as OrderSortKey)}
          >
            {orderSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {columns.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 rounded-md border border-[#dfc5a8] bg-white/95 px-2 py-1 text-xs font-semibold shadow-sm">
            <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumn(key)} />
            {label}
          </label>
        ))}
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fff1df] text-xs uppercase text-[#6f625d]">
            <tr>
              {columns.map(([key, label]) =>
                visibleColumns[key] ? (
                  <th key={key} className="px-4 py-3 font-semibold">
                    {label}
                  </th>
                ) : null
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0dfca]">
            {sortedOrders.map((order) => (
              <tr key={order.id} className="align-top transition hover:bg-[#fffaf4]">
                {visibleColumns.complete ? (
                  <td className="px-4 py-4">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#4c1525]">
                      <input
                        type="checkbox"
                        className="h-5 w-5"
                        checked={order.status === "Delivered"}
                        disabled={pendingOrderIds.includes(order.id)}
                        onChange={(event) => setOrderCompleted(order.id, event.target.checked)}
                      />
                      Done
                    </label>
                  </td>
                ) : null}
                {visibleColumns.receipt ? <td className="px-4 py-4 font-semibold text-[#4c1525]">{order.receiptNumber}</td> : null}
                {visibleColumns.customer ? <td className="px-4 py-4">
                  <p className="font-semibold">{order.customer.fullName}</p>
                  <p className="text-xs text-[#7c6d66]">{order.customer.phonePrimary}</p>
                </td> : null}
                {visibleColumns.garments ? <td className="px-4 py-4">{order.items.map((item) => item.garmentType).join(", ")}</td> : null}
                {visibleColumns.dates ? <td className="px-4 py-4">
                  <p>Order: {formatDate(order.orderDate)}</p>
                  <p className={order.overdue ? "font-semibold text-[#a83232]" : ""}>
                    Delivery: {formatDate(order.deliveryDate)}
                  </p>
                </td> : null}
                {visibleColumns.status ? <td className="space-y-2 px-4 py-4">
                  <StatusBadge status={order.status} />
                  <PriorityBadge priority={order.priority} />
                  <PaymentBadge status={order.totals.paymentStatus} />
                </td> : null}
                {visibleColumns.total ? <td className="px-4 py-4">{formatINR(order.totals.grandTotalPaise)}</td> : null}
                {visibleColumns.balance ? <td className="px-4 py-4 font-semibold">{formatINR(order.totals.balanceDuePaise)}</td> : null}
                {visibleColumns.action ? <td className="px-4 py-4">
                  <Link
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#dfc5a8] bg-white/95 px-3 py-1.5 text-sm font-semibold text-[#4c1525] shadow-sm transition hover:border-[#d99a62] hover:bg-[#fff5ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d99a62]"
                    href={`/orders/${order.id}`}
                  >
                    Open
                  </Link>
                </td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 lg:hidden">
        {sortedOrders.map((order) => (
          <div key={order.id} className="rounded-md border border-[#ead8c3] bg-white/95 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/orders/${order.id}`}>
                <p className="font-semibold text-[#4c1525]">{order.receiptNumber}</p>
                <p className="text-sm">{order.customer.fullName}</p>
                <p className="text-xs text-[#7c6d66]">{order.customer.phonePrimary}</p>
              </Link>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <span>Delivery {formatDate(order.deliveryDate)}</span>
              <span className="text-right font-semibold">{formatINR(order.totals.balanceDuePaise)}</span>
            </div>
            <label className="mt-3 flex items-center justify-between rounded-md border border-[#dfc5a8] bg-[#fff7ec] px-3 py-2 text-sm font-semibold shadow-inner shadow-[#f5e3cf]/50">
              <span>Order complete</span>
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={order.status === "Delivered"}
                disabled={pendingOrderIds.includes(order.id)}
                onChange={(event) => setOrderCompleted(order.id, event.target.checked)}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
