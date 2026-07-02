import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

function ensureSupabaseDeliveryTracking() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Item delivery tracking requires the database.");
  }
}

async function updateOrderStatusForCompletion(orderId: string, completed: boolean) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("orders")
    .update({
      status: completed ? "Delivered" : "Ready",
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}

async function syncOrderStatusFromItems(orderId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("order_items").select("delivered").eq("order_id", orderId);

  if (error) throw new Error(error.message);

  const allDelivered = Array.isArray(data) && data.length > 0 && data.every((item) => Boolean(item.delivered));
  if (allDelivered) {
    await updateOrderStatusForCompletion(orderId, true);
  }
}

export async function updateOrderItemDelivered(orderId: string, itemId: string, delivered: boolean) {
  ensureSupabaseDeliveryTracking();

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("order_items")
    .update({ delivered, delivered_at: delivered ? new Date().toISOString() : null })
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  if (delivered) {
    await syncOrderStatusFromItems(orderId);
  } else {
    await updateOrderStatusForCompletion(orderId, false);
  }
}

export async function updateAllOrderItemsDelivered(orderId: string, delivered: boolean) {
  ensureSupabaseDeliveryTracking();

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("order_items")
    .update({ delivered, delivered_at: delivered ? new Date().toISOString() : null })
    .eq("order_id", orderId);

  if (error) throw new Error(error.message);

  await updateOrderStatusForCompletion(orderId, delivered);
}

export async function updateOrderCompleted(orderId: string, completed: boolean) {
  ensureSupabaseDeliveryTracking();

  const admin = createSupabaseAdminClient();
  const completedAt = completed ? new Date().toISOString() : null;
  await updateOrderStatusForCompletion(orderId, completed);

  const { error: itemsError } = await admin
    .from("order_items")
    .update({ delivered: completed, delivered_at: completedAt })
    .eq("order_id", orderId);

  if (itemsError) throw new Error(itemsError.message);
}
