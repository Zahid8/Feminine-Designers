import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeToMeasureBadge, OnlinePaymentBadge, OnlineStatusBadge } from "@/components/online-orders/online-order-badges";
import { OnlineOrderStatusForm } from "@/components/online-orders/online-order-status-form";
import { hasWebstoreEnv } from "@/lib/webstore/env";
import { formatDateTime } from "@/lib/utils/date";
import { formatINR, rupeesToPaise } from "@/lib/utils/money";
import { getOnlineOrder, listOnlineOrders } from "@/services/online-orders/online-order-service";

export const dynamic = "force-dynamic";

function rupees(value: string) {
  return formatINR(rupeesToPaise(Number.parseFloat(value) || 0));
}

export default async function OnlineOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  if (!hasWebstoreEnv()) notFound();
  const [order, meta] = await Promise.all([getOnlineOrder(orderNumber), listOnlineOrders({ limit: 1 })]);
  if (!order) notFound();
  const whatsappDigits = order.customer.phone.replace(/\D/g, "");
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits.length === 10 ? `91${whatsappDigits}` : whatsappDigits}` : null;

  return (
    <AppShell>
      <PageHeading
        title={order.order_number}
        description={`${order.customer.name} · ${order.customer.phone || order.customer.email} · Placed ${formatDateTime(order.created_at)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/online-orders" variant="secondary">
              Back to Online Orders
            </ButtonLink>
            <ButtonLink href={order.links.staff} target="_blank" rel="noopener" variant="secondary">
              <ExternalLink className="h-4 w-4" aria-hidden />
              Open on webstore
            </ButtonLink>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-5">
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Items</CardTitle>
              <div className="flex flex-wrap gap-1.5">
                <OnlineStatusBadge status={order.status} label={order.status_label} />
                <OnlinePaymentBadge status={order.payment_status} label={order.payment_status_label} />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {order.items.map((item, index) => (
                <div key={`${item.sku}-${index}`} className="rounded-2xl border border-line-soft bg-paper p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-wine-ink">
                        {item.quantity > 1 ? `${item.quantity} × ` : ""}
                        {item.product_name}
                      </p>
                      <p className="text-xs text-muted">
                        {[item.sku, item.color, item.size].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">{rupees(item.line_total)}</p>
                  </div>
                  {item.made_to_measure ? (
                    <div className="mt-3">
                      <MadeToMeasureBadge />
                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                        {item.customization_summary.map((row) => (
                          <div key={row.label} className="flex justify-between gap-2 border-b border-line-soft py-1">
                            <dt className="text-muted">{row.label}</dt>
                            <dd className="font-semibold tabular-nums">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                      {item.customization?.notes ? <p className="mt-2 text-sm italic text-muted-strong">“{item.customization.notes}”</p> : null}
                    </div>
                  ) : null}
                </div>
              ))}
              <dl className="grid gap-1 border-t border-line pt-3 text-sm">
                {[
                  ["Subtotal", rupees(order.subtotal)],
                  ...(Number.parseFloat(order.discount_total) > 0 ? [["Discount", `−${rupees(order.discount_total)}`]] : []),
                  ...(Number.parseFloat(order.shipping_total) > 0 ? [["Shipping", rupees(order.shipping_total)]] : [])
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-muted-strong">
                    <dt>{label}</dt>
                    <dd className="tabular-nums">{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-wine-deep">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{rupees(order.total)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update order</CardTitle>
            </CardHeader>
            <CardContent>
              <OnlineOrderStatusForm order={order} statuses={meta.statuses} paymentStatuses={meta.paymentStatuses} />
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <p className="font-semibold text-wine-ink">{order.customer.name}</p>
              {order.customer.phone ? (
                <p>
                  <a className="hover:text-wine hover:underline" href={`tel:${order.customer.phone}`}>
                    {order.customer.phone}
                  </a>
                </p>
              ) : null}
              {order.customer.email ? (
                <p>
                  <a className="hover:text-wine hover:underline" href={`mailto:${order.customer.email}`}>
                    {order.customer.email}
                  </a>
                </p>
              ) : null}
              <p className="whitespace-pre-line text-muted-strong">{order.shipping_address}</p>
              {whatsappHref ? (
                <Link
                  href={`${whatsappHref}?text=${encodeURIComponent(`Hi ${order.customer.name}, this is about your online order ${order.order_number}.`)}`}
                  target="_blank"
                  rel="noopener"
                  className="mt-2 inline-flex min-h-10 items-center justify-center rounded-xl border border-line-strong bg-surface px-3 text-sm font-semibold text-wine-ink shadow-raised-sm transition hover:border-gold hover:bg-blush"
                >
                  Message on WhatsApp
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p>
                <span className="text-muted">Method:</span> {order.payment_method_label}
              </p>
              {order.payment_reference ? (
                <p>
                  <span className="text-muted">Reference:</span> {order.payment_reference}
                </p>
              ) : null}
              {order.paid_at ? (
                <p>
                  <span className="text-muted">Paid at:</span> {formatDateTime(order.paid_at)}
                </p>
              ) : null}
              {order.notes ? (
                <p className="mt-2">
                  <span className="text-muted">Customer notes:</span> {order.notes}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
