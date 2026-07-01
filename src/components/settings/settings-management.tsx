"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import type { GarmentType, MeasurementTemplate } from "@/types/domain";
import { initialSettingsActionState, type SettingsActionState } from "@/services/settings/settings-action-state";

function ActionMessage({ state }: { state: SettingsActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={`rounded-md border px-3 py-2 text-sm font-semibold ${
        state.status === "success"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
      role="status"
    >
      {state.message}
    </p>
  );
}

export function SettingsManagement({
  garmentTypes,
  measurementTemplates,
  addGarmentTypeAction,
  addMeasurementTemplateAction,
  addMeasurementFieldAction
}: {
  garmentTypes: GarmentType[];
  measurementTemplates: MeasurementTemplate[];
  addGarmentTypeAction: (state: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
  addMeasurementTemplateAction: (state: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
  addMeasurementFieldAction: (state: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
}) {
  const [garmentState, garmentAction, garmentPending] = useActionState(addGarmentTypeAction, initialSettingsActionState);
  const [templateState, templateAction, templatePending] = useActionState(addMeasurementTemplateAction, initialSettingsActionState);
  const [fieldState, fieldAction, fieldPending] = useActionState(addMeasurementFieldAction, initialSettingsActionState);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Garment Types</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {garmentTypes.map((type) => (
              <span key={type.id} className="rounded-full border border-[#d8c7b4] bg-white px-3 py-1 text-sm font-semibold">
                {type.name}
              </span>
            ))}
          </div>
          <form action={garmentAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Field label="Add garment type">
              <Input name="name" placeholder="Example: Sharara" />
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={garmentPending}>
                <Plus className="h-4 w-4" />
                {garmentPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
          <ActionMessage state={garmentState} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Measurement Templates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            {measurementTemplates.map((template) => (
              <div key={template.id} className="rounded-md border border-[#eadfce] p-3">
                <p className="font-semibold text-[#4c1525]">{template.name}</p>
                <p className="text-xs text-[#7c6d66]">{template.garmentCategories.join(", ")}</p>
                <p className="mt-2 text-sm text-[#7c6d66]">{template.fields.map((field) => field.displayCode).join(", ")}</p>
              </div>
            ))}
          </div>
          <form action={templateAction} className="grid gap-3 md:grid-cols-2">
            <Field label="Template name">
              <Input name="name" placeholder="Example: Sharara measurements" />
            </Field>
            <Field label="Garment categories" hint="Comma separated, for example: Sharara, Suit">
              <Input name="garmentCategories" placeholder="Sharara, Suit" />
            </Field>
            <label className="grid gap-1 text-sm font-medium md:col-span-2">
              <span>Description</span>
              <Textarea name="description" placeholder="Optional internal description" />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" disabled={templatePending}>
                <Plus className="h-4 w-4" />
                {templatePending ? "Adding..." : "Add Template"}
              </Button>
            </div>
          </form>
          <ActionMessage state={templateState} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Measurement Field</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={fieldAction} className="grid gap-3 md:grid-cols-3">
            <Field label="Template">
              <select name="templateId" className="h-10 rounded-md border border-[#d8c7b4] bg-white px-3 text-sm">
                {measurementTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Field key" hint="Stable database key, e.g. ankle_round">
              <Input name="fieldKey" placeholder="ankle_round" />
            </Field>
            <Field label="Display code">
              <Input name="displayCode" placeholder="AR" />
            </Field>
            <Field label="Display label">
              <Input name="displayLabel" placeholder="AR" />
            </Field>
            <Field label="Long label">
              <Input name="longLabel" placeholder="Ankle Round" />
            </Field>
            <Field label="Input type">
              <select name="inputType" className="h-10 rounded-md border border-[#d8c7b4] bg-white px-3 text-sm">
                <option value="number">Number</option>
                <option value="text">Text</option>
                <option value="textarea">Multi-line note</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </Field>
            <Field label="Unit">
              <select name="unit" className="h-10 rounded-md border border-[#d8c7b4] bg-white px-3 text-sm">
                <option value="in">Inches</option>
                <option value="text">Text</option>
                <option value="boolean">Boolean</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 pt-7 text-sm font-semibold">
              <input name="isRequired" type="checkbox" className="h-4 w-4" />
              Required field
            </label>
            <div className="flex items-end">
              <Button type="submit" disabled={fieldPending}>
                <Plus className="h-4 w-4" />
                {fieldPending ? "Adding..." : "Add Field"}
              </Button>
            </div>
          </form>
          <ActionMessage state={fieldState} />
        </CardContent>
      </Card>
    </div>
  );
}
