import { MEASUREMENT_TEMPLATES } from "@/lib/constants/business";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import type { MeasurementInputType, MeasurementTemplate, MeasurementTemplateField } from "@/types/domain";

interface TemplateRow {
  id: string;
  name: string;
  garment_category: string;
  is_active: boolean;
  description: string | null;
  fields: FieldRow[];
}

interface FieldRow {
  id: string;
  field_key: string;
  display_code: string;
  display_label: string;
  long_label: string | null;
  input_type: MeasurementInputType;
  unit: "in" | "text" | "boolean";
  is_required: boolean;
  sort_order: number;
}

function mapTemplate(row: TemplateRow): MeasurementTemplate {
  return {
    id: row.id,
    name: row.name,
    garmentCategories: row.garment_category
      .split(",")
      .map((category) => category.trim())
      .filter(Boolean),
    description: row.description ?? undefined,
    isActive: row.is_active,
    fields: row.fields
      .sort((a, b) => a.sort_order - b.sort_order)
      .map<MeasurementTemplateField>((field) => ({
        id: field.id,
        fieldKey: field.field_key,
        displayCode: field.display_code,
        displayLabel: field.display_label,
        longLabel: field.long_label ?? undefined,
        inputType: field.input_type,
        unit: field.unit,
        isRequired: field.is_required,
        sortOrder: field.sort_order,
        active: true
      }))
  };
}

function codeTemplateFor(template: MeasurementTemplate) {
  return (
    MEASUREMENT_TEMPLATES.find((codeTemplate) => codeTemplate.name === template.name) ??
    MEASUREMENT_TEMPLATES.find((codeTemplate) =>
      codeTemplate.garmentCategories.some((category) => template.garmentCategories.includes(category))
    )
  );
}

function mergeCodeDefinedFields(template: MeasurementTemplate): MeasurementTemplate {
  const codeTemplate = codeTemplateFor(template);
  if (!codeTemplate) return template;

  const codeFieldKeys = new Set(codeTemplate.fields.map((field) => field.fieldKey));
  const extraDatabaseFields = template.fields.filter((field) => !codeFieldKeys.has(field.fieldKey));

  return {
    ...template,
    fields: [
      ...codeTemplate.fields.map((field) => ({
        ...field,
        id: `${template.id}-${field.fieldKey}`
      })),
      ...extraDatabaseFields.map((field, index) => ({
        ...field,
        sortOrder: codeTemplate.fields.length + index + 1
      }))
    ]
  };
}

export async function listMeasurementTemplates() {
  if (!hasSupabaseAdminEnv()) return MEASUREMENT_TEMPLATES;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("measurement_templates")
    .select("*, fields:measurement_template_fields(*)")
    .order("name", { ascending: true });

  if (error) {
    if (isMissingSupabaseSchemaError(error)) return MEASUREMENT_TEMPLATES;
    throw new Error(error.message);
  }

  return (data as unknown as TemplateRow[]).map(mapTemplate).map(mergeCodeDefinedFields);
}

export async function getMeasurementTemplateForGarment(garmentType: string) {
  const templates = await listMeasurementTemplates();
  return (
    templates.find((template) => template.garmentCategories.includes(garmentType)) ??
    templates.find((template) => template.id === "tmpl-general")
  );
}
