"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateCustomerContact } from "@/services/customers/customer-record-service";
import { getCustomerMeasurementProfile, saveCustomerMeasurementProfile } from "@/services/customers/customer-measurement-service";
import { measurementsChanged } from "@/lib/customers/measurements-changed";
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
  await updateCustomerContact(customerId, { phonePrimary: formValue(formData, "phonePrimary") });
  await saveCustomerMeasurementProfile(customerId, parseMeasurements(formData));
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers/${customerId}/measurements`);
  redirect(`/customers/${customerId}/measurements`);
}

const phonePattern = /^(\+?91[-\s]?)?[6-9]\d{9}$/;

/** Saves the customer's details and measurements together from the Edit Customer page. */
export async function updateCustomerAction(customerId: string, _: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const fullName = formValue(formData, "fullName").trim();
  const phonePrimary = formValue(formData, "phonePrimary").trim();
  const phoneSecondary = formValue(formData, "phoneSecondary").trim();
  const email = formValue(formData, "email").trim();

  if (fullName.length < 2) return { error: "Customer name is required." };
  if (!phonePattern.test(phonePrimary)) return { error: "Enter a valid 10-digit mobile number." };
  if (phoneSecondary && !phonePattern.test(phoneSecondary)) return { error: "The second phone number isn't valid." };
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email or leave it empty." };

  try {
    await updateCustomerContact(customerId, {
      fullName,
      phonePrimary,
      phoneSecondary,
      email,
      address: formValue(formData, "address"),
      notes: formValue(formData, "notes")
    });
    // Saving measurements marks them as manually set, which then take priority over newer
    // orders' measurements, so only do it when one was actually changed.
    const submitted = parseMeasurements(formData);
    if (measurementsChanged(submitted, await getCustomerMeasurementProfile(customerId))) {
      await saveCustomerMeasurementProfile(customerId, submitted);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save the customer." };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers/${customerId}/measurements`);
  revalidatePath(`/orders/new`);
  redirect(`/customers/${customerId}?saved=1`);
}
