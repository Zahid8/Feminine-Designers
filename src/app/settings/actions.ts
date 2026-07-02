"use server";

import { revalidatePath } from "next/cache";
import type { SettingsActionState } from "@/services/settings/settings-action-state";
import {
  parseGarmentTypeFormData,
  parseMeasurementFieldFormData,
  parseMeasurementTemplateFormData,
  parseRemoveSettingFormData
} from "@/services/settings/settings-form-parser";
import {
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
