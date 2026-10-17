"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MadeToMeasureBadge, OnlinePaymentBadge, OnlineStatusBadge } from "@/components/online-orders/online-order-badges";
import { cardNavigationHandler } from "@/lib/ui/card-navigation";
import { formatDateTime } from "@/lib/utils/date";
import { formatINR, rupeesToPaise } from "@/lib/utils/money";
import type { OnlineOrder } from "@/services/online-orders/online-order-service";

export function summarizeOnlineItems(order: OnlineOrder) {
  return order.items
    .map((item) => `${item.quantity > 1 ? `${item.quantity}× ` : ""}${item.product_name}${item.size ? ` (${item.size})` : ""}`)
    .join(", ");
}

function rupees(value: string) {
  return formatINR(rupeesToPaise(Number.parseFloat(value) || 0));
}

export function OnlineOrderTable({ orders }: { orders: OnlineOrder[] }) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted shadow-raised-sm">
        No online orders match this view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-raised ring-1 ring-white/70">
      <div className="hidden max-h-[calc(100vh-17rem)] overflow-auto overscroll-contain [scrollbar-width:thin] lg:block">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-peach text-xs uppercase text-muted-strong shadow-[0_1px_0_var(--color-line)]">
            <tr>
              {["Order", "Customer", "Items", "Placed", "Status", "Total", "Action"].map((label) => (
                <th key={label} className="px-4 py-3 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {orders.map((order) => {
              const href = `/online-orders/${encodeURIComponent(order.order_number)}`;
              return (
                <tr
                  key={order.order_number}
                  className="cursor-pointer align-top transition hover:bg-paper-warm"
                  onClick={cardNavigationHandler(router.push, href)}
                  onAuxClick={cardNavigationHandler(router.push, href)}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-wine-ink">
                    <Link href={href} className="hover:text-rose hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={href} className="font-semibold hover:text-wine">
                      {order.customer.name}
                    </Link>
                    <p className="whitespace-nowrap text-xs text-muted">{order.customer.phone || order.customer.email}</p>
                  </td>
                  <td className="max-w-64 px-4 py-3">
                    <p className="line-clamp-2" title={summarizeOnlineItems(order)}>
                      {summarizeOnlineItems(order)}
                    </p>
                    {order.has_made_to_measure ? (
                      <div className="mt-1">
                        <MadeToMeasureBadge />
                      </div>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDateTime(order.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-56 flex-wrap gap-1.5">
                      <OnlineStatusBadge status={order.status} label={order.status_label} />
                      <OnlinePaymentBadge status={order.payment_status} label={order.payment_status_label} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{order.payment_method_label}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{rupees(order.total)}</td>
                  <td className="px-4 py-3">
                    <Link
                      className="inline-flex min-h-9 items-center justify-center rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold text-wine-ink shadow-raised-sm transition hover:border-gold hover:bg-blush focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                      href={href}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line-soft lg:hidden">
        {orders.map((order) => {
          const href = `/online-orders/${encodeURIComponent(order.order_number)}`;
          return (
            <li key={order.order_number}>
              <Link href={href} className="block px-4 py-4 transition hover:bg-paper-warm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-wine-ink">{order.order_number}</p>
                    <p className="truncate text-sm font-semibold">{order.customer.name}</p>
                    <p className="truncate text-xs text-muted">{summarizeOnlineItems(order)}</p>
                  </div>
                  <p className="whitespace-nowrap font-semibold tabular-nums">{rupees(order.total)}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <OnlineStatusBadge status={order.status} label={order.status_label} />
                  <OnlinePaymentBadge status={order.payment_status} label={order.payment_status_label} />
                  {order.has_made_to_measure ? <MadeToMeasureBadge /> : null}
                </div>
                <p className="mt-1 text-xs text-muted">{formatDateTime(order.created_at)}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
