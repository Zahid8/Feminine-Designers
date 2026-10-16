"use server";

import { revalidatePath } from "next/cache";
import type { SettingsActionState } from "@/services/settings/settings-action-state";
import {
  parseGarmentTypeFormData,
  parseGarmentUpdateFormData,
  parseStoreSettingsFormData,
  parseTailorName,
  parseMeasurementFieldFormData,
  parseMeasurementTemplateFormData,
  parseRemoveSettingFormData
} from "@/services/settings/settings-form-parser";
import {
  createTailor,
  moveGarmentType,
  moveMeasurementField,
  updateGarmentType,
  updateMeasurementField,
  updateStoreSettings,
  updateTailor,
  createGarmentType,
  createMeasurementField,
  createMeasurementTemplate,
  removeGarmentType,
  removeMeasurementField,
  removeMeasurementTemplate
} from "@/services/settings/settings-service";

function success(message: string): SettingsActionState {
  revalidatePath("/settings");
  revalidatePath("/orders/new");
  return { status: "success", message };
}

/** Runs a settings change and reports the outcome for a toast. */
async function run(task: () => Promise<string>): Promise<SettingsActionState> {
  try {
    return success(await task());
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown): SettingsActionState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "Could not save settings."
  };
}

export async function addGarmentTypeAction(_: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  try {
    const input = parseGarmentTypeFormData(formData);
    await createGarmentType(input.name);
    return success(`Added garment type "${input.name}".`);
  } catch (error) {
    return failure(error);
  }
}

export async function addMeasurementTemplateAction(
  _: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    const input = parseMeasurementTemplateFormData(formData);
    await createMeasurementTemplate(input);
    return success(`Added measurement template "${input.name}".`);
  } catch (error) {
    return failure(error);
  }
}

export async function addMeasurementFieldAction(_: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  try {
    const input = parseMeasurementFieldFormData(formData);
    await createMeasurementField(input);
    return success(`Added measurement field "${input.displayCode}".`);
  } catch (error) {
    return failure(error);
  }
}

export async function removeGarmentTypeAction(_: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  try {
    const input = parseRemoveSettingFormData(formData);
    await removeGarmentType(input.id);
    return success("Removed garment type from future orders.");
  } catch (error) {
    return failure(error);
  }
}

export async function removeMeasurementTemplateAction(_: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  try {
    const input = parseRemoveSettingFormData(formData);
    await removeMeasurementTemplate(input.id);
    return success("Removed measurement template from future orders.");
  } catch (error) {
    return failure(error);
  }
}

export async function removeMeasurementFieldAction(_: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  try {
    const input = parseRemoveSettingFormData(formData);
    await removeMeasurementField(input.id);
    return success("Removed measurement field from future orders.");
  } catch (error) {
    return failure(error);
  }
}

export async function updateStoreSettingsAction(_: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  try {
    const input = parseStoreSettingsFormData(formData);
    const { extrasSaved } = await updateStoreSettings(input);
    // Bills, WhatsApp messages, and order pages read these on every request.
    revalidatePath("/", "layout");
    return extrasSaved
      ? success("Settings saved. New orders, bills, and messages use them from now on.")
      : {
          status: "success",
          message:
            "Store details and GST saved. Bill terms and WhatsApp messages need the settings database update (supabase/migrations/202610160001_settings_upgrades.sql) before they can be saved."
        };
  } catch (error) {
    return failure(error);
  }
}

export async function updateGarmentAction(formData: FormData) {
  return run(async () => {
    const input = parseGarmentUpdateFormData(formData);
    await updateGarmentType(input.id, { name: input.name, defaultRateRupees: input.defaultRateRupees });
    return `Saved ${input.name}.`;
  });
}

export async function moveGarmentAction(id: string, direction: "up" | "down") {
  return run(async () => {
    await moveGarmentType(id, direction);
    return "Order updated.";
  });
}

export async function setGarmentActiveAction(id: string, active: boolean) {
  return run(async () => {
    await updateGarmentType(id, { active });
    return active ? "Garment restored for new orders." : "Garment removed from new orders.";
  });
}

export async function addTailorAction(formData: FormData) {
  return run(async () => {
    const name = parseTailorName(formData);
    await createTailor(name);
    revalidatePath("/orders", "layout");
    return `Added ${name}.`;
  });
}

export async function renameTailorAction(id: string, formData: FormData) {
  return run(async () => {
    const name = parseTailorName(formData);
    await updateTailor(id, { name });
    return `Renamed to ${name}. Existing orders keep the name they were saved with.`;
  });
}

export async function setTailorActiveAction(id: string, active: boolean) {
  return run(async () => {
    await updateTailor(id, { active });
    return active ? "Tailor restored." : "Tailor hidden from new orders.";
  });
}

export async function updateMeasurementFieldAction(id: string, formData: FormData) {
  return run(async () => {
    const displayCode = String(formData.get("displayCode") ?? "").trim();
    const displayLabel = String(formData.get("displayLabel") ?? "").trim();
    if (!displayCode || !displayLabel) throw new Error("Code and label are required.");
    await updateMeasurementField(id, { displayCode, displayLabel, longLabel: displayLabel });
    return `Saved ${displayCode}.`;
  });
}

export async function moveMeasurementFieldAction(id: string, direction: "up" | "down") {
  return run(async () => {
    await moveMeasurementField(id, direction);
    return "Order updated.";
  });
}

export async function setMeasurementFieldActiveAction(id: string, active: boolean) {
  return run(async () => {
    await updateMeasurementField(id, { active });
    return active ? "Field restored." : "Field removed from future orders.";
  });
}
