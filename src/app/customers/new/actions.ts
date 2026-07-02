"use server";

import { redirect } from "next/navigation";
import { createCustomerRecord } from "@/services/customers/customer-record-service";
import { saveCustomerMeasurementProfile } from "@/services/customers/customer-measurement-service";
import type { MeasurementValue } from "@/types/domain";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseMeasurements(formData: FormData): MeasurementValue[] {
  return [...formData.keys()]
    .filter((key) => key.startsWith("measurement."))
    .map((key, index) => {
      const fieldKey = key.slice("measurement.".length);
      const sortOrder = Number(text(formData, `measurementMeta.${fieldKey}.sortOrder`));
      return {
        id: fieldKey,
        fieldKey,
        displayCode: text(formData, `measurementMeta.${fieldKey}.displayCode`) || fieldKey.toUpperCase(),
        displayLabel: text(formData, `measurementMeta.${fieldKey}.displayLabel`) || fieldKey,
        value: text(formData, key),
        unit: text(formData, `measurementMeta.${fieldKey}.unit`) || "in",
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : index + 1
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createCustomerAction(formData: FormData) {
  const customerId = await createCustomerRecord({
    fullName: text(formData, "fullName"),
    phonePrimary: text(formData, "phonePrimary"),
    phoneSecondary: text(formData, "phoneSecondary"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    notes: text(formData, "notes")
  });

  await saveCustomerMeasurementProfile(customerId, parseMeasurements(formData));
  redirect(`/customers/${customerId}/measurements`);
}
