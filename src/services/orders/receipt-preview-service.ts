import { getStoreSettings } from "@/services/settings/settings-service";
import { formatReceiptNumber } from "@/lib/calculations/receipt-number";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import { normalizeDateInput, todayISO } from "@/lib/utils/date";

export async function getNextReceiptPreview(orderDate = todayISO()) {
  const normalizedOrderDate = normalizeDateInput(orderDate);
  const year = Number(normalizedOrderDate.slice(0, 4));
  if (!Number.isFinite(year)) return undefined;
  const { receiptPrefix } = await getStoreSettings();

  if (!hasSupabaseAdminEnv()) {
    return formatReceiptNumber({ prefix: receiptPrefix, year, sequence: 1 });
  }

  const admin = createSupabaseAdminClient();
  const sequenceKey = `${receiptPrefix}-${year}`;
  const { data, error } = await admin
    .from("receipt_sequence")
    .select("current_value")
    .eq("sequence_key", sequenceKey)
    .maybeSingle();

  if (error) {
    if (isMissingSupabaseSchemaError(error)) return undefined;
    throw new Error(error.message);
  }

  const currentValue = typeof data?.current_value === "number" ? data.current_value : 0;
  return formatReceiptNumber({ prefix: receiptPrefix, year, sequence: currentValue + 1 });
}
