"use client";

import { useActionState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import type { MeasurementTemplate } from "@/types/domain";
import { MeasurementFieldRow, type MeasurementFieldActions } from "@/components/settings/measurement-field-row";
import { initialSettingsActionState, type SettingsActionState } from "@/services/settings/settings-action-state";

function ActionMessage({ state }: { state: SettingsActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
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
  measurementTemplates,
  addMeasurementTemplateAction,
  addMeasurementFieldAction,
  removeMeasurementTemplateAction,
  fieldActions
}: {
  measurementTemplates: MeasurementTemplate[];
  addMeasurementTemplateAction: (state: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
  addMeasurementFieldAction: (state: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
  removeMeasurementTemplateAction: (state: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
  fieldActions: MeasurementFieldActions;
}) {
  const [templateState, templateAction, templatePending] = useActionState(addMeasurementTemplateAction, initialSettingsActionState);
  const [fieldState, fieldAction, fieldPending] = useActionState(addMeasurementFieldAction, initialSettingsActionState);
  const [removeTemplateState, removeTemplateAction, removeTemplatePending] = useActionState(removeMeasurementTemplateAction, initialSettingsActionState);

  return (
    <div className="grid gap-5">
      <Card id="measurements">
        <CardHeader>
          <CardTitle>Measurement Templates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            {measurementTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-line bg-surface p-3 shadow-raised-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-wine-ink">{template.name}</p>
                    <p className="text-xs text-muted">{template.isActive ? "Active" : "Removed"}</p>
                  </div>
                  {template.isActive ? (
                    <form action={removeTemplateAction}>
                      <input type="hidden" name="id" value={template.id} />
                      <Button type="submit" variant="ghost" disabled={removeTemplatePending}>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </form>
                  ) : null}
                </div>
                <p className="text-xs text-muted">{template.garmentCategories.join(", ")}</p>
                <details className="group mt-3">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between rounded-xl bg-surface-sunken px-3 text-sm font-semibold text-wine-ink shadow-pressed [&::-webkit-details-marker]:hidden">
                    <span>{template.fields.filter((field) => field.active).length} active fields</span>
                    <ChevronDown aria-hidden className="h-4 w-4 transition group-open:rotate-180" />
                  </summary>
                  <div className="mt-2 grid max-h-80 gap-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
                  {template.fields.map((field, index) => (
                    <MeasurementFieldRow
                      key={field.id}
                      field={field}
                      isFirst={index === 0}
                      isLast={index === template.fields.length - 1}
                      actions={fieldActions}
                    />
                  ))}
                  </div>
                </details>
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
          <ActionMessage state={removeTemplateState} />
          
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Measurement Field</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={fieldAction} className="grid gap-3 md:grid-cols-3">
            <Field label="Template">
              <select name="templateId" className="h-11 w-full rounded-xl border border-transparent bg-surface-sunken px-3 text-sm text-ink shadow-pressed outline-none transition focus:border-gold focus:bg-surface-strong focus:ring-2 focus:ring-gold/30">
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
              <select name="inputType" className="h-11 w-full rounded-xl border border-transparent bg-surface-sunken px-3 text-sm text-ink shadow-pressed outline-none transition focus:border-gold focus:bg-surface-strong focus:ring-2 focus:ring-gold/30">
                <option value="number">Number</option>
                <option value="text">Text</option>
                <option value="textarea">Multi-line note</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </Field>
            <Field label="Unit">
              <select name="unit" className="h-11 w-full rounded-xl border border-transparent bg-surface-sunken px-3 text-sm text-ink shadow-pressed outline-none transition focus:border-gold focus:bg-surface-strong focus:ring-2 focus:ring-gold/30">
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
