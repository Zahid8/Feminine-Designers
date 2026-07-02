import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeasurementGrid } from "@/components/measurements/measurement-grid";
import { OrderItemDeliveryTracker } from "@/components/orders/order-item-delivery-tracker";
import { DeleteOrderButton } from "@/components/orders/delete-order-button";
import { EditOrderForm } from "@/components/orders/edit-order-form";
import { OrderStatusCheckboxEditor } from "@/components/orders/order-status-checkbox-editor";
import { PaymentBadge, PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { getOrderById } from "@/services/orders/order-service";
import { getMeasurementTemplateForGarment } from "@/services/measurements/measurement-service";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { formatINR } from "@/lib/utils/money";
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
  const measurementTemplate = order.measurements.length === 0 ? await getMeasurementTemplateForGarment(order.items[0]?.garmentType ?? "Custom") : undefined;

  return (
    <AppShell>
      <PageHeading
        title={order.receiptNumber ?? "Draft Order"}
        description={`${order.customer.fullName} · ${order.customer.phonePrimary} · Delivery ${formatDate(order.deliveryDate)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/receipts/${order.id}/customer`}>
              <Button variant="secondary">Customer Copy</Button>
            </Link>
            <Link href={`/receipts/${order.id}/store`}>
              <Button variant="secondary">Store Copy</Button>
            </Link>
            <Link href={`/receipts/${order.id}/combined`}>
              <Button>Combined Print</Button>
            </Link>
            <DeleteOrderButton orderId={order.id} receiptNumber={order.receiptNumber} />
          </div>
        }
      />
      {query.saved ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Edits saved successfully.
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
              <PaymentBadge status={order.totals.paymentStatus} />
            </div>
            <OrderStatusCheckboxEditor orderId={order.id} status={order.status} paymentStatus={order.totals.paymentStatus} />
            <div className="grid gap-3 md:grid-cols-2">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-md border border-[#eadfce] p-3">
                  <p className="font-semibold text-[#4c1525]">{item.garmentType}</p>
                  <p className="text-sm text-[#7c6d66]">
                    Qty {item.quantity} · Rate {formatINR(item.ratePaise)} · Stitching {formatINR(item.stitchingCostPaise)} · Fabric{" "}
                    {formatINR(item.fabricPricePaise)} · Dye {formatINR(item.dyePricePaise)} · Total {formatINR(item.lineTotalPaise)}
                  </p>
                  {item.fabricLength ? <p className="text-sm text-[#7c6d66]">Fabric length: {item.fabricLength}</p> : null}
                  <p className="mt-1 text-xs font-semibold text-[#4c1525]">
                    {item.delivered ? "Delivered" : "Not delivered"}
                  </p>
                  <p className="mt-2 text-sm">{item.stitchingInstructions}</p>
                </div>
              ))}
            </div>
            <OrderItemDeliveryTracker orderId={order.id} items={order.items} />
            {order.clothSampleImageUrl ? (
              <div className="rounded-md border border-[#eadfce] bg-[#fdf8ef] p-3">
                <p className="mb-2 font-semibold text-[#4c1525]">Customer cloth sample</p>
                <Image
                  src={order.clothSampleImageUrl}
                  alt="Customer cloth sample"
                  width={360}
                  height={240}
                  unoptimized
                  className="max-h-72 w-full rounded-md object-cover"
                />
              </div>
            ) : null}
            {order.measurements.length ? (
              <MeasurementGrid values={order.measurements} />
            ) : (
              <div className="rounded-md border border-dashed border-[#d8c7b4] bg-white p-6 text-center text-sm text-[#7c6d66]">
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
                ["Discount", -order.totals.orderDiscountPaise],
                ["CGST", order.totals.cgstAmountPaise],
                ["SGST", order.totals.sgstAmountPaise],
                ["Grand Total", order.totals.grandTotalPaise],
                ["Paid", order.totals.totalPaidPaise],
                ["Balance", order.totals.balanceDuePaise]
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-[#eadfce] py-2 last:border-0">
                  <span>{label}</span>
                  <strong>{formatINR(Number(value))}</strong>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {order.statusHistory.map((entry) => (
                <div key={entry.id} className="border-l-2 border-[#7d1f36] pl-3">
                  <p className="font-semibold">{entry.toStatus}</p>
                  <p className="text-xs text-[#7c6d66]">
                    {formatDateTime(entry.changedAt)} · {entry.changedBy}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="mt-5">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>{editing ? "Edit Saved Bill" : "Order Details Editing"}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {editing ? (
              <Link href={`/orders/${order.id}`}>
                <Button type="button" variant="secondary">
                  Cancel Edit
                </Button>
              </Link>
            ) : (
              <Link href={`/orders/${order.id}?edit=1`}>
                <Button type="button">Edit Order Details</Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <EditOrderForm order={order} measurementTemplate={measurementTemplate} action={updateOrderAction.bind(null, order.id)} />
          ) : (
            <p className="text-sm text-[#7c6d66]">Click Edit Order Details to change customer info, status, measurements, cloth photo, notes, costs, priority, or tailor.</p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
