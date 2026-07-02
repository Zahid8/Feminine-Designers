import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/types/domain";

interface SupabaseOrderStatusRecord {
  status: OrderStatus;
}

function ensureSupabaseOrderStatus() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Order status updates require the database.");
  }
}

function itemDeliveryPatch(nextStatus: OrderStatus, changedAt: string) {
  if (nextStatus === "Delivered") {
    return { delivered: true, delivered_at: changedAt };
  }

  if (nextStatus === "Ready") {
    return { delivered: false, delivered_at: null };
  }

  return undefined;
}

export async function updateOrderStage(orderId: string, nextStatus: OrderStatus) {
  ensureSupabaseOrderStatus();

  const admin = createSupabaseAdminClient();
  const { data: currentOrder, error: fetchError } = await admin.from("orders").select("status").eq("id", orderId).single();
  if (fetchError) throw new Error(fetchError.message);
  if (!currentOrder) throw new Error("Order was not found.");

  const previousStatus = (currentOrder as SupabaseOrderStatusRecord).status;
  const changedAt = new Date().toISOString();

  const { error: updateError } = await admin
    .from("orders")
    .update({
      status: nextStatus,
      updated_at: changedAt
    })
    .eq("id", orderId);

  if (updateError) throw new Error(updateError.message);

  const itemPatch = itemDeliveryPatch(nextStatus, changedAt);
  if (itemPatch) {
    const { error: itemError } = await admin.from("order_items").update(itemPatch).eq("order_id", orderId);
    if (itemError) throw new Error(itemError.message);
  }

  if (previousStatus !== nextStatus) {
    const { error: historyError } = await admin.from("order_status_history").insert({
      order_id: orderId,
      from_status: previousStatus,
      to_status: nextStatus,
      notes: "Status changed from order edit"
    });
    if (historyError) throw new Error(historyError.message);
  }
}
