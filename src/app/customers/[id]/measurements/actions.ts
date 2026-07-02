"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveCustomerMeasurementProfile } from "@/services/customers/customer-measurement-service";
import type { MeasurementValue } from "@/types/domain";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseMeasurements(formData: FormData): MeasurementValue[] {
  return [...formData.keys()]
    .filter((key) => key.startsWith("measurement."))
    .map((key, index) => {
      const fieldKey = key.slice("measurement.".length);
      const sortOrder = Number(formValue(formData, `measurementMeta.${fieldKey}.sortOrder`));
      return {
        id: fieldKey,
        fieldKey,
        displayCode: formValue(formData, `measurementMeta.${fieldKey}.displayCode`) || fieldKey.toUpperCase(),
        displayLabel: formValue(formData, `measurementMeta.${fieldKey}.displayLabel`) || fieldKey,
        value: formValue(formData, key).trim(),
        unit: formValue(formData, `measurementMeta.${fieldKey}.unit`) || "in",
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : index + 1
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function updateCustomerMeasurementsAction(customerId: string, formData: FormData) {
  const sourceOrderId = formValue(formData, "sourceOrderId") || undefined;
  await saveCustomerMeasurementProfile(customerId, parseMeasurements(formData), sourceOrderId);
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers/${customerId}/measurements`);
  redirect(`/customers/${customerId}/measurements`);
}
