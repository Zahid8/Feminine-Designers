import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

function ensureSupabaseDeliveryTracking() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Item delivery tracking requires the database.");
  }
}

export async function updateOrderItemDelivered(itemId: string, delivered: boolean) {
  ensureSupabaseDeliveryTracking();

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("order_items")
    .update({ delivered, delivered_at: delivered ? new Date().toISOString() : null })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}

export async function updateAllOrderItemsDelivered(orderId: string, delivered: boolean) {
  ensureSupabaseDeliveryTracking();

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("order_items")
    .update({ delivered, delivered_at: delivered ? new Date().toISOString() : null })
    .eq("order_id", orderId);

  if (error) throw new Error(error.message);
}

export async function updateOrderCompleted(orderId: string, completed: boolean) {
  ensureSupabaseDeliveryTracking();

  const admin = createSupabaseAdminClient();
  const completedAt = completed ? new Date().toISOString() : null;
  const { error: orderError } = await admin
    .from("orders")
    .update({
      status: completed ? "Delivered" : "Ready",
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId);

  if (orderError) throw new Error(orderError.message);

  const { error: itemsError } = await admin
    .from("order_items")
    .update({ delivered: completed, delivered_at: completedAt })
    .eq("order_id", orderId);

  if (itemsError) throw new Error(itemsError.message);
}
