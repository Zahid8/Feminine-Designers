import { orders } from "@/lib/data/mock";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { paiseToRupees, rupeesToPaise } from "@/lib/utils/money";
import type { PaymentMethod } from "@/types/domain";

interface SupabaseOrderPaymentTotals {
  advance_paid: string | number;
  balance_due: string | number;
  grand_total: string | number;
}

export async function listPaymentsForOrder(orderId: string) {
  return orders.find((order) => order.id === orderId)?.payments ?? [];
}

function toRupeesDecimal(paise: number) {
  return paiseToRupees(paise).toFixed(2);
}

function ensureSupabasePayments() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Payment updates require the database.");
  }
}

export async function settleOrderBalance(orderId: string, method: PaymentMethod = "Cash") {
  ensureSupabasePayments();

  const admin = createSupabaseAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("advance_paid,balance_due,grand_total")
    .eq("id", orderId)
    .single();

  if (orderError) throw new Error(orderError.message);
  if (!order) throw new Error("Order was not found.");

  const totals = order as SupabaseOrderPaymentTotals;
  const balanceDuePaise = rupeesToPaise(Number(totals.balance_due));
  if (balanceDuePaise <= 0) {
    throw new Error("This order has no outstanding balance.");
  }

  const nextAdvancePaidPaise = rupeesToPaise(Number(totals.advance_paid)) + balanceDuePaise;
  const grandTotalPaise = rupeesToPaise(Number(totals.grand_total));
  const nextPaymentStatus = nextAdvancePaidPaise > grandTotalPaise ? "Credit" : "Paid";
  const paidAt = new Date().toISOString();

  const { error: paymentError } = await admin.from("payments").insert({
    order_id: orderId,
    amount: toRupeesDecimal(balanceDuePaise),
    payment_method: method,
    paid_at: paidAt,
    notes: "Marked paid from dashboard"
  });

  if (paymentError) throw new Error(paymentError.message);

  const { error: updateError } = await admin
    .from("orders")
    .update({
      advance_paid: toRupeesDecimal(nextAdvancePaidPaise),
      balance_due: "0.00",
      payment_status: nextPaymentStatus,
      updated_at: paidAt
    })
    .eq("id", orderId);

  if (updateError) throw new Error(updateError.message);
}
