import Image from "next/image";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { ButtonLink } from "@/components/ui/button";
import { FileText, Pencil, Printer, Store, X } from "lucide-react";
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
import { summarizeGarments } from "@/lib/orders/garment-summary";
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
        `Expected delivery: ${formatDate(order.deliveryDate)}`
      ].join("\n")
    },
    {
      label: "Ready for pickup",
      text: `Hello ${order.customer.fullName}, your order ${receiptLabel} at ${STORE_SETTINGS.storeName} is ready for pickup.${balanceDue > 0 ? ` Balance due: ${formatINR(balanceDue)}.` : ""} Thank you!`
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
            <ButtonLink href={`/receipts/${order.id}/customer`} variant="secondary">
              <FileText className="h-4 w-4" aria-hidden />
              Customer Copy
            </ButtonLink>
            <ButtonLink href={`/receipts/${order.id}/store`} variant="secondary">
              <Store className="h-4 w-4" aria-hidden />
              Store Copy
            </ButtonLink>
            <ButtonLink href={`/receipts/${order.id}/combined`}>
              <Printer className="h-4 w-4" aria-hidden />
              Combined Print
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
                  <p className="mt-2 text-sm">{item.stitchingInstructions}</p>
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
              {[
                ["Subtotal", order.totals.subtotalPaise],
                ["Accessories", order.totals.accessoriesCostPaise],
                ["Stitching", order.totals.stitchingCostPaise],
                ["Fabric price", order.totals.fabricPricePaise],
                ["Dye price", order.totals.dyePricePaise],
                ["Extra costs", order.totals.extraCostPaise],
                ["Discount", -order.totals.orderDiscountPaise],
                ["CGST", order.totals.cgstAmountPaise],
                ["SGST", order.totals.sgstAmountPaise],
                ["Grand Total", order.totals.grandTotalPaise],
                ["Paid", order.totals.totalPaidPaise],
                ["Balance", order.totals.balanceDuePaise]
              ]
                // Optional charges are only listed when they apply, matching the receipts.
                .filter(([label, value]) => Number(value) !== 0 || ["Subtotal", "CGST", "SGST", "Grand Total", "Paid", "Balance"].includes(String(label)))
                .map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-line py-2 last:border-0">
                  <span>{label}</span>
                  <strong>{formatINR(Number(value))}</strong>
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
      <Card id="edit-order" className="mt-5 scroll-mt-24">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>{editing ? "Edit Saved Bill" : "Order Details Editing"}</CardTitle>
          {editing ? (
            <ButtonLink href={`/orders/${order.id}`} variant="secondary">
              Cancel Edit
            </ButtonLink>
          ) : null}
        </CardHeader>
        <CardContent>
          {editing ? (
            <EditOrderForm order={order} measurementTemplate={measurementTemplate} action={updateOrderAction.bind(null, order.id)} />
          ) : (
            <p className="text-sm text-muted">Use the Edit Order button at the top to change customer info, status, measurements, cloth photo, notes, costs, priority, or tailor.</p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
