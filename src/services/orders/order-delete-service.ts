import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export async function deleteOrderById(orderId: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Order deletion requires the database.");
  }

  const admin = createSupabaseAdminClient();
  const { error: profileError } = await admin
    .from("customer_measurement_profiles")
    .delete()
    .eq("source_order_id", orderId);

  if (profileError) throw new Error(profileError.message);

  const { error } = await admin.from("orders").delete().eq("id", orderId);

  if (error) throw new Error(error.message);
}
