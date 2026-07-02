import { customers, orders } from "@/lib/data/mock";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import { listOrders } from "@/services/orders/order-service";
import type { Customer } from "@/types/domain";
import type { ReturningCustomerMatch } from "@/types/customer-search";

interface SupabaseCustomerRecord {
  id: string;
  customer_code: string | null;
  full_name: string;
  phone_primary: string;
  phone_secondary: string | null;
  email: string | null;
  address: string | null;
  birth_date: string | null;
  notes: string | null;
  preferred_communication: string | null;
  tags: string[] | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

function mapCustomer(record: SupabaseCustomerRecord): Customer {
  return {
    id: record.id,
    customerCode: record.customer_code ?? record.id.slice(0, 8),
    fullName: record.full_name,
    phonePrimary: record.phone_primary,
    phoneSecondary: record.phone_secondary ?? undefined,
    email: record.email ?? undefined,
    address: record.address ?? undefined,
    birthDate: record.birth_date ?? undefined,
    notes: record.notes ?? undefined,
    preferredCommunication: record.preferred_communication === "Email" ? "Email" : "WhatsApp",
    tags: Array.isArray(record.tags) ? record.tags : [],
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

async function fetchSupabaseCustomers() {
  if (!hasSupabaseAdminEnv()) return undefined;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("customers").select("*").is("archived_at", null).order("created_at", { ascending: false });

  if (error) {
    if (isMissingSupabaseSchemaError(error)) return undefined;
    throw new Error(error.message);
  }

  return (data as SupabaseCustomerRecord[]).map(mapCustomer);
}

export async function listCustomers(query?: string) {
  const sourceCustomers = (await fetchSupabaseCustomers()) ?? customers;
  const normalized = query?.trim().toLowerCase();
  if (!normalized) return sourceCustomers;
  return sourceCustomers.filter(
    (customer) =>
      customer.fullName.toLowerCase().includes(normalized) ||
      customer.phonePrimary.includes(normalized) ||
      customer.customerCode.toLowerCase().includes(normalized)
  );
}

export async function getCustomerById(id: string) {
  const sourceCustomers = (await fetchSupabaseCustomers()) ?? customers;
  return sourceCustomers.find((customer) => customer.id === id);
}

export async function getCustomerProfile(id: string) {
  const customer = await getCustomerById(id);
  if (!customer) return undefined;
  const sourceOrders = hasSupabaseAdminEnv() ? await listOrders() : orders;
  const customerOrders = sourceOrders.filter((order) => order.customerId === id);
  const latestMeasurements = customerOrders[0]?.measurements ?? [];
  const outstandingPaise = customerOrders.reduce((sum, order) => sum + Math.max(0, order.totals.balanceDuePaise), 0);
  return { customer, orders: customerOrders, latestMeasurements, outstandingPaise };
}

export async function findDuplicateCustomers(phone: string) {
  const sourceCustomers = (await fetchSupabaseCustomers()) ?? customers;
  return sourceCustomers.filter((customer) => customer.phonePrimary === phone || customer.phoneSecondary === phone);
}

export async function searchReturningCustomerMatches(query: string, limit = 8): Promise<ReturningCustomerMatch[]> {
  const normalized = query.trim();
  if (normalized.length < 2) return [];

  const matchedCustomers = (await listCustomers(normalized)).slice(0, limit);
  const profiles = await Promise.all(
    matchedCustomers.map(async (customer) => {
      const profile = await getCustomerProfile(customer.id);
      return {
        id: customer.id,
        customerCode: customer.customerCode,
        fullName: customer.fullName,
        phonePrimary: customer.phonePrimary,
        measurements: profile?.latestMeasurements ?? []
      };
    })
  );

  return profiles;
}
