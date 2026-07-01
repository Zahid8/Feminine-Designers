import { GARMENT_TYPES, STORE_SETTINGS } from "@/lib/constants/business";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import type { GarmentType } from "@/types/domain";

interface GarmentTypeRow {
  id: string;
  name: string;
  active: boolean;
}

export async function getStoreSettings() {
  return STORE_SETTINGS;
}

export async function listGarmentTypes(): Promise<GarmentType[]> {
  if (!hasSupabaseAdminEnv()) return GARMENT_TYPES;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("garment_types").select("id,name,active").order("sort_order");
  if (error) {
    if (isMissingSupabaseSchemaError(error)) return GARMENT_TYPES;
    throw new Error(error.message);
  }

  return (data as GarmentTypeRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    active: row.active
  }));
}

export async function createGarmentType(name: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Add env variables and apply migrations before saving settings.");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("garment_types").insert({ name, active: true });
  if (error) {
    throw new Error(error.message);
  }
}

export async function createMeasurementTemplate(input: {
  name: string;
  garmentCategories: string[];
  description?: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Add env variables and apply migrations before saving settings.");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("measurement_templates").insert({
    name: input.name,
    garment_category: input.garmentCategories.join(","),
    description: input.description ?? null,
    is_active: true
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function createMeasurementField(input: {
  templateId: string;
  fieldKey: string;
  displayCode: string;
  displayLabel: string;
  longLabel?: string;
  inputType: string;
  unit: string;
  isRequired: boolean;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Add env variables and apply migrations before saving settings.");
  }

  const admin = createSupabaseAdminClient();
  const { count, error: countError } = await admin
    .from("measurement_template_fields")
    .select("id", { count: "exact", head: true })
    .eq("template_id", input.templateId);
  if (countError) {
    throw new Error(countError.message);
  }

  const { error } = await admin.from("measurement_template_fields").insert({
    template_id: input.templateId,
    field_key: input.fieldKey,
    display_code: input.displayCode,
    display_label: input.displayLabel,
    long_label: input.longLabel ?? null,
    input_type: input.inputType,
    unit: input.unit,
    is_required: input.isRequired,
    sort_order: (count ?? 0) + 1
  });
  if (error) {
    throw new Error(error.message);
  }
}
