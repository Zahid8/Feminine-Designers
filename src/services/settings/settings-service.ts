import { GARMENT_TYPES, STORE_SETTINGS } from "@/lib/constants/business";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import { cache } from "react";
import { rupeesToPaise } from "@/lib/utils/money";
import type { GarmentType, MessageTemplates, StoreSettings, Tailor } from "@/types/domain";

const NEEDS_MIGRATION =
  "This needs the settings database update. Run supabase/migrations/202610160001_settings_upgrades.sql in the Supabase SQL editor, then try again.";

function requireDatabase() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Add env variables and apply migrations before saving settings.");
  }
  return createSupabaseAdminClient();
}

function throwSettingsError(error: { code?: string; message?: string }): never {
  if (isMissingSupabaseSchemaError(error)) throw new Error(NEEDS_MIGRATION);
  throw new Error(error.message ?? "Could not save settings.");
}

interface StoreSettingsRow {
  id: string;
  store_name: string;
  brand_subtitle: string;
  gstin: string;
  phone_primary: string;
  phone_secondary: string | null;
  email: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string | null;
  postal_code: string | null;
  default_cgst_rate: number | string;
  default_sgst_rate: number | string;
  receipt_prefix: string;
  terms_and_conditions: string | null;
  customer_terms?: string | null;
  message_templates?: Partial<MessageTemplates> | null;
}

/** Address lines: saved as one multi-line address_line_1; older rows are spread over several columns. */
function addressLinesFrom(row: StoreSettingsRow) {
  if (row.address_line_1.includes("\n")) return row.address_line_1.split("\n").map((line) => line.trim()).filter(Boolean);
  const cityLine = [row.city, row.postal_code].filter(Boolean).join("-");
  return [row.address_line_1, row.address_line_2, cityLine].filter((line): line is string => Boolean(line && line.trim()));
}

function splitParagraphs(text: string | null | undefined) {
  return (text ?? "")
    .split(/\n\s*\n|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function mapStoreSettings(row: StoreSettingsRow): StoreSettings {
  const customerTerms = splitParagraphs(row.customer_terms);
  return {
    ...STORE_SETTINGS,
    id: row.id,
    storeName: row.store_name,
    brandSubtitle: row.brand_subtitle,
    gstin: row.gstin,
    phonePrimary: row.phone_primary,
    phoneSecondary: row.phone_secondary ?? "",
    email: row.email ?? "",
    addressLines: addressLinesFrom(row),
    defaultCgstRate: Number(row.default_cgst_rate),
    defaultSgstRate: Number(row.default_sgst_rate),
    receiptPrefix: row.receipt_prefix,
    termsAndConditions: row.terms_and_conditions || STORE_SETTINGS.termsAndConditions,
    customerTerms: customerTerms.length ? customerTerms : STORE_SETTINGS.customerTerms,
    messageTemplates: { ...STORE_SETTINGS.messageTemplates, ...(row.message_templates ?? {}) }
  };
}

/** Store profile from the database (one row), falling back to the built-in defaults. Deduped per request. */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  if (!hasSupabaseAdminEnv()) return STORE_SETTINGS;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("store_settings").select("*").order("created_at").limit(1).maybeSingle();
  if (error) {
    if (isMissingSupabaseSchemaError(error)) return STORE_SETTINGS;
    throw new Error(error.message);
  }
  return data ? mapStoreSettings(data as StoreSettingsRow) : STORE_SETTINGS;
});

export interface StoreSettingsInput {
  storeName: string;
  gstin: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  addressLines: string[];
  defaultCgstRate: number;
  defaultSgstRate: number;
  termsAndConditions: string;
  customerTerms: string[];
  messageTemplates: MessageTemplates;
}

/**
 * Saves the store profile. Core fields use columns that already exist; bill terms and
 * WhatsApp templates need the settings migration, so they are saved separately and the
 * result says whether they were stored.
 */
export async function updateStoreSettings(input: StoreSettingsInput): Promise<{ extrasSaved: boolean }> {
  const admin = requireDatabase();
  const current = await admin.from("store_settings").select("id").order("created_at").limit(1).maybeSingle();
  if (current.error) throwSettingsError(current.error);
  const now = new Date().toISOString();
  const core = {
    store_name: input.storeName,
    brand_subtitle: STORE_SETTINGS.brandSubtitle,
    gstin: input.gstin,
    phone_primary: input.phonePrimary,
    phone_secondary: input.phoneSecondary || null,
    email: input.email || null,
    address_line_1: input.addressLines.join("\n"),
    address_line_2: null,
    city: null,
    postal_code: null,
    default_cgst_rate: input.defaultCgstRate,
    default_sgst_rate: input.defaultSgstRate,
    terms_and_conditions: input.termsAndConditions,
    updated_at: now
  };
  const id = (current.data as { id: string } | null)?.id;
  const saved = id
    ? await admin.from("store_settings").update(core).eq("id", id).select("id").single()
    : await admin.from("store_settings").insert(core).select("id").single();
  if (saved.error) throwSettingsError(saved.error);
  const rowId = (saved.data as { id: string }).id;

  const extras = await admin
    .from("store_settings")
    .update({ customer_terms: input.customerTerms.join("\n"), message_templates: input.messageTemplates })
    .eq("id", rowId);
  if (extras.error) {
    if (isMissingSupabaseSchemaError(extras.error)) return { extrasSaved: false };
    throw new Error(extras.error.message);
  }
  return { extrasSaved: true };
}

interface GarmentTypeRow {
  id: string;
  name: string;
  active: boolean;
  sort_order?: number;
  default_rate?: number | string | null;
}

export async function listGarmentTypes(): Promise<GarmentType[]> {
  if (!hasSupabaseAdminEnv()) return GARMENT_TYPES;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("garment_types").select("*").order("sort_order").order("name");
  if (error) {
    if (isMissingSupabaseSchemaError(error)) return GARMENT_TYPES;
    throw new Error(error.message);
  }

  return (data as GarmentTypeRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    active: row.active,
    sortOrder: row.sort_order,
    defaultRatePaise: row.default_rate === null || row.default_rate === undefined ? undefined : rupeesToPaise(Number(row.default_rate))
  }));
}

export async function updateGarmentType(id: string, input: { name?: string; defaultRateRupees?: number | null; active?: boolean }) {
  const admin = requireDatabase();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.active !== undefined) patch.active = input.active;
  if (input.defaultRateRupees !== undefined) patch.default_rate = input.defaultRateRupees;
  const { error } = await admin.from("garment_types").update(patch).eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("Another garment type already has that name.");
    throwSettingsError(error);
  }
}

/** Swaps sort order with the neighbour above or below so popular garments can be listed first. */
export async function moveGarmentType(id: string, direction: "up" | "down") {
  const admin = requireDatabase();
  const { data, error } = await admin.from("garment_types").select("id,sort_order,name").order("sort_order").order("name");
  if (error) throwSettingsError(error);
  const rows = (data as { id: string }[]).map((row, index) => ({ id: row.id, sort_order: index + 1 }));
  const index = rows.findIndex((row) => row.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return;
  [rows[index], rows[target]] = [rows[target], rows[index]];
  for (const [position, row] of rows.entries()) {
    const result = await admin.from("garment_types").update({ sort_order: position + 1 }).eq("id", row.id);
    if (result.error) throwSettingsError(result.error);
  }
}

interface TailorRow {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
}

/** Managed tailor names; empty until the settings migration has been run. */
export async function listTailors(): Promise<Tailor[]> {
  if (!hasSupabaseAdminEnv()) return [];
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("tailors").select("*").order("sort_order").order("name");
  if (error) {
    if (isMissingSupabaseSchemaError(error)) return [];
    throw new Error(error.message);
  }
  return (data as TailorRow[]).map((row) => ({ id: row.id, name: row.name, active: row.active, sortOrder: row.sort_order }));
}

export async function createTailor(name: string) {
  const admin = requireDatabase();
  const { count } = await admin.from("tailors").select("id", { count: "exact", head: true });
  const { error } = await admin.from("tailors").insert({ name, active: true, sort_order: (count ?? 0) + 1 });
  if (error) {
    if (error.code === "23505") throw new Error("A tailor with that name already exists.");
    throwSettingsError(error);
  }
}

export async function updateTailor(id: string, input: { name?: string; active?: boolean }) {
  const admin = requireDatabase();
  const { error } = await admin
    .from("tailors")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("A tailor with that name already exists.");
    throwSettingsError(error);
  }
}

export async function createGarmentType(name: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Add env variables and apply migrations before saving settings.");
  }

  const admin = createSupabaseAdminClient();
  const { count } = await admin.from("garment_types").select("id", { count: "exact", head: true });
  const { error } = await admin.from("garment_types").insert({ name, active: true, sort_order: (count ?? 0) + 1 });
  if (error) {
    throw new Error(error.message);
  }
}

export async function removeGarmentType(id: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Add env variables and apply migrations before saving settings.");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("garment_types").update({ active: false }).eq("id", id);
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

export async function removeMeasurementTemplate(id: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Add env variables and apply migrations before saving settings.");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("measurement_templates").update({ is_active: false }).eq("id", id);
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

export async function removeMeasurementField(id: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase is not configured. Add env variables and apply migrations before saving settings.");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("measurement_template_fields").update({ active: false }).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

/** Edits a measurement field's labels or restores a removed field. */
export async function updateMeasurementField(id: string, input: { displayCode?: string; displayLabel?: string; longLabel?: string; active?: boolean }) {
  const admin = requireDatabase();
  const patch: Record<string, unknown> = {};
  if (input.displayCode !== undefined) patch.display_code = input.displayCode;
  if (input.displayLabel !== undefined) patch.display_label = input.displayLabel;
  if (input.longLabel !== undefined) patch.long_label = input.longLabel || null;
  if (input.active !== undefined) patch.active = input.active;
  const { error } = await admin.from("measurement_template_fields").update(patch).eq("id", id);
  if (error) throwSettingsError(error);
}

/** Moves a measurement field one place up or down within its template. */
export async function moveMeasurementField(id: string, direction: "up" | "down") {
  const admin = requireDatabase();
  const field = await admin.from("measurement_template_fields").select("template_id").eq("id", id).single();
  if (field.error) throwSettingsError(field.error);
  const { data, error } = await admin
    .from("measurement_template_fields")
    .select("id,sort_order")
    .eq("template_id", (field.data as { template_id: string }).template_id)
    .order("sort_order");
  if (error) throwSettingsError(error);
  const rows = (data as { id: string }[]).map((row) => row.id);
  const index = rows.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return;
  [rows[index], rows[target]] = [rows[target], rows[index]];
  for (const [position, rowId] of rows.entries()) {
    const result = await admin.from("measurement_template_fields").update({ sort_order: position + 1 }).eq("id", rowId);
    if (result.error) throwSettingsError(result.error);
  }
}
