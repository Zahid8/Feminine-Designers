import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import { customers as mockCustomers, orders as mockOrders } from "@/lib/data/mock";
import type { OrderStatus } from "@/types/domain";
import type { SearchResults } from "@/types/search";

const LIMIT = 6;

/** Keeps only characters that are safe inside a PostgREST `or=(...)` filter. */
export function sanitizeSearchTerm(query: string) {
  return query.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 40);
}

function mockSearch(term: string): SearchResults {
  const needle = term.toLowerCase();
  const customers = mockCustomers
    .filter((customer) => customer.fullName.toLowerCase().includes(needle) || customer.phonePrimary.includes(needle))
    .slice(0, LIMIT);
  const customerIds = new Set(customers.map((customer) => customer.id));
  return {
    customers: customers.map((customer) => ({ id: customer.id, fullName: customer.fullName, phone: customer.phonePrimary })),
    orders: mockOrders
      .filter((order) => order.receiptNumber?.toLowerCase().includes(needle) || customerIds.has(order.customerId))
      .slice(0, LIMIT)
      .map((order) => ({
        id: order.id,
        receiptNumber: order.receiptNumber ?? null,
        customerName: order.customer.fullName,
        phone: order.customer.phonePrimary,
        status: order.status,
        deliveryDate: order.deliveryDate
      }))
  };
}

/** Header quick search: a handful of matching customers and orders with minimal fields. */
export async function quickSearch(query: string): Promise<SearchResults> {
  const term = sanitizeSearchTerm(query);
  if (term.length < 2) return { orders: [], customers: [] };
  if (!hasSupabaseAdminEnv()) return mockSearch(term);

  const admin = createSupabaseAdminClient();
  const pattern = `%${term}%`;
  const customerResult = await admin
    .from("customers")
    .select("id, full_name, phone_primary")
    .is("archived_at", null)
    .or(`full_name.ilike.${pattern},phone_primary.ilike.${pattern}`)
    .order("updated_at", { ascending: false })
    .limit(LIMIT);
  if (customerResult.error) {
    if (isMissingSupabaseSchemaError(customerResult.error)) return mockSearch(term);
    throw new Error(customerResult.error.message);
  }

  const customerRows = customerResult.data ?? [];
  const customerIds = customerRows.map((customer) => customer.id);
  const orderFilter = [`receipt_number.ilike.${pattern}`, ...(customerIds.length ? [`customer_id.in.(${customerIds.join(",")})`] : [])].join(",");
  const orderResult = await admin
    .from("orders")
    .select("id, receipt_number, status, delivery_date, customer:customers(full_name, phone_primary)")
    .or(orderFilter)
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (orderResult.error) throw new Error(orderResult.error.message);

  type OrderRow = {
    id: string;
    receipt_number: string | null;
    status: OrderStatus;
    delivery_date: string;
    customer: { full_name: string; phone_primary: string } | null;
  };

  return {
    customers: customerRows.map((customer) => ({ id: customer.id, fullName: customer.full_name, phone: customer.phone_primary })),
    orders: ((orderResult.data ?? []) as unknown as OrderRow[]).map((order) => ({
      id: order.id,
      receiptNumber: order.receipt_number,
      customerName: order.customer?.full_name ?? "",
      phone: order.customer?.phone_primary ?? "",
      status: order.status,
      deliveryDate: order.delivery_date
    }))
  };
}
