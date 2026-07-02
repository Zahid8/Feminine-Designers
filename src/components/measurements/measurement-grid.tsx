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
  const fields = template?.fields ?? values ?? [];
  const defaultValueByField = new Map(defaultValues?.map((value) => [value.fieldKey, value.value]));
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => {
        const rawValue = "value" in field ? field.value : defaultValueByField.get(field.fieldKey) ?? "";
        const value = rawValue === "NA" ? "" : rawValue;
        const controlledValue = controlledValues?.[field.fieldKey];
        return (
          <div key={field.id} className="contents">
            <label className="grid gap-1 rounded-md border border-[#eadfce] bg-white p-3 text-sm">
              <span className="flex items-center justify-between gap-2">
                <strong className="text-[#4c1525]">{field.displayCode}</strong>
                <span className="text-xs text-[#7c6d66]">
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
                className="h-px bg-[#d8c7b4] sm:col-span-2 xl:col-span-3"
                data-testid="measurement-section-break"
                aria-hidden="true"
              />
            ) : null}
          </div>
        );
      })}
      {editable ? (
        <label className="grid gap-1 rounded-md border border-[#eadfce] bg-white p-3 text-sm sm:col-span-2 xl:col-span-3">
          <span className="font-semibold text-[#4c1525]">Special Notes</span>
          <Textarea name={`${valuePrefix}Notes`} placeholder="Fitting notes" />
        </label>
      ) : null}
    </div>
  );
}
