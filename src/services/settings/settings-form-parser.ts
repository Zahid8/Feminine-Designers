import { z } from "zod";
import type { MeasurementInputType } from "@/types/domain";

function readString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeFieldKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const garmentTypeSchema = z.object({
  name: z.string().trim().min(2, "Garment type name is required.")
});

const measurementTemplateSchema = z.object({
  name: z.string().trim().min(2, "Template name is required."),
  garmentCategories: z.array(z.string().trim().min(1)).min(1, "Add at least one garment category."),
  description: z.string().optional()
});

const measurementFieldSchema = z.object({
  templateId: z.string().min(1, "Choose a template."),
  fieldKey: z.string().min(1, "Field key is required."),
  displayCode: z.string().trim().min(1, "Display code is required."),
  displayLabel: z.string().trim().min(1, "Display label is required."),
  longLabel: z.string().optional(),
  inputType: z.enum(["number", "text", "checkbox", "textarea"]),
  unit: z.enum(["in", "text", "boolean"]),
  isRequired: z.boolean()
});

export type GarmentTypeSettingsInput = z.infer<typeof garmentTypeSchema>;
export type MeasurementTemplateSettingsInput = z.infer<typeof measurementTemplateSchema>;
export type MeasurementFieldSettingsInput = z.infer<typeof measurementFieldSchema>;

export function parseGarmentTypeFormData(formData: FormData): GarmentTypeSettingsInput {
  return garmentTypeSchema.parse({
    name: readString(formData, "name")
  });
}

export function parseMeasurementTemplateFormData(formData: FormData): MeasurementTemplateSettingsInput {
  return measurementTemplateSchema.parse({
    name: readString(formData, "name"),
    garmentCategories: readString(formData, "garmentCategories")
      .split(",")
      .map((category) => category.trim())
      .filter(Boolean),
    description: readString(formData, "description") || undefined
  });
}

export function parseMeasurementFieldFormData(formData: FormData): MeasurementFieldSettingsInput {
  const inputType = readString(formData, "inputType", "number") as MeasurementInputType;
  const unit = readString(formData, "unit", inputType === "checkbox" ? "boolean" : inputType === "number" ? "in" : "text");
  return measurementFieldSchema.parse({
    templateId: readString(formData, "templateId"),
    fieldKey: normalizeFieldKey(readString(formData, "fieldKey") || readString(formData, "longLabel")),
    displayCode: readString(formData, "displayCode").toUpperCase(),
    displayLabel: readString(formData, "displayLabel") || readString(formData, "displayCode").toUpperCase(),
    longLabel: readString(formData, "longLabel") || undefined,
    inputType,
    unit,
    isRequired: formData.get("isRequired") === "on"
  });
}
