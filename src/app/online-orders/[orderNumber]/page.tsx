import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemFitBadge, OnlinePaymentBadge, OnlineStatusBadge, OrderTypeBadge } from "@/components/online-orders/online-order-badges";
import { OnlineOrderStageActions } from "@/components/online-orders/online-order-stage-actions";
import { OnlineBillActions } from "@/components/online-orders/online-bill-actions";
import { ContactActions } from "@/components/shared/contact-actions";
import { requestOrigin } from "@/lib/http/request-origin";
import { onlineBillFileName, onlineCustomerMessages } from "@/lib/online-orders/online-bill";
import { onlineBillLinkPath } from "@/lib/receipts/bill-link";
import { getStoreSettings } from "@/services/settings/settings-service";
import { OnlineOrderStatusForm } from "@/components/online-orders/online-order-status-form";
import { hasWebstoreEnv } from "@/lib/webstore/env";
import { formatDateTime } from "@/lib/utils/date";
import { formatINR, rupeesToPaise } from "@/lib/utils/money";
import { getOnlineOrder, listOnlineOrders, orderTypeOf } from "@/services/online-orders/online-order-service";

export const dynamic = "force-dynamic";

function rupees(value: string) {
  return formatINR(rupeesToPaise(Number.parseFloat(value) || 0));
}

export default async function OnlineOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  if (!hasWebstoreEnv()) notFound();
  const [order, meta, settings] = await Promise.all([getOnlineOrder(orderNumber), listOnlineOrders({ limit: 1 }), getStoreSettings()]);
  if (!order) notFound();
  const billPath = onlineBillLinkPath(order.order_number);
  const billUrl = billPath ? `${await requestOrigin()}${billPath}` : undefined;
  const customerMessages = onlineCustomerMessages(order, settings, billUrl);

  return (
    <AppShell>
      <PageHeading
        title={order.order_number}
        description={`${order.customer.name} · ${order.customer.phone || order.customer.email} · Placed ${formatDateTime(order.created_at)}`}
        action={
          <div className="flex flex-wrap gap-2">
            {billUrl ? (
              <ButtonLink href={billUrl} target="_blank" rel="noopener">
                <FileText className="h-4 w-4" aria-hidden />
                View Bill
              </ButtonLink>
            ) : null}
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
                <OrderTypeBadge type={orderTypeOf(order)} />
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
                        {[item.sku, item.color, item.made_to_measure ? null : item.size].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-1.5">
                        <ItemFitBadge custom={item.made_to_measure} />
                      </div>
                    </div>
                    <p className="font-semibold tabular-nums">{rupees(item.line_total)}</p>
                  </div>
                  {item.made_to_measure ? (
                    <div className="mt-3">
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-label">Measurements</p>
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
              <CardTitle>Order stage</CardTitle>
            </CardHeader>
            <CardContent>
              <OnlineOrderStageActions orderNumber={order.order_number} status={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bill</CardTitle>
            </CardHeader>
            <CardContent>
              {billUrl ? (
                <OnlineBillActions billUrl={billUrl} fileName={onlineBillFileName(order.order_number)} />
              ) : (
                <p className="text-sm text-muted-strong">Bill links need BILL_LINK_SECRET (or the Supabase service key) on the server.</p>
              )}
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
              <ContactActions phone={order.customer.phone} messages={customerMessages} className="mt-2" />
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
