import { calculateLineTotal, calculateOrderTotals } from "@/lib/calculations/order";
import { normalizeDateInput } from "@/lib/utils/date";
import { paiseToRupees, rupeesToPaise } from "@/lib/utils/money";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import type { OrderItem, OrderStatus, OrderWithCustomer, PaymentMethod, PaymentStatus, Priority } from "@/types/domain";

function readString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}

function readRequiredString(formData: FormData, key: string, fallback = "") {
  return readString(formData, key, fallback) || fallback;
}

function readNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(readString(formData, key, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function readLastString<T extends string>(formData: FormData, key: string, fallback: T) {
  const values = formData.getAll(key).filter((value): value is string => typeof value === "string" && value.trim() !== "");
  return (values.at(-1)?.trim() as T | undefined) ?? fallback;
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

interface SubmittedItemRow {
  index: number;
  id: string;
  existingItem?: OrderItem;
}

function submittedItemRows(order: OrderWithCustomer, formData: FormData): SubmittedItemRow[] {
  return orderItemIndexes(formData).map((index) => {
    const id = readString(formData, `items.${index}.id`);
    return {
      index,
      id,
      existingItem: id ? order.items.find((item) => item.id === id) : undefined
    };
  });
}

function effectiveItemRows(order: OrderWithCustomer, formData: FormData): SubmittedItemRow[] {
  const submittedRows = submittedItemRows(order, formData);
  const replaceItems = readString(formData, "items.intent") === "replace";

  if (replaceItems) return submittedRows;
  if (submittedRows.length === 0) {
    return order.items.map((item, index) => ({
      index,
      id: item.id,
      existingItem: item
    }));
  }

  const submittedById = new Map(submittedRows.filter((row) => row.id).map((row) => [row.id, row]));
  const submittedByIndex = new Map(submittedRows.map((row) => [row.index, row]));

  return order.items.map((item, index) => submittedById.get(item.id) ?? submittedByIndex.get(index) ?? {
    index,
    id: item.id,
    existingItem: item
  });
}

function extraCostIndexes(formData: FormData, itemIndex: number) {
  const indexes = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(new RegExp(`^items\\.${itemIndex}\\.extraCosts\\.(\\d+)\\.`));
    if (match) indexes.add(Number(match[1]));
  }
  return [...indexes].sort((a, b) => a - b);
}

function extraCostsFromForm(formData: FormData, itemIndex: number) {
  return extraCostIndexes(formData, itemIndex)
    .map((costIndex) => ({
      label: readString(formData, `items.${itemIndex}.extraCosts.${costIndex}.label`),
      amountPaise: rupeesToPaise(readNumber(formData, `items.${itemIndex}.extraCosts.${costIndex}.amountRupees`, 0)),
      sortOrder: costIndex + 1
    }))
    .filter((cost) => cost.label !== "" && cost.amountPaise >= 0);
}

function sumExtraCosts(costs: { amountPaise: number }[]) {
  return costs.reduce((sum, cost) => sum + cost.amountPaise, 0);
}

function measurementIndexes(formData: FormData) {
  const indexes = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(/^measurements\.(\d+)\.id$/);
    if (match) indexes.add(Number(match[1]));
  }
  return [...indexes].sort((a, b) => a - b);
}

function newMeasurementFields(formData: FormData) {
  const fields = new Set<string>();
  for (const key of formData.keys()) {
    const match = key.match(/^newMeasurement\.([^.]+)$/);
    if (match) fields.add(match[1]);
  }
  return [...fields].sort((a, b) => {
    const aSort = readNumber(formData, `newMeasurementMeta.${a}.sortOrder`, 0);
    const bSort = readNumber(formData, `newMeasurementMeta.${b}.sortOrder`, 0);
    return aSort - bSort || a.localeCompare(b);
  });
}

function newMeasurementRows(order: OrderWithCustomer, formData: FormData) {
  const notes = readString(formData, "newMeasurementNotes");
  return newMeasurementFields(formData)
    .map((fieldKey, index) => ({
      order_id: order.id,
      order_item_id: null,
      template_id: null,
      field_key: fieldKey,
      display_code: readString(formData, `newMeasurementMeta.${fieldKey}.displayCode`, fieldKey.toUpperCase()),
      display_label: readString(formData, `newMeasurementMeta.${fieldKey}.displayLabel`, fieldKey),
      value: readString(formData, `newMeasurement.${fieldKey}`),
      unit: readString(formData, `newMeasurementMeta.${fieldKey}.unit`, "in"),
      notes: index === 0 ? notes || null : null,
      sort_order: readNumber(formData, `newMeasurementMeta.${fieldKey}.sortOrder`, index + 1)
    }))
    .filter((row) => row.value !== "");
}

function lineItemFromForm(formData: FormData, row: SubmittedItemRow) {
  const fallback = row.existingItem;
  const quantity = readNumber(formData, `items.${row.index}.quantity`, fallback?.quantity ?? 1);
  const ratePaise = rupeesToPaise(readNumber(formData, `items.${row.index}.rateRupees`, paiseToRupees(fallback?.ratePaise ?? 0)));
  const discountPaise = fallback?.discountPaise ?? 0;
  const stitchingCostPaise = rupeesToPaise(
    readNumber(formData, `items.${row.index}.stitchingCostRupees`, paiseToRupees(fallback?.stitchingCostPaise ?? 0))
  );
  const fabricPricePaise = rupeesToPaise(
    readNumber(formData, `items.${row.index}.fabricPriceRupees`, paiseToRupees(fallback?.fabricPricePaise ?? 0))
  );
  const dyePricePaise = rupeesToPaise(
    readNumber(formData, `items.${row.index}.dyePriceRupees`, paiseToRupees(fallback?.dyePricePaise ?? 0))
  );
  const extraCosts = extraCostsFromForm(formData, row.index);

  return {
    quantity,
    ratePaise,
    discountPaise,
    stitchingCostPaise,
    fabricPricePaise,
    dyePricePaise,
    extraCostPaise: sumExtraCosts(extraCosts)
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
  const itemRows = effectiveItemRows(order, formData);
  if (itemRows.length === 0) {
    throw new Error("An order must have at least one dress item.");
  }
  const measurementNote = readString(formData, "measurementNotes");
  const now = new Date().toISOString();
  const nextStatus = readLastString<OrderStatus>(formData, "status", order.status);
  const nextPriority = readLastString<Priority>(formData, "priority", order.priority);
  const clothSampleDataUrl = readString(formData, "clothSampleDataUrl");
  const removeClothSample = readString(formData, "removeClothSample") === "1";
  const paymentFieldsSubmitted = formData.has("advancePaidRupees") || formData.has("paymentMethod") || formData.has("paymentReference");
  const existingPaymentTotalPaise = order.payments.reduce((sum, payment) => sum + payment.amountPaise, 0);
  const editedAdvancePaidPaise = rupeesToPaise(readNumber(formData, "advancePaidRupees", paiseToRupees(existingPaymentTotalPaise)));
  const editedPayments = paymentFieldsSubmitted
    ? editedAdvancePaidPaise > 0
      ? [{ amountPaise: editedAdvancePaidPaise }]
      : []
    : order.payments.map((payment) => ({ amountPaise: payment.amountPaise }));

  const editedLineItems = itemRows.map((row) => lineItemFromForm(formData, row));

  const totals = calculateOrderTotals({
    items: editedLineItems,
    accessoriesCostPaise: rupeesToPaise(readNumber(formData, "accessoriesCostRupees", paiseToRupees(order.totals.accessoriesCostPaise))),
    orderDiscountPaise: rupeesToPaise(readNumber(formData, "orderDiscountRupees", paiseToRupees(order.totals.orderDiscountPaise))),
    cgstRate: order.totals.cgstRate,
    sgstRate: order.totals.sgstRate,
    payments: editedPayments
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
        status: nextStatus,
        priority: nextPriority,
        order_date: normalizeDateInput(readRequiredString(formData, "orderDate", order.orderDate)),
        delivery_date: normalizeDateInput(readRequiredString(formData, "deliveryDate", order.deliveryDate)),
        assigned_tailor_name: readString(formData, "assignedTailor", order.assignedTailor ?? "") || null,
        cloth_sample_image_url: removeClothSample ? null : clothSampleDataUrl || order.clothSampleImageUrl || null,
        internal_notes: readString(formData, "internalNotes", order.internalNotes ?? "") || null,
        customer_notes: readString(formData, "customerNotes", order.customerNotes ?? "") || null,
        subtotal: toRupeesDecimal(totals.subtotalPaise),
        item_discount_total: toRupeesDecimal(totals.itemDiscountTotalPaise),
        order_discount_amount: toRupeesDecimal(totals.orderDiscountPaise),
        accessories_cost: toRupeesDecimal(totals.accessoriesCostPaise),
        stitching_cost: toRupeesDecimal(totals.stitchingCostPaise),
        extra_cost: toRupeesDecimal(totals.extraCostPaise),
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

  if (paymentFieldsSubmitted) {
    await assertUpdate(await admin.from("payments").delete().eq("order_id", order.id));

    if (editedAdvancePaidPaise > 0) {
      const latestPayment = order.payments.at(-1);
      const { error } = await admin.from("payments").insert({
        order_id: order.id,
        amount: toRupeesDecimal(editedAdvancePaidPaise),
        payment_method: readLastString<PaymentMethod>(formData, "paymentMethod", latestPayment?.method ?? "Cash"),
        payment_reference: readString(formData, "paymentReference", latestPayment?.paymentReference ?? "") || null,
        paid_at: now,
        notes: "Advance updated from saved bill edit"
      });
      if (error) throw new Error(error.message);
    }
  }

  const submittedExistingItemIds = new Set(itemRows.filter((row) => row.id).map((row) => row.id));
  const deletedItemIds = order.items.map((item) => item.id).filter((itemId) => !submittedExistingItemIds.has(itemId));

  await assertUpdate(await admin.from("order_item_extra_costs").delete().eq("order_id", order.id));

  for (const item of order.items) {
    await assertUpdate(await admin.from("order_item_extra_costs").delete().eq("order_item_id", item.id));
  }

  for (const itemId of deletedItemIds) {
    await assertUpdate(await admin.from("order_items").delete().eq("id", itemId));
  }

  for (const row of itemRows) {
    const item = row.existingItem;
    const index = row.index;

    const quantity = readNumber(formData, `items.${index}.quantity`, item?.quantity ?? 1);
    const rateRupees = readNumber(formData, `items.${index}.rateRupees`, paiseToRupees(item?.ratePaise ?? 0));
    const draft = {
      quantity,
      ratePaise: rupeesToPaise(rateRupees),
      discountPaise: item?.discountPaise ?? 0,
      stitchingCostPaise: rupeesToPaise(
        readNumber(formData, `items.${index}.stitchingCostRupees`, paiseToRupees(item?.stitchingCostPaise ?? 0))
      ),
      fabricPricePaise: rupeesToPaise(
        readNumber(formData, `items.${index}.fabricPriceRupees`, paiseToRupees(item?.fabricPricePaise ?? 0))
      ),
      dyePricePaise: rupeesToPaise(readNumber(formData, `items.${index}.dyePriceRupees`, paiseToRupees(item?.dyePricePaise ?? 0)))
    };
    const extraCosts = extraCostsFromForm(formData, index);
    const extraCostPaise = sumExtraCosts(extraCosts);
    const draftWithExtraCost = { ...draft, extraCostPaise };
    const itemPayload = {
      garment_type: readString(formData, `items.${index}.garmentType`, item?.garmentType ?? ""),
      quantity: String(quantity),
      rate: rateRupees.toFixed(2),
      discount_amount: toRupeesDecimal(item?.discountPaise ?? 0),
      stitching_cost: toRupeesDecimal(draft.stitchingCostPaise),
      fabric_price: toRupeesDecimal(draft.fabricPricePaise),
      dye_price: toRupeesDecimal(draft.dyePricePaise),
      extra_cost: toRupeesDecimal(extraCostPaise),
      line_total: toRupeesDecimal(calculateLineTotal(draftWithExtraCost)),
      fabric_length: readString(formData, `items.${index}.fabricLength`, item?.fabricLength ?? "") || null,
      fabric_color: readString(formData, `items.${index}.fabricColor`, item?.fabricColor ?? "") || null,
      design_reference: readString(formData, `items.${index}.designReference`, item?.designReference ?? "") || null,
      stitching_instructions: readString(formData, `items.${index}.stitchingInstructions`, item?.stitchingInstructions ?? "") || null,
      sort_order: index + 1,
      updated_at: now
    };

    if (item) {
      await assertUpdate(await admin.from("order_items").update(itemPayload).eq("id", item.id));
    } else {
      const { error } = await admin.from("order_items").insert({
        ...itemPayload,
        order_id: order.id,
        delivered: false,
        delivered_at: null,
        created_at: now
      });
      if (error) throw new Error(error.message);
    }

    if (extraCosts.length > 0) {
      const { error } = await admin.from("order_item_extra_costs").insert(
        extraCosts.map((cost) => ({
          order_id: order.id,
          order_item_id: item?.id ?? null,
          item_sort_order: index + 1,
          label: cost.label,
          amount: toRupeesDecimal(cost.amountPaise),
          sort_order: cost.sortOrder
        }))
      );
      if (error) throw new Error(error.message);
    }
  }

  for (const index of measurementIndexes(formData)) {
    const measurement = order.measurements[index];
    if (!measurement) continue;

    await assertUpdate(
      await admin
        .from("order_measurements")
        .update({
          value: readString(formData, `measurements.${index}.value`, measurement.value),
          notes: index === 0 ? measurementNote || null : null,
          updated_at: now
        })
        .eq("id", measurement.id)
    );
  }

  if (order.measurements.length === 0) {
    const rows = newMeasurementRows(order, formData);
    if (rows.length) {
      const { error } = await admin.from("order_measurements").insert(rows);
      if (error) throw new Error(error.message);
    }
  }

  if (nextStatus === "Ready" || nextStatus === "Delivered") {
    await assertUpdate(
      await admin
        .from("order_items")
        .update({
          delivered: nextStatus === "Delivered",
          delivered_at: nextStatus === "Delivered" ? now : null
        })
        .eq("order_id", order.id)
    );
  }

  if (nextStatus !== order.status) {
    const { error } = await admin.from("order_status_history").insert({
      order_id: order.id,
      from_status: order.status,
      to_status: nextStatus,
      notes: "Status changed from saved bill edit"
    });

    if (error) throw new Error(error.message);
  }
}
