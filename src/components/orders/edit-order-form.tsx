import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ClothSamplePhotoField } from "@/components/orders/cloth-sample-photo-field";
import { ORDER_STATUSES } from "@/lib/constants/business";
import { paiseToRupees } from "@/lib/utils/money";
import { uniqueMeasurementNotes } from "@/lib/utils/receipt-notes";
import type { OrderWithCustomer, PaymentStatus, Priority } from "@/types/domain";

const priorities: Priority[] = ["Normal", "Urgent", "Express"];
const paymentChoices: Array<{ label: string; value: Extract<PaymentStatus, "Paid" | "Unpaid"> }> = [
  { label: "Not paid", value: "Unpaid" },
  { label: "Paid", value: "Paid" }
];

export function EditOrderForm({
  order,
  action
}: {
  order: OrderWithCustomer;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const specialNotes = uniqueMeasurementNotes(order.measurements).join("\n");

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Customer name">
          <Input name="customerName" defaultValue={order.customer.fullName} />
        </Field>
        <Field label="Phone number">
          <Input name="phonePrimary" defaultValue={order.customer.phonePrimary} />
        </Field>
        <Field label="Order date">
          <Input name="orderDate" type="date" defaultValue={order.orderDate} />
        </Field>
        <Field label="Delivery date">
          <Input name="deliveryDate" type="date" defaultValue={order.deliveryDate} />
        </Field>
        <Field label="Assigned tailor">
          <Input name="assignedTailor" defaultValue={order.assignedTailor ?? ""} />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-[#eadfce] bg-white p-4">
          <p className="mb-3 text-sm font-bold text-[#4c1525]">Order status</p>
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map((status) => (
              <label key={status} className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#d8c7b4] bg-[#fffdf8] px-2 text-xs font-semibold">
                <input type="checkbox" name="status" value={status} defaultChecked={order.status === status} className="h-4 w-4" />
                {status}
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-[#eadfce] bg-white p-4">
          <p className="mb-3 text-sm font-bold text-[#4c1525]">Payment status</p>
          <div className="flex flex-wrap gap-2">
            {paymentChoices.map((choice) => (
              <label key={choice.value} className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#d8c7b4] bg-[#fffdf8] px-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  name="paymentStatus"
                  value={choice.value}
                  defaultChecked={order.totals.paymentStatus === choice.value}
                  className="h-4 w-4"
                />
                {choice.label}
              </label>
            ))}
            {order.totals.paymentStatus === "Partial" || order.totals.paymentStatus === "Credit" ? (
              <span className="inline-flex min-h-8 items-center rounded-md border border-amber-200 bg-amber-50 px-2 text-xs font-semibold text-amber-800">
                Current: {order.totals.paymentStatus}
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-md border border-[#eadfce] bg-white p-4">
          <p className="mb-3 text-sm font-bold text-[#4c1525]">Priority</p>
          <div className="flex flex-wrap gap-2">
            {priorities.map((priority) => (
              <label key={priority} className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#d8c7b4] bg-[#fffdf8] px-2 text-xs font-semibold">
                <input type="checkbox" name="priority" value={priority} defaultChecked={order.priority === priority} className="h-4 w-4" />
                {priority}
              </label>
            ))}
          </div>
        </div>
      </div>

      <ClothSamplePhotoField currentImageUrl={order.clothSampleImageUrl} />

      <div className="grid gap-3">
        {order.items.map((item, index) => (
          <div key={item.id} className="rounded-md border border-[#eadfce] bg-white p-4">
            <input type="hidden" name={`items.${index}.id`} value={item.id} />
            <p className="mb-3 text-sm font-bold text-[#4c1525]">Dress {index + 1}</p>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_.5fr_.7fr_.7fr_.7fr]">
              <Field label="Garment type">
                <Input name={`items.${index}.garmentType`} defaultValue={item.garmentType} />
              </Field>
              <Field label="Quantity">
                <Input name={`items.${index}.quantity`} type="number" min={1} step="1" defaultValue={item.quantity} />
              </Field>
              <Field label="Rate">
                <Input name={`items.${index}.rateRupees`} type="number" min={0} step="0.01" defaultValue={paiseToRupees(item.ratePaise)} />
              </Field>
              <Field label="Stitching cost">
                <Input
                  name={`items.${index}.stitchingCostRupees`}
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={paiseToRupees(item.stitchingCostPaise)}
                />
              </Field>
              <Field label="Fabric length">
                <Input name={`items.${index}.fabricLength`} defaultValue={item.fabricLength ?? ""} />
              </Field>
              <Field label="Fabric/color">
                <Input name={`items.${index}.fabricColor`} defaultValue={item.fabricColor ?? ""} />
              </Field>
              <Field label="Design reference">
                <Input name={`items.${index}.designReference`} defaultValue={item.designReference ?? ""} />
              </Field>
              <label className="grid gap-1.5 text-sm font-medium text-[#3b312d] lg:col-span-4">
                <span>Stitching instructions</span>
                <Textarea name={`items.${index}.stitchingInstructions`} defaultValue={item.stitchingInstructions ?? ""} />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-[#eadfce] bg-white p-4">
        <p className="mb-3 text-sm font-bold text-[#4c1525]">Measurements</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {order.measurements.map((measurement, index) => (
            <label key={measurement.id} className="grid gap-1 rounded-md border border-[#eadfce] bg-white p-3 text-sm">
              <input type="hidden" name={`measurements.${index}.id`} value={measurement.id} />
              <span className="flex items-center justify-between gap-2">
                <strong className="text-[#4c1525]">{measurement.displayCode}</strong>
                <span className="text-xs text-[#7c6d66]">{measurement.displayLabel}</span>
              </span>
              <Input name={`measurements.${index}.value`} defaultValue={measurement.value} inputMode="decimal" />
            </label>
          ))}
        </div>
        <label className="mt-3 grid gap-1.5 text-sm font-medium text-[#3b312d]">
          <span>Special Notes</span>
          <Textarea name="measurementNotes" defaultValue={specialNotes} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Order discount">
          <Input name="orderDiscountRupees" type="number" min={0} step="0.01" defaultValue={paiseToRupees(order.totals.orderDiscountPaise)} />
        </Field>
        <Field label="Accessories cost">
          <Input name="accessoriesCostRupees" type="number" min={0} step="0.01" defaultValue={paiseToRupees(order.totals.accessoriesCostPaise)} />
        </Field>
        <label className="grid gap-1.5 text-sm font-medium text-[#3b312d] md:col-span-2">
          <span>Customer notes</span>
          <Textarea name="customerNotes" defaultValue={order.customerNotes ?? ""} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-[#3b312d] md:col-span-2">
          <span>Internal notes</span>
          <Textarea name="internalNotes" defaultValue={order.internalNotes ?? ""} />
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Save Edited Bill</Button>
      </div>
    </form>
  );
}
