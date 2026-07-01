import type { MeasurementTemplate, MeasurementValue } from "@/types/domain";
import { Input, Textarea } from "@/components/ui/input";

export function MeasurementGrid({
  template,
  values,
  editable = false,
  valuePrefix = "measurement",
  metaPrefix = "measurementMeta"
}: {
  template?: MeasurementTemplate;
  values?: MeasurementValue[];
  editable?: boolean;
  valuePrefix?: string;
  metaPrefix?: string;
}) {
  const fields = template?.fields ?? values ?? [];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => {
        const value = "value" in field ? field.value : "";
        return (
          <label key={field.id} className="grid gap-1 rounded-md border border-[#eadfce] bg-white p-3 text-sm">
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
            {editable ? <Input name={`${valuePrefix}.${field.fieldKey}`} defaultValue={value} inputMode="decimal" /> : <span>{value || "-"}</span>}
          </label>
        );
      })}
      {editable ? (
        <label className="grid gap-1 rounded-md border border-[#eadfce] bg-white p-3 text-sm sm:col-span-2 xl:col-span-3">
          <span className="font-semibold text-[#4c1525]">Special Notes</span>
          <Textarea name={`${valuePrefix}Notes`} placeholder="Garment-specific fitting notes" />
        </label>
      ) : null}
    </div>
  );
}
