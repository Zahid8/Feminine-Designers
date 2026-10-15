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
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted shadow-raised-sm">
        No orders match this view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-raised ring-1 ring-white/70">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-gradient-to-r from-cream to-paper p-3">
        <label className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-2 py-1 text-xs font-semibold shadow-raised-sm">
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
          <label key={key} className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-2 py-1 text-xs font-semibold shadow-raised-sm">
            <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumn(key)} />
            {label}
          </label>
        ))}
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-peach text-xs uppercase text-muted-strong">
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
          <tbody className="divide-y divide-line-soft">
            {sortedOrders.map((order) => (
              <tr key={order.id} className="align-top transition hover:bg-paper-warm">
                {visibleColumns.complete ? (
                  <td className="px-4 py-4">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-wine-ink">
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
                {visibleColumns.receipt ? <td className="px-4 py-4 font-semibold text-wine-ink">{order.receiptNumber}</td> : null}
                {visibleColumns.customer ? <td className="px-4 py-4">
                  <p className="font-semibold">{order.customer.fullName}</p>
                  <p className="text-xs text-muted">{order.customer.phonePrimary}</p>
                </td> : null}
                {visibleColumns.garments ? <td className="px-4 py-4">{order.items.map((item) => item.garmentType).join(", ")}</td> : null}
                {visibleColumns.dates ? <td className="px-4 py-4">
                  <p>Order: {formatDate(order.orderDate)}</p>
                  <p className={order.overdue ? "font-semibold text-danger" : ""}>
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
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold text-wine-ink shadow-raised-sm transition hover:border-gold hover:bg-blush focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
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
          <div key={order.id} className="rounded-xl border border-line bg-surface p-4 shadow-raised-sm">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/orders/${order.id}`}>
                <p className="font-semibold text-wine-ink">{order.receiptNumber}</p>
                <p className="text-sm">{order.customer.fullName}</p>
                <p className="text-xs text-muted">{order.customer.phonePrimary}</p>
              </Link>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <span>Delivery {formatDate(order.deliveryDate)}</span>
              <span className="text-right font-semibold">{formatINR(order.totals.balanceDuePaise)}</span>
            </div>
            <label className="mt-3 flex items-center justify-between rounded-xl border border-line-strong bg-cream px-3 py-2 text-sm font-semibold shadow-pressed">
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
