"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { OnlinePaymentBadge, OnlineStatusBadge, OrderTypeBadge } from "@/components/online-orders/online-order-badges";
import { OnlineOrderNextStageButton } from "@/components/online-orders/online-order-stage-actions";
import { cardNavigationHandler } from "@/lib/ui/card-navigation";
import { formatDateTime } from "@/lib/utils/date";
import { formatINR, rupeesToPaise } from "@/lib/utils/money";
import { missingTracking, openRequests, refundDue, orderTypeOf, type OnlineOrder } from "@/services/online-orders/online-order-service";

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
              {["Order", "Customer", "Items", "Status", "Total", "Action"].map((label) => (
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
                    <p className="mt-0.5 text-xs font-normal text-muted">{formatDateTime(order.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={href} className="font-semibold hover:text-wine">
                      {order.customer.name}
                    </Link>
                    <p className="whitespace-nowrap text-xs text-muted">{order.customer.phone || order.customer.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      {order.location_url ? (
                        <a
                          href={order.location_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-section-online hover:underline"
                          title="Open the customer's Google Maps pin"
                        >
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          Map
                        </a>
                      ) : null}
                      {(order.customer.orders_count ?? 1) > 1 ? (
                        <span className="rounded-full bg-peach px-2 py-0.5 font-semibold text-wine-ink">Returning · {order.customer.orders_count}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="max-w-64 px-4 py-3">
                    <p className="line-clamp-2" title={summarizeOnlineItems(order)}>
                      {summarizeOnlineItems(order)}
                    </p>
                    <div className="mt-1">
                      <OrderTypeBadge type={orderTypeOf(order)} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-56 flex-wrap gap-1.5">
                      <OnlineStatusBadge status={order.status} label={order.status_label} />
                      <OnlinePaymentBadge status={order.payment_status} label={order.payment_status_label} />
                      <OrderFlags order={order} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{order.payment_method_label}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{rupees(order.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                    <OnlineOrderNextStageButton orderNumber={order.order_number} status={order.status} />
                    <Link
                      className="inline-flex min-h-9 items-center justify-center rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold text-wine-ink shadow-raised-sm transition hover:border-gold hover:bg-blush focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                      href={href}
                    >
                      Open
                    </Link>
                    </div>
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
                  <OrderTypeBadge type={orderTypeOf(order)} />
                  <OrderFlags order={order} />
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

/** Things that need the manager's attention on this order. */
function OrderFlags({ order }: { order: OnlineOrder }) {
  const requests = openRequests(order);
  return (
    <>
      {refundDue(order) ? <span className="rounded-full bg-[#fbe3e1] px-2.5 py-1 text-xs font-bold text-danger">Refund due</span> : null}
      {requests.length ? (
        <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-bronze ring-1 ring-gold">{requests[0].kind_label.split(" (")[0]} request</span>
      ) : null}
      {order.gift_message ? <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-bold text-wine">Gift</span> : null}
      {missingTracking(order) ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">Add tracking</span> : null}
    </>
  );
}
