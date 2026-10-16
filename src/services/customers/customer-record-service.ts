import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export interface NewCustomerRecord {
  fullName: string;
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface CustomerContactUpdate {
  phonePrimary: string;
  fullName?: string;
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

export async function updateCustomerContact(customerId: string, update: CustomerContactUpdate) {
  ensureSupabaseCustomers();

  const phonePrimary = update.phonePrimary.trim();
  if (!phonePrimary) {
    throw new Error("Phone number is required.");
  }
  if (update.fullName !== undefined && update.fullName.trim().length < 1) {
    throw new Error("Customer name is required.");
  }

  // Only the fields that were provided are changed; empty optional fields are cleared.
  const patch: Record<string, string | null> = {
    phone_primary: phonePrimary,
    updated_at: new Date().toISOString()
  };
  if (update.fullName !== undefined) patch.full_name = update.fullName.trim();
  if (update.phoneSecondary !== undefined) patch.phone_secondary = emptyToNull(update.phoneSecondary);
  if (update.email !== undefined) patch.email = emptyToNull(update.email);
  if (update.address !== undefined) patch.address = emptyToNull(update.address);
  if (update.notes !== undefined) patch.notes = emptyToNull(update.notes);

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("customers").update(patch).eq("id", customerId);

  if (error) throw new Error(error.message);
}
