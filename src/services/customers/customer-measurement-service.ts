import { getCustomerById } from "@/services/customers/customer-service";
import { listOrders } from "@/services/orders/order-service";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import type { Customer, MeasurementValue, OrderWithCustomer } from "@/types/domain";

interface CustomerMeasurementProfileRecord {
  id: string;
  field_key: string;
  value: string;
  unit: string;
  source_order_id: string | null;
  updated_at: string;
}

export interface CustomerMeasurementProfile {
  customer: Customer;
  values: MeasurementValue[];
  sourceOrder?: OrderWithCustomer;
  sourceOrderId?: string;
}

function fallbackCode(fieldKey: string) {
  return fieldKey
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function latestOrderWithMeasurements(orders: OrderWithCustomer[]) {
  return orders
    .filter((order) => order.measurements.length > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function manualProfileRows(records: CustomerMeasurementProfileRecord[]) {
  return records.filter((record) => !record.source_order_id);
}

function buildProfileValues(records: CustomerMeasurementProfileRecord[], sourceOrder?: OrderWithCustomer) {
  const sourceByField = new Map(sourceOrder?.measurements.map((measurement) => [measurement.fieldKey, measurement]));
  const latestByField = new Map<string, CustomerMeasurementProfileRecord>();

  for (const record of records.sort((a, b) => b.updated_at.localeCompare(a.updated_at))) {
    if (!latestByField.has(record.field_key)) {
      latestByField.set(record.field_key, record);
    }
  }

  return [...latestByField.values()]
    .map<MeasurementValue>((record, index) => {
      const source = sourceByField.get(record.field_key);
      return {
        id: record.id,
        templateId: source?.templateId,
        orderItemId: source?.orderItemId,
        orderItemSortOrder: source?.orderItemSortOrder,
        fieldKey: record.field_key,
        displayCode: source?.displayCode ?? fallbackCode(record.field_key),
        displayLabel: source?.displayLabel ?? record.field_key.replaceAll("_", " ").replaceAll("-", " "),
        value: record.value,
        unit: record.unit,
        notes: source?.notes,
        sortOrder: source?.sortOrder ?? index + 1
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

async function fetchProfileRows(customerId: string) {
  if (!hasSupabaseAdminEnv()) return undefined;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("customer_measurement_profiles")
    .select("id,field_key,value,unit,source_order_id,updated_at")
    .eq("customer_id", customerId)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingSupabaseSchemaError(error)) return undefined;
    throw new Error(error.message);
  }

  return data as CustomerMeasurementProfileRecord[];
}

export async function getCustomerMeasurementProfile(customerId: string): Promise<CustomerMeasurementProfile | undefined> {
  const customer = await getCustomerById(customerId);
  if (!customer) return undefined;

  const orders = (await listOrders()).filter((order) => order.customerId === customerId);
  const records = await fetchProfileRows(customerId);
  const sourceOrder = latestOrderWithMeasurements(orders);
  const manuallyEditedRows = records?.length ? manualProfileRows(records) : [];
  const values = manuallyEditedRows.length
    ? buildProfileValues(manuallyEditedRows, sourceOrder)
    : sourceOrder?.measurements ?? (records?.length ? buildProfileValues(records, sourceOrder) : []);

  return {
    customer,
    values,
    sourceOrder,
    sourceOrderId: sourceOrder?.id
  };
}

function measurementRows(customerId: string, values: MeasurementValue[]) {
  return values.map((value) => ({
    customer_id: customerId,
    field_key: value.fieldKey,
    value: value.value.trim() || "NA",
    unit: value.unit || "in",
    source_order_id: null
  }));
}

export async function saveCustomerMeasurementProfile(customerId: string, values: MeasurementValue[]) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Customer measurement edits require the database.");
  }

  const admin = createSupabaseAdminClient();
  const { error: deleteError } = await admin.from("customer_measurement_profiles").delete().eq("customer_id", customerId);
  if (deleteError) throw new Error(deleteError.message);

  if (values.length === 0) return;

  const { error: insertError } = await admin.from("customer_measurement_profiles").insert(measurementRows(customerId, values));
  if (insertError) throw new Error(insertError.message);
}
