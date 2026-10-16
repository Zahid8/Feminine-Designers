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

const removeSettingSchema = z.object({
  id: z.string().min(1, "Choose an item to remove.")
});

export type GarmentTypeSettingsInput = z.infer<typeof garmentTypeSchema>;
export type MeasurementTemplateSettingsInput = z.infer<typeof measurementTemplateSchema>;
export type MeasurementFieldSettingsInput = z.infer<typeof measurementFieldSchema>;
export type RemoveSettingInput = z.infer<typeof removeSettingSchema>;

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

export function parseRemoveSettingFormData(formData: FormData): RemoveSettingInput {
  return removeSettingSchema.parse({
    id: readString(formData, "id")
  });
}

const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .refine((value) => value === "" || /^(\+?91)?\d{10}$/.test(value), "Enter a 10-digit phone number.");

const gstRate = z.coerce.number().min(0, "GST can't be negative.").max(28, "GST rate looks too high (max 28%).");

const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2, "Store name is required."),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => /^[0-9A-Z]{15}$/.test(value), "GSTIN must be 15 letters/digits."),
  phonePrimary: phone.refine((value) => value !== "", "Primary phone is required."),
  phoneSecondary: phone,
  email: z.string().trim().refine((value) => value === "" || /^\S+@\S+\.\S+$/.test(value), "Enter a valid email or leave it empty."),
  addressLines: z.array(z.string().trim().min(1)).min(1, "Address is required."),
  defaultCgstRate: gstRate,
  defaultSgstRate: gstRate,
  termsAndConditions: z.string().trim().max(1000),
  customerTerms: z.array(z.string().trim().min(1)).max(10, "Keep the bill terms to 10 paragraphs or fewer."),
  messageTemplates: z.object({
    orderConfirmation: z.string().trim().min(1, "Order confirmation message can't be empty.").max(1000),
    readyForPickup: z.string().trim().min(1, "Ready-for-pickup message can't be empty.").max(1000),
    balanceReminder: z.string().trim().min(1, "Balance reminder message can't be empty.").max(1000)
  })
});

const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export type StoreSettingsFormInput = z.infer<typeof storeSettingsSchema>;

export function parseStoreSettingsFormData(formData: FormData): StoreSettingsFormInput {
  const result = storeSettingsSchema.safeParse({
    storeName: readString(formData, "storeName"),
    gstin: readString(formData, "gstin"),
    phonePrimary: readString(formData, "phonePrimary"),
    phoneSecondary: readString(formData, "phoneSecondary"),
    email: readString(formData, "email"),
    addressLines: lines(readString(formData, "address")),
    defaultCgstRate: readString(formData, "defaultCgstRate"),
    defaultSgstRate: readString(formData, "defaultSgstRate"),
    termsAndConditions: readString(formData, "termsAndConditions"),
    customerTerms: lines(readString(formData, "customerTerms")),
    messageTemplates: {
      orderConfirmation: readString(formData, "template.orderConfirmation"),
      readyForPickup: readString(formData, "template.readyForPickup"),
      balanceReminder: readString(formData, "template.balanceReminder")
    }
  });
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? "Check the settings and try again.");
  return result.data;
}

const garmentUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Garment name is required."),
  defaultRateRupees: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .refine((value) => value === null || (Number.isFinite(value) && value >= 0), "Enter a price of 0 or more, or leave it empty.")
});

export function parseGarmentUpdateFormData(formData: FormData) {
  const result = garmentUpdateSchema.safeParse({
    id: readString(formData, "id"),
    name: readString(formData, "name"),
    defaultRateRupees: readString(formData, "defaultRate")
  });
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? "Check the garment and try again.");
  return result.data;
}

export function parseTailorName(formData: FormData) {
  const name = readString(formData, "name").replace(/\s+/g, " ");
  if (name.length < 2) throw new Error("Tailor name is required.");
  return name;
}
