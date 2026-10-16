import Image from "next/image";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { ButtonLink } from "@/components/ui/button";
import { FileText, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeasurementGrid } from "@/components/measurements/measurement-grid";
import { OrderItemDeliveryTracker } from "@/components/orders/order-item-delivery-tracker";
import { DeleteOrderButton } from "@/components/orders/delete-order-button";
import { EditOrderForm } from "@/components/orders/edit-order-form";
import { OrderStatusCheckboxEditor } from "@/components/orders/order-status-checkbox-editor";
import { DeliveryUrgencyBadge, PaymentBadge, PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { OrderProgress } from "@/components/orders/order-progress";
import { PaymentsPanel } from "@/components/orders/payments-panel";
import { ContactActions } from "@/components/shared/contact-actions";
import { STORE_SETTINGS } from "@/lib/constants/business";
import { paymentSummaryLines } from "@/lib/calculations/payment-summary";
import { groupedExtraCosts } from "@/lib/utils/extra-cost-display";
import { cn } from "@/lib/utils/cn";
import { summarizeGarments } from "@/lib/orders/garment-summary";
import { billLinkPath } from "@/lib/receipts/bill-link";
import { requestOrigin } from "@/lib/http/request-origin";
import { getOrderById } from "@/services/orders/order-service";
import { getMeasurementTemplateForGarment } from "@/services/measurements/measurement-service";
import { formatDate, formatDateTime, todayISO } from "@/lib/utils/date";
import { formatINR } from "@/lib/utils/money";
import { formatExtraCostLine } from "@/lib/utils/extra-cost-display";
import { updateOrderAction } from "@/app/orders/[id]/actions";

export default async function OrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; saved?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const order = await getOrderById(id);
  if (!order) notFound();
  const editing = query.edit === "1";
  const billPath = billLinkPath(order.id);
  const billUrl = billPath ? `${await requestOrigin()}${billPath}` : undefined;
  const receiptLabel = order.receiptNumber ?? "your order";
  const balanceDue = order.totals.balanceDuePaise;
  const customerMessages = [
    {
      label: "Order confirmation",
      text: [
        `Hello ${order.customer.fullName}, thank you for your order at ${STORE_SETTINGS.storeName}.`,
        `Receipt: ${receiptLabel}`,
        `Items: ${summarizeGarments(order.items)}`,
        `Total: ${formatINR(order.totals.grandTotalPaise)} | Paid: ${formatINR(order.totals.totalPaidPaise)} | Balance: ${formatINR(balanceDue)}`,
        `Expected delivery: ${formatDate(order.deliveryDate)}`,
        ...(billUrl ? [`Your bill: ${billUrl}`] : [])
      ].join("\n")
    },
    {
      label: "Ready for pickup",
      text: `Hello ${order.customer.fullName}, your order ${receiptLabel} at ${STORE_SETTINGS.storeName} is ready for pickup.${balanceDue > 0 ? ` Balance due: ${formatINR(balanceDue)}.` : ""}${billUrl ? ` Bill: ${billUrl}` : ""} Thank you!`
    },
    ...(balanceDue > 0
      ? [
          {
            label: "Balance reminder",
            text: `Hello ${order.customer.fullName}, a gentle reminder that ${formatINR(balanceDue)} is pending for order ${receiptLabel} at ${STORE_SETTINGS.storeName}. Thank you!`
          }
        ]
      : [])
  ];
  const measurementTemplate = order.measurements.length === 0 ? await getMeasurementTemplateForGarment(order.items[0]?.garmentType ?? "Custom") : undefined;

  return (
    <AppShell>
      <PageHeading
        title={order.receiptNumber ?? "Draft Order"}
        description={`${order.customer.fullName} · ${order.customer.phonePrimary} · Delivery ${formatDate(order.deliveryDate)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/receipts/${order.id}/customer`}>
              <FileText className="h-4 w-4" aria-hidden />
              View Bill / Receipt
            </ButtonLink>
            {editing ? (
              <ButtonLink href={`/orders/${order.id}`} variant="secondary">
                <X className="h-4 w-4" aria-hidden />
                Cancel Edit
              </ButtonLink>
            ) : (
              <ButtonLink href={`/orders/${order.id}?edit=1#edit-order`} variant="secondary">
                <Pencil className="h-4 w-4" aria-hidden />
                Edit Order
              </ButtonLink>
            )}
            <DeleteOrderButton orderId={order.id} receiptNumber={order.receiptNumber} />
          </div>
        }
      />
      {query.saved ? (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Edits saved successfully.
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <OrderProgress status={order.status} />
            <ContactActions phone={order.customer.phonePrimary} messages={customerMessages} />
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              <DeliveryUrgencyBadge deliveryDate={order.deliveryDate} status={order.status} today={todayISO()} />
              <PriorityBadge priority={order.priority} />
              <PaymentBadge status={order.totals.paymentStatus} />
            </div>
            <OrderStatusCheckboxEditor orderId={order.id} status={order.status} paymentStatus={order.totals.paymentStatus} />
            <div className="grid gap-3 md:grid-cols-2">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-line bg-surface p-3 shadow-raised-sm">
                  <p className="font-semibold text-wine-ink">{item.garmentType}</p>
                  {item.fabricColor ? <p className="text-sm text-muted">Fabric color: {item.fabricColor}</p> : null}
                  <p className="text-sm text-muted">
                    Qty {item.quantity} · Rate {formatINR(item.ratePaise)} · Stitching {formatINR(item.stitchingCostPaise)} · Fabric{" "}
                    {formatINR(item.fabricPricePaise)} · Dye {formatINR(item.dyePricePaise)} · Extra {formatINR(item.extraCostPaise)} · Total{" "}
                    {formatINR(item.lineTotalPaise)}
                  </p>
                  {item.extraCosts.length ? (
                    <p className="text-xs text-muted">
                      {item.extraCosts.map((cost) => formatExtraCostLine(cost.label, formatINR(cost.amountPaise))).join(", ")}
                    </p>
                  ) : null}
                  {item.fabricLength ? <p className="text-sm text-muted">Fabric length: {item.fabricLength}</p> : null}
                  <p className="mt-1 text-xs font-semibold text-wine-ink">
                    {item.delivered ? "Delivered" : "Not delivered"}
                  </p>
                  <p className="mt-2 text-justify text-sm hyphens-auto">{item.stitchingInstructions}</p>
                </div>
              ))}
            </div>
            <OrderItemDeliveryTracker orderId={order.id} items={order.items} />
            {order.clothSampleImageUrl ? (
              <div className="rounded-xl border border-line bg-gradient-to-br from-paper to-peach p-3 shadow-raised-sm">
                <p className="mb-2 font-semibold text-wine-ink">Customer cloth sample</p>
                <Image
                  src={order.clothSampleImageUrl}
                  alt="Customer cloth sample"
                  width={360}
                  height={240}
                  unoptimized
                  className="max-h-72 w-full rounded-xl object-cover"
                />
              </div>
            ) : null}
            {order.measurements.length ? (
              <MeasurementGrid values={order.measurements} />
            ) : (
              <div className="rounded-xl border border-dashed border-line-strong bg-surface p-6 text-center text-sm text-muted shadow-raised-sm">
                No measurements saved yet. Add them in Edit Saved Bill below.
              </div>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {paymentSummaryLines(order.totals, { namedExtras: groupedExtraCosts(order.items) }).map((line) => (
                <div
                  key={line.key}
                  className={cn(
                    "flex justify-between border-b border-line py-2 last:border-0",
                    line.kind === "part" && "border-l-2 border-l-gold-soft py-1.5 pl-3 text-muted-strong",
                    (line.kind === "subtotal" || line.kind === "total") && "font-bold text-wine-ink",
                    line.kind === "balance" && (order.totals.balanceDuePaise > 0 ? "font-bold text-wine" : "font-bold text-success")
                  )}
                >
                  <span>
                    {line.kind === "tax" ? "+ " : line.kind === "discount" || line.kind === "paid" ? "− " : ""}
                    {line.label}
                  </span>
                  <strong className="tabular-nums">{formatINR(Math.abs(line.amountPaise))}</strong>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentsPanel orderId={order.id} payments={order.payments} balanceDuePaise={order.totals.balanceDuePaise} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent className="grid max-h-80 gap-3 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
              {order.statusHistory.map((entry) => (
                <div key={entry.id} className="border-l-2 border-wine pl-3">
                  <p className="font-semibold">{entry.toStatus}</p>
                  <p className="text-xs text-muted">
                    {formatDateTime(entry.changedAt)} · {entry.changedBy}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      {editing ? (
        <Card id="edit-order" className="mt-5 scroll-mt-24">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Edit Saved Bill</CardTitle>
            <ButtonLink href={`/orders/${order.id}`} variant="secondary">
              Cancel Edit
            </ButtonLink>
          </CardHeader>
          <CardContent>
            <EditOrderForm order={order} measurementTemplate={measurementTemplate} action={updateOrderAction.bind(null, order.id)} />
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}
