import { calculateLineTotal, calculateOrderTotals } from "@/lib/calculations/order";
import { rupeesToPaise, paiseToRupees } from "@/lib/utils/money";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import type { ParsedOrderForm } from "@/services/orders/order-form-parser";
import type { Json } from "@/types/supabase";

export interface SavedOrderResult {
  orderId: string;
  receiptNumber?: string;
}

function toRupeesDecimal(paise: number) {
  return paiseToRupees(paise).toFixed(2);
}

export async function saveParsedOrder(parsed: ParsedOrderForm): Promise<SavedOrderResult> {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local to save real orders."
    );
  }

  const admin = createSupabaseAdminClient();
  const itemDrafts = parsed.order.items.map((item) => ({
    quantity: item.quantity,
    ratePaise: rupeesToPaise(item.rateRupees),
    discountPaise: 0,
    stitchingCostPaise: rupeesToPaise(item.stitchingCostRupees)
  }));
  const payment = parsed.order.advancePaidRupees > 0 ? [{ amountPaise: rupeesToPaise(parsed.order.advancePaidRupees) }] : [];
  const totals = calculateOrderTotals({
    items: itemDrafts,
    orderDiscountPaise: rupeesToPaise(parsed.order.orderDiscountRupees),
    accessoriesCostPaise: rupeesToPaise(parsed.order.accessoriesCostRupees),
    cgstRate: 2.5,
    sgstRate: 2.5,
    payments: payment
  });
  const paymentPayload =
    parsed.order.advancePaidRupees > 0
      ? {
          amount: parsed.order.advancePaidRupees.toFixed(2),
          payment_method: parsed.order.paymentMethod,
          payment_reference: null,
          notes: "Advance collected at order creation"
        }
      : undefined;

  const payload = {
    customer: {
      full_name: parsed.order.customerName,
      phone_primary: parsed.order.phonePrimary
    },
    order: {
      status: parsed.order.status,
      priority: parsed.order.priority,
      order_date: parsed.order.orderDate,
      delivery_date: parsed.order.deliveryDate,
      assigned_tailor_name: parsed.order.assignedTailor || null,
      cloth_sample_image_url: parsed.clothSampleDataUrl || null,
      internal_notes: parsed.order.internalNotes || null,
      customer_notes: parsed.order.customerNotes || null,
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
      payment_status: totals.paymentStatus
    },
    items: parsed.order.items.map((item, index) => ({
      garment_type: item.garmentType,
      custom_garment_type: item.customGarmentType || null,
      quantity: item.quantity,
      rate: item.rateRupees.toFixed(2),
      discount_amount: "0.00",
      stitching_cost: item.stitchingCostRupees.toFixed(2),
      line_total: toRupeesDecimal(calculateLineTotal(itemDrafts[index])),
      fabric_length: item.fabricLength || null,
      fabric_color: item.fabricColor || null,
      design_reference: item.designReference || null,
      stitching_instructions: item.stitchingInstructions || null,
      sort_order: index + 1
    })),
    measurements: parsed.measurements.map((measurement) => ({
      field_key: measurement.fieldKey,
      display_code: measurement.displayCode,
      display_label: measurement.displayLabel,
      value: measurement.value,
      unit: measurement.unit,
      item_sort_order: measurement.orderItemSortOrder ?? null,
      notes: measurement.notes || null,
      sort_order: measurement.sortOrder
    })),
    ...(paymentPayload ? { payment: paymentPayload } : {})
  };

  const { data, error } = await admin.rpc("create_order_from_payload", { p_payload: payload as Json });
  if (error) {
    if (isMissingSupabaseSchemaError(error)) {
      throw new Error(
        "Supabase database setup is incomplete. Run the SQL files in supabase/migrations in order, then run supabase/seed.sql, and run NOTIFY pgrst, 'reload schema'; in Supabase SQL Editor."
      );
    }
    throw new Error(error.message);
  }

  const result = data as { order_id?: string; receipt_number?: string | null } | null;
  if (!result?.order_id) {
    throw new Error("Supabase did not return a saved order id.");
  }

  return {
    orderId: result.order_id,
    receiptNumber: result.receipt_number ?? undefined
  };
}
