import type { MeasurementTemplate, MeasurementValue } from "@/types/domain";
import { Input, Textarea } from "@/components/ui/input";
import { shouldBreakAfterMeasurement } from "@/lib/utils/measurement-sections";

export function MeasurementGrid({
  template,
  values,
  defaultValues,
  controlledValues,
  onValueChange,
  editable = false,
  valuePrefix = "measurement",
  metaPrefix = "measurementMeta"
}: {
  template?: MeasurementTemplate;
  values?: MeasurementValue[];
  defaultValues?: MeasurementValue[];
  controlledValues?: Record<string, string>;
  onValueChange?: (fieldKey: string, value: string) => void;
  editable?: boolean;
  valuePrefix?: string;
  metaPrefix?: string;
}) {
  const fields = template ? template.fields.filter((field) => field.active) : values ?? [];
  const defaultValueByField = new Map(defaultValues?.map((value) => [value.fieldKey, value.value]));
  if (!editable) return <ReadOnlyMeasurementGrid fields={fields} defaultValueByField={defaultValueByField} />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => {
        const rawValue = "value" in field ? field.value : defaultValueByField.get(field.fieldKey) ?? "";
        const value = rawValue === "NA" ? "" : rawValue;
        const controlledValue = controlledValues?.[field.fieldKey];
        return (
          <div key={field.id} className="contents">
            <label className="grid gap-1 rounded-xl border border-line bg-surface p-3 text-sm shadow-raised-sm">
              <span className="flex items-center justify-between gap-2">
                <strong className="rounded bg-peach px-2 py-0.5 text-wine-ink">{field.displayCode}</strong>
                <span className="text-xs text-muted">
                  {"longLabel" in field && field.longLabel ? field.longLabel : field.displayLabel}
                </span>
              </span>
              {editable ? (
                <>
                  <input type="hidden" name={`${metaPrefix}.${field.fieldKey}.displayCode`} value={field.displayCode} />
                  <input type="hidden" name={`${metaPrefix}.${field.fieldKey}.displayLabel`} value={field.displayLabel} />
                  <input type="hidden" name={`${metaPrefix}.${field.fieldKey}.unit`} value={field.unit} />
                  <input type="hidden" name={`${metaPrefix}.${field.fieldKey}.sortOrder`} value={field.sortOrder} />
                </>
              ) : null}
              {editable ? (
                controlledValues ? (
                  <Input
                    name={`${valuePrefix}.${field.fieldKey}`}
                    value={controlledValue ?? ""}
                    onChange={(event) => onValueChange?.(field.fieldKey, event.target.value)}
                    inputMode="decimal"
                  />
                ) : (
                  <Input name={`${valuePrefix}.${field.fieldKey}`} defaultValue={value} inputMode="decimal" />
                )
              ) : (
                <span>{value || "-"}</span>
              )}
            </label>
            {shouldBreakAfterMeasurement(field) ? (
              <div
                className="h-px bg-gradient-to-r from-transparent via-gold to-transparent sm:col-span-2 xl:col-span-3"
                data-testid="measurement-section-break"
                aria-hidden="true"
              />
            ) : null}
          </div>
        );
      })}
      {editable ? (
        <label className="grid gap-1 rounded-xl border border-line bg-surface p-3 text-sm shadow-raised-sm sm:col-span-2 xl:col-span-3">
          <span className="font-semibold text-wine-ink">Special Notes</span>
          <Textarea name={`${valuePrefix}Notes`} placeholder="Fitting notes" />
        </label>
      ) : null}
    </div>
  );
}

type GridField = NonNullable<Parameters<typeof MeasurementGrid>[0]["values"]>[number] | MeasurementTemplate["fields"][number];

function fieldLabel(field: GridField) {
  const label = "longLabel" in field && field.longLabel ? field.longLabel : field.displayLabel;
  return label && label.trim().toLowerCase() !== field.displayCode.trim().toLowerCase() ? label : undefined;
}

function ReadOnlyMeasurementGrid({ fields, defaultValueByField }: { fields: GridField[]; defaultValueByField: Map<string, string> }) {
  const valueOf = (field: GridField) => {
    const raw = "value" in field ? field.value : defaultValueByField.get(field.fieldKey) ?? "";
    return raw === "NA" ? "" : raw.trim();
  };
  const recorded = fields.filter((field) => valueOf(field)).length;

  if (fields.length === 0) {
    return <p className="rounded-xl bg-surface-sunken p-4 text-sm text-muted shadow-pressed">No measurements recorded yet.</p>;
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {recorded} of {fields.length} recorded
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
        {fields.map((field) => {
          const value = valueOf(field);
          const label = fieldLabel(field);
          return (
            <div key={field.id} className="contents">
              <div
                className={
                  value
                    ? "rounded-xl border border-white/70 bg-surface px-3 py-2 shadow-raised-sm"
                    : "rounded-xl bg-surface-sunken px-3 py-2 opacity-60 shadow-pressed"
                }
                title={label ?? field.displayCode}
              >
                <p className="flex items-baseline justify-between gap-1">
                  <span className="text-xs font-bold text-wine">{field.displayCode}</span>
                  {label ? <span className="truncate text-[10px] text-muted">{label}</span> : null}
                </p>
                <p className={value ? "text-lg font-bold tabular-nums text-wine-ink" : "text-lg text-muted-soft"}>
                  {value || "—"}
                  {value && field.unit && !["text", "boolean"].includes(field.unit) && /^[\d.\s/]+$/.test(value) ? <span className="ml-0.5 text-xs font-medium text-muted">{field.unit}</span> : null}
                </p>
              </div>
              {shouldBreakAfterMeasurement(field) ? (
                <div className="col-span-full h-px bg-gradient-to-r from-transparent via-gold to-transparent" data-testid="measurement-section-break" aria-hidden="true" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
