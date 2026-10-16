import { Button } from "@/components/ui/button";
import { GuardedForm } from "@/components/shared/guarded-form";
import { TailorField } from "@/components/orders/tailor-field";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ClothSamplePhotoField } from "@/components/orders/cloth-sample-photo-field";
import { EditOrderChoiceFields } from "@/components/orders/edit-order-choice-fields";
import { EditOrderItemsField } from "@/components/orders/edit-order-items-field";
import { MeasurementGrid } from "@/components/measurements/measurement-grid";
import { normalizeDateInput } from "@/lib/utils/date";
import { paiseToRupees } from "@/lib/utils/money";
import { uniqueMeasurementNotes } from "@/lib/utils/receipt-notes";
import type { MeasurementTemplate, OrderWithCustomer, PaymentMethod, Priority } from "@/types/domain";

const priorityChoices: Priority[] = ["Express", "Urgent", "Normal"];
// The shop takes cash or UPI. Older orders saved with another method keep showing it.
const paymentMethodChoices: PaymentMethod[] = ["Cash", "UPI"];

export function EditOrderForm({
  order,
  measurementTemplate,
  action,
  tailors = []
}: {
  order: OrderWithCustomer;
  measurementTemplate?: MeasurementTemplate;
  action: (formData: FormData) => void | Promise<void>;
  /** Active tailor names from Settings. */
  tailors?: string[];
}) {
  const specialNotes = uniqueMeasurementNotes(order.measurements).join("\n");
  const latestPayment = order.payments.at(-1);

  return (
    <GuardedForm action={action} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Customer name">
          <Input name="customerName" defaultValue={order.customer.fullName} />
        </Field>
        <Field label="Phone number">
          <Input name="phonePrimary" defaultValue={order.customer.phonePrimary} />
        </Field>
        <Field label="Order date">
          <Input name="orderDate" type="date" defaultValue={normalizeDateInput(order.orderDate)} />
        </Field>
        <Field label="Delivery date">
          <Input name="deliveryDate" type="date" defaultValue={normalizeDateInput(order.deliveryDate)} />
        </Field>
        <Field label="Assigned tailor">
          <TailorField tailors={tailors} defaultValue={order.assignedTailor ?? ""} />
        </Field>
        <Field label="Priority">
          <select
            name="priority"
            defaultValue={order.priority}
            className="h-11 w-full rounded-xl border border-transparent bg-surface-sunken px-3 text-sm text-ink shadow-pressed outline-none transition focus:border-gold focus:bg-surface-strong focus:ring-2 focus:ring-gold/30"
          >
            {priorityChoices.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <EditOrderChoiceFields status={order.status} paymentStatus={order.totals.paymentStatus} />

      <ClothSamplePhotoField currentImageUrl={order.clothSampleImageUrl} />

      <EditOrderItemsField items={order.items} />

      <div className="rounded-xl border border-line bg-gradient-to-br from-white to-paper-warm p-4 shadow-raised-sm">
        <p className="mb-3 text-sm font-bold text-wine-ink">Measurements</p>
        {order.measurements.length ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {order.measurements.map((measurement, index) => (
                <label key={measurement.id} className="grid gap-1 rounded-xl border border-line bg-surface p-3 text-sm shadow-raised-sm">
                  <input type="hidden" name={`measurements.${index}.id`} value={measurement.id} />
                  <span className="flex items-center justify-between gap-2">
                    <strong className="text-wine-ink">{measurement.displayCode}</strong>
                    <span className="text-xs text-muted">{measurement.displayLabel}</span>
                  </span>
                  <Input name={`measurements.${index}.value`} defaultValue={measurement.value} inputMode="decimal" />
                </label>
              ))}
            </div>
            <label className="mt-3 grid gap-1.5 text-sm font-medium text-ink-soft">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-label">Special Notes</span>
              <Textarea name="measurementNotes" defaultValue={specialNotes} />
            </label>
          </>
        ) : measurementTemplate ? (
          <MeasurementGrid template={measurementTemplate} editable valuePrefix="newMeasurement" metaPrefix="newMeasurementMeta" />
        ) : (
          <div className="rounded-xl border border-dashed border-line-strong bg-cream p-6 text-center text-sm text-muted">
            No measurements are saved and no measurement template is available.
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Advance paid">
          <Input name="advancePaidRupees" type="number" min={0} step="0.01" defaultValue={paiseToRupees(order.totals.totalPaidPaise)} />
        </Field>
        <Field label="Payment mode">
          <select
            name="paymentMethod"
            defaultValue={latestPayment?.method ?? "Cash"}
            className="h-11 w-full rounded-xl border border-transparent bg-surface-sunken px-3 text-sm text-ink shadow-pressed outline-none transition focus:border-gold focus:bg-surface-strong focus:ring-2 focus:ring-gold/30"
          >
            {[...paymentMethodChoices, ...(latestPayment && !paymentMethodChoices.includes(latestPayment.method) ? [latestPayment.method] : [])].map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment reference">
          <Input name="paymentReference" defaultValue={latestPayment?.paymentReference ?? ""} />
        </Field>
        <Field label="Order discount">
          <Input name="orderDiscountRupees" type="number" min={0} step="0.01" defaultValue={paiseToRupees(order.totals.orderDiscountPaise)} />
        </Field>
        <Field label="Accessories cost">
          <Input name="accessoriesCostRupees" type="number" min={0} step="0.01" defaultValue={paiseToRupees(order.totals.accessoriesCostPaise)} />
        </Field>
        <label className="grid gap-1.5 text-sm font-medium text-ink-soft md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-label">Customer notes</span>
          <Textarea name="customerNotes" defaultValue={order.customerNotes ?? ""} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink-soft md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-label">Internal notes</span>
          <Textarea name="internalNotes" defaultValue={order.internalNotes ?? ""} />
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Save Edited Bill</Button>
      </div>
    </GuardedForm>
  );
}
