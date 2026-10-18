import { notFound } from "next/navigation";
import { ExternalLink, FileText, MapPin, Package, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemFitBadge, OnlinePaymentBadge, OnlineStatusBadge, OrderTypeBadge } from "@/components/online-orders/online-order-badges";
import { OnlineOrderStageActions } from "@/components/online-orders/online-order-stage-actions";
import { OnlineBillActions } from "@/components/online-orders/online-bill-actions";
import { OnlineOrderStatusForm } from "@/components/online-orders/online-order-status-form";
import { CopyTextButton } from "@/components/online-orders/copy-text-button";
import { OnlineOrderTrackingForm } from "@/components/online-orders/online-order-tracking-form";
import { OnlineOrderRequests } from "@/components/online-orders/online-order-requests";
import { OnlineOrderTimeline } from "@/components/online-orders/online-order-timeline";
import { ContactActions } from "@/components/shared/contact-actions";
import { requestOrigin } from "@/lib/http/request-origin";
import { onlineBillAmounts, onlineBillFileName, onlineCustomerMessages } from "@/lib/online-orders/online-bill";
import { onlineBillLinkPath } from "@/lib/receipts/bill-link";
import { hasWebstoreEnv } from "@/lib/webstore/env";
import { formatDateTime } from "@/lib/utils/date";
import { formatINR, rupeesToPaise } from "@/lib/utils/money";
import { getOnlineOrder, listOnlineOrders, openRequests, orderTypeOf, refundDue, stageLabel } from "@/services/online-orders/online-order-service";
import { getStoreSettings } from "@/services/settings/settings-service";

export const dynamic = "force-dynamic";

function rupees(value: string) {
  return formatINR(rupeesToPaise(Number.parseFloat(value) || 0));
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 border-b border-line-soft py-2 last:border-b-0">
      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-label">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-ink-soft">{children}</dd>
    </div>
  );
}

export default async function OnlineOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  if (!hasWebstoreEnv()) notFound();
  const [order, meta, settings] = await Promise.all([getOnlineOrder(orderNumber), listOnlineOrders({ limit: 1 }), getStoreSettings()]);
  if (!order) notFound();
  const billPath = onlineBillLinkPath(order.order_number);
  const billUrl = billPath ? `${await requestOrigin()}${billPath}` : undefined;
  const customerMessages = onlineCustomerMessages(order, settings, billUrl);
  const amounts = onlineBillAmounts(order);
  const ordersCount = order.customer.orders_count ?? 1;

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

      {refundDue(order) ? (
        <div role="alert" className="mb-5 rounded-2xl border-l-4 border-danger bg-[#fbe3e1] px-4 py-3 text-sm">
          <p className="font-bold text-danger">Refund due: {rupees(order.total)}</p>
          <p className="text-ink-soft">
            Cancelled by {order.cancellation?.by || "—"}
            {order.cancellation?.reason ? ` (“${order.cancellation.reason}”)` : ""} after an online payment
            {order.gateway?.payment_id ? ` · Razorpay payment ${order.gateway.payment_id}` : ""}. Refund it from the Razorpay dashboard, then set Payment to “Refunded” below.
          </p>
        </div>
      ) : order.status === "cancelled" && order.cancellation ? (
        <div className="mb-5 rounded-2xl border-l-4 border-line-strong bg-paper px-4 py-3 text-sm text-ink-soft">
          Cancelled by {order.cancellation.by || "—"} on {formatDateTime(order.cancellation.at)}
          {order.cancellation.reason ? ` · “${order.cancellation.reason}”` : ""}. Ready-made stock has been returned to the shelf.
        </div>
      ) : null}
      {openRequests(order).length ? (
        <div className="mb-5 rounded-2xl border-l-4 border-gold bg-cream px-4 py-3 text-sm text-ink-soft">
          <span className="font-bold text-wine-ink">Customer request waiting:</span> {openRequests(order).map((r) => r.kind_label).join(", ")} — see “Customer requests” below.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-5">
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
                  <div className="flex gap-4">
                    <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-peach">
                      {item.image_url ? (
                        // Product photos are served by the webstore; no remote optimisation configured.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-soft" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-wine-ink">
                            {item.quantity > 1 ? `${item.quantity} × ` : ""}
                            {item.product_name}
                          </p>
                          <p className="text-xs text-muted">
                            {[item.category, item.sku ? `SKU ${item.sku}` : "", item.color, item.made_to_measure ? null : item.size ? `Size ${item.size}` : ""]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">{rupees(item.line_total)}</p>
                          <p className="text-xs text-muted tabular-nums">
                            {item.quantity} × {rupees(item.unit_price)}
                            {Number.parseFloat(item.discount_amount) > 0 ? ` · −${rupees(item.discount_amount)} off` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <ItemFitBadge custom={item.made_to_measure} />
                        {item.product_url ? (
                          <a href={item.product_url} target="_blank" rel="noopener" className="text-xs font-semibold text-wine hover:underline">
                            View on store
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {item.made_to_measure ? (
                    <div className="mt-3 rounded-xl bg-blush/60 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-label">Measurements</p>
                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                        {item.customization_summary.map((row) => (
                          <div key={row.label} className="flex justify-between gap-2 border-b border-line-soft py-1">
                            <dt className="text-muted">{row.label}</dt>
                            <dd className="font-semibold tabular-nums">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                      {item.tailor_notes || item.customization?.notes ? (
                        <p className="mt-2 text-sm">
                          <span className="font-semibold text-wine-ink">Notes for the tailor: </span>
                          <span className="italic text-muted-strong">“{item.tailor_notes || item.customization?.notes}”</span>
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
              <dl className="grid gap-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between text-muted-strong">
                  <dt>Items</dt>
                  <dd className="tabular-nums">{rupees(order.subtotal)}</dd>
                </div>
                {amounts.discountPaise > 0 ? (
                  <div className="flex justify-between text-success">
                    <dt>Discount{order.coupon ? ` (incl. coupon ${order.coupon.code} −${rupees(order.coupon.discount)})` : ""}</dt>
                    <dd className="tabular-nums">−{rupees(order.discount_total)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between text-muted-strong">
                  <dt>Shipping</dt>
                  <dd className="tabular-nums">{amounts.shippingPaise > 0 ? rupees(order.shipping_total) : "Free"}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-wine-deep">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{rupees(order.total)}</dd>
                </div>
                <div className="flex justify-between text-muted-strong">
                  <dt>Paid</dt>
                  <dd className="tabular-nums">{formatINR(amounts.paidPaise)}</dd>
                </div>
                <div className="flex justify-between font-semibold text-wine-ink">
                  <dt>Balance</dt>
                  <dd className="tabular-nums">{formatINR(amounts.balancePaise)}</dd>
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

          {order.status !== "cancelled" ? (
            <Card>
              <CardHeader>
                <CardTitle>Courier &amp; tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <OnlineOrderTrackingForm key={`${order.updated_at}-tracking`} order={order} />
              </CardContent>
            </Card>
          ) : null}

          {order.requests && order.requests.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Customer requests</CardTitle>
              </CardHeader>
              <CardContent>
                <OnlineOrderRequests key={order.updated_at} orderNumber={order.order_number} requests={order.requests} statuses={meta.requestStatuses} />
              </CardContent>
            </Card>
          ) : null}

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
              <OnlineOrderStatusForm key={`${order.status}-${order.payment_status}-${order.updated_at}`} order={order} statuses={meta.statuses} paymentStatuses={meta.paymentStatuses} />
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-5">
          <Card>
            <CardHeader className="flex items-center justify-between gap-2">
              <CardTitle>Delivery</CardTitle>
              <MapPin className="h-5 w-5 text-section-online" aria-hidden />
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p className="font-semibold text-wine-ink">{order.customer.name}</p>
              <p className="whitespace-pre-line text-ink-soft">{order.shipping_address || "No address given."}</p>
              {order.customer.phone ? <p className="text-muted-strong">Phone: {order.customer.phone}</p> : null}
              <div className="flex flex-wrap gap-2">
                {order.location_url ? (
                  <ButtonLink href={order.location_url} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4" aria-hidden />
                    Open in Google Maps
                  </ButtonLink>
                ) : null}
                <CopyTextButton
                  text={[order.customer.name, order.shipping_address, order.customer.phone ? `Phone: ${order.customer.phone}` : "", order.location_url ?? ""]
                    .filter(Boolean)
                    .join("\n")}
                  label="Copy delivery details"
                />
              </div>
              {!order.location_url ? <p className="text-xs text-muted">No map pin shared by the customer.</p> : null}
              {order.gift_message ? (
                <div className="rounded-xl border-l-4 border-wine bg-blush/60 px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-label">Gift · write this on a card, no prices in the parcel</p>
                  <p className="mt-1 whitespace-pre-line font-semibold text-wine-ink">“{order.gift_message}”</p>
                </div>
              ) : null}
              {order.notes ? (
                <div className="rounded-xl border-l-4 border-gold bg-cream px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-label">Note from customer</p>
                  <p className="mt-1 whitespace-pre-line text-ink-soft">{order.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between gap-2">
              <CardTitle>Customer</CardTitle>
              <UserRound className="h-5 w-5 text-section-customers" aria-hidden />
            </CardHeader>
            <CardContent className="grid gap-3">
              <dl>
                <Detail label="Name">{order.customer.name}</Detail>
                <Detail label="Phone">
                  {order.customer.phone ? (
                    <a className="hover:text-wine hover:underline" href={`tel:${order.customer.phone}`}>
                      {order.customer.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                  {order.customer.verified_phone ? <span className="ml-2 text-xs font-semibold text-success">✓ verified {order.customer.verified_phone}</span> : null}
                </Detail>
                <Detail label="Email">
                  {order.customer.email ? (
                    <a className="hover:text-wine hover:underline" href={`mailto:${order.customer.email}`}>
                      {order.customer.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </Detail>
                <Detail label="Account">
                  {order.customer.has_account ? `Store account${order.customer.account_username ? ` (${order.customer.account_username})` : ""}` : "Guest checkout"}
                </Detail>
                <Detail label="History">
                  {ordersCount > 1 ? (
                    <span className="font-semibold text-wine-ink">Returning customer · {ordersCount} orders</span>
                  ) : (
                    "First order"
                  )}
                </Detail>
              </dl>
              <ContactActions phone={order.customer.phone} messages={customerMessages} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <Detail label="Status">
                  <OnlinePaymentBadge status={order.payment_status} label={order.payment_status_label} />
                </Detail>
                <Detail label="Method">{order.payment_method_label}</Detail>
                <Detail label="Amount">
                  {rupees(order.total)} · Balance {formatINR(amounts.balancePaise)}
                </Detail>
                {order.payment_reference ? <Detail label="Reference">{order.payment_reference}</Detail> : null}
                {order.paid_at ? <Detail label="Paid at">{formatDateTime(order.paid_at)}</Detail> : null}
                {order.gateway?.order_id ? <Detail label="Razorpay order">{order.gateway.order_id}</Detail> : null}
                {order.gateway?.payment_id ? <Detail label="Razorpay payment">{order.gateway.payment_id}</Detail> : null}
                {order.payment_notes ? (
                  <Detail label="Payment notes">
                    <span className="whitespace-pre-line">{order.payment_notes}</span>
                  </Detail>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          {order.timeline ? (
            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent>
                <OnlineOrderTimeline events={order.timeline} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Order info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <Detail label="Order no.">{order.order_number}</Detail>
                <Detail label="Placed">{formatDateTime(order.created_at)}</Detail>
                <Detail label="Last updated">{formatDateTime(order.updated_at)}</Detail>
                <Detail label="Stage">{stageLabel(order.status, order.status_label)}</Detail>
                <Detail label="Type">
                  <OrderTypeBadge type={orderTypeOf(order)} />
                </Detail>
                <Detail label="Pieces">{order.item_count}</Detail>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
