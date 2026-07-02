import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export interface NewCustomerRecord {
  fullName: string;
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
  notes?: string;
}

function ensureSupabaseCustomers() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Customer record changes require the database.");
  }
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createCustomerRecord(customer: NewCustomerRecord) {
  ensureSupabaseCustomers();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("customers")
    .insert({
      full_name: customer.fullName.trim(),
      phone_primary: customer.phonePrimary.trim(),
      phone_secondary: emptyToNull(customer.phoneSecondary),
      email: emptyToNull(customer.email),
      address: emptyToNull(customer.address),
      notes: emptyToNull(customer.notes),
      preferred_communication: "WhatsApp"
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Customer was not created.");
  return data.id as string;
}

export async function archiveCustomerRecord(customerId: string) {
  ensureSupabaseCustomers();

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("customers")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", customerId);

  if (error) throw new Error(error.message);
}
