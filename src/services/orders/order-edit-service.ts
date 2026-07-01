import { calculateLineTotal, calculateOrderTotals } from "@/lib/calculations/order";
import { paiseToRupees, rupeesToPaise } from "@/lib/utils/money";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import type { OrderStatus, OrderWithCustomer, PaymentStatus, Priority } from "@/types/domain";

function readString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}

function readNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(readString(formData, key, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function toRupeesDecimal(paise: number) {
  return paiseToRupees(paise).toFixed(2);
}

function orderItemIndexes(formData: FormData) {
  const indexes = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(/^items\.(\d+)\.id$/);
    if (match) indexes.add(Number(match[1]));
  }
  return [...indexes].sort((a, b) => a - b);
}

function measurementIndexes(formData: FormData) {
  const indexes = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(/^measurements\.(\d+)\.id$/);
    if (match) indexes.add(Number(match[1]));
  }
  return [...indexes].sort((a, b) => a - b);
}

function editedItemDraft(order: OrderWithCustomer, index: number) {
  return order.items[index];
}

function lineItemFromForm(order: OrderWithCustomer, formData: FormData, index: number) {
  const fallback = editedItemDraft(order, index);
  const quantity = readNumber(formData, `items.${index}.quantity`, fallback.quantity);
  const ratePaise = rupeesToPaise(readNumber(formData, `items.${index}.rateRupees`, paiseToRupees(fallback.ratePaise)));
  const discountPaise = fallback.discountPaise;
  const stitchingCostPaise = rupeesToPaise(
    readNumber(formData, `items.${index}.stitchingCostRupees`, paiseToRupees(fallback.stitchingCostPaise))
  );

  return {
    quantity,
    ratePaise,
    discountPaise,
    stitchingCostPaise
  };
}

async function assertUpdate(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

export async function updateOrderFromForm(order: OrderWithCustomer, formData: FormData) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Order editing requires the database.");
  }

  const admin = createSupabaseAdminClient();
  const itemIndexes = orderItemIndexes(formData);
  const measurementNote = readString(formData, "measurementNotes");
  const now = new Date().toISOString();

  const editedLineItems = order.items.map((item, index) =>
    itemIndexes.includes(index)
      ? lineItemFromForm(order, formData, index)
      : {
        quantity: item.quantity,
        ratePaise: item.ratePaise,
        discountPaise: item.discountPaise,
        stitchingCostPaise: item.stitchingCostPaise
      }
  );

  const totals = calculateOrderTotals({
    items: editedLineItems,
    accessoriesCostPaise: rupeesToPaise(readNumber(formData, "accessoriesCostRupees", paiseToRupees(order.totals.accessoriesCostPaise))),
    orderDiscountPaise: rupeesToPaise(readNumber(formData, "orderDiscountRupees", paiseToRupees(order.totals.orderDiscountPaise))),
    cgstRate: order.totals.cgstRate,
    sgstRate: order.totals.sgstRate,
    payments: order.payments.map((payment) => ({ amountPaise: payment.amountPaise }))
  });

  await assertUpdate(
    await admin
      .from("customers")
      .update({
        full_name: readString(formData, "customerName", order.customer.fullName),
        phone_primary: readString(formData, "phonePrimary", order.customer.phonePrimary),
        updated_at: now
      })
      .eq("id", order.customer.id)
  );

  await assertUpdate(
    await admin
      .from("orders")
      .update({
        status: readString(formData, "status", order.status) as OrderStatus,
        priority: readString(formData, "priority", order.priority) as Priority,
        order_date: readString(formData, "orderDate", order.orderDate),
        delivery_date: readString(formData, "deliveryDate", order.deliveryDate),
        assigned_tailor_name: readString(formData, "assignedTailor", order.assignedTailor ?? "") || null,
        internal_notes: readString(formData, "internalNotes", order.internalNotes ?? "") || null,
        customer_notes: readString(formData, "customerNotes", order.customerNotes ?? "") || null,
        subtotal: toRupeesDecimal(totals.subtotalPaise),
        item_discount_total: toRupeesDecimal(totals.itemDiscountTotalPaise),
        order_discount_amount: toRupeesDecimal(totals.orderDiscountPaise),
        accessories_cost: toRupeesDecimal(totals.accessoriesCostPaise),
        stitching_cost: toRupeesDecimal(totals.stitchingCostPaise),
        taxable_amount: toRupeesDecimal(totals.taxableAmountPaise),
        cgst_rate: totals.cgstRate,
        cgst_amount: toRupeesDecimal(totals.cgstAmountPaise),
        sgst_rate: totals.sgstRate,
        sgst_amount: toRupeesDecimal(totals.sgstAmountPaise),
        grand_total: toRupeesDecimal(totals.grandTotalPaise),
        advance_paid: toRupeesDecimal(totals.totalPaidPaise),
        balance_due: toRupeesDecimal(totals.balanceDuePaise),
        payment_status: totals.paymentStatus as PaymentStatus,
        updated_at: now
      })
      .eq("id", order.id)
  );

  for (const index of itemIndexes) {
    const item = order.items[index];
    if (!item) continue;

    const quantity = readNumber(formData, `items.${index}.quantity`, item.quantity);
    const rateRupees = readNumber(formData, `items.${index}.rateRupees`, paiseToRupees(item.ratePaise));
    const draft = {
      quantity,
      ratePaise: rupeesToPaise(rateRupees),
      discountPaise: item.discountPaise,
      stitchingCostPaise: rupeesToPaise(
        readNumber(formData, `items.${index}.stitchingCostRupees`, paiseToRupees(item.stitchingCostPaise))
      )
    };

    await assertUpdate(
      await admin
        .from("order_items")
        .update({
          garment_type: readString(formData, `items.${index}.garmentType`, item.garmentType),
          quantity: String(quantity),
          rate: rateRupees.toFixed(2),
          discount_amount: toRupeesDecimal(item.discountPaise),
          stitching_cost: toRupeesDecimal(draft.stitchingCostPaise),
          line_total: toRupeesDecimal(calculateLineTotal(draft)),
          fabric_length: readString(formData, `items.${index}.fabricLength`, item.fabricLength ?? "") || null,
          fabric_color: readString(formData, `items.${index}.fabricColor`, item.fabricColor ?? "") || null,
          design_reference: readString(formData, `items.${index}.designReference`, item.designReference ?? "") || null,
          stitching_instructions: readString(formData, `items.${index}.stitchingInstructions`, item.stitchingInstructions ?? "") || null,
          updated_at: now
        })
        .eq("id", item.id)
    );
  }

  for (const index of measurementIndexes(formData)) {
    const measurement = order.measurements[index];
    if (!measurement) continue;

    await assertUpdate(
      await admin
        .from("order_measurements")
        .update({
          value: readString(formData, `measurements.${index}.value`, measurement.value) || "NA",
          notes: index === 0 ? measurementNote || null : null,
          updated_at: now
        })
        .eq("id", measurement.id)
    );
  }
}
