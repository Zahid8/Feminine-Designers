import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { removeStoredClothSample } from "@/services/orders/cloth-sample-storage";

export async function deleteOrderById(orderId: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Order deletion requires the database.");
  }

  const admin = createSupabaseAdminClient();
  const { data: photoRow } = await admin.from("orders").select("cloth_sample_image_url").eq("id", orderId).maybeSingle();
  const { error: profileError } = await admin
    .from("customer_measurement_profiles")
    .delete()
    .eq("source_order_id", orderId);

  if (profileError) throw new Error(profileError.message);

  const { error } = await admin.from("orders").delete().eq("id", orderId);

  if (error) throw new Error(error.message);

  await removeStoredClothSample(admin, photoRow?.cloth_sample_image_url);
}
