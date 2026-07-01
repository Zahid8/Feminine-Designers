import type { MeasurementTemplate, MeasurementValue } from "@/types/domain";

export function createMeasurementSnapshot(
  template: MeasurementTemplate,
  values: Record<string, string>,
  notes: Record<string, string> = {}
): MeasurementValue[] {
  return template.fields
    .filter((field) => field.active)
    .map((field) => ({
      id: `${template.id}-${field.fieldKey}`,
      templateId: template.id,
      fieldKey: field.fieldKey,
      displayCode: field.displayCode,
      displayLabel: field.displayLabel,
      value: values[field.fieldKey]?.trim() ?? "",
      unit: field.unit === "in" ? "in" : "",
      notes: notes[field.fieldKey]?.trim() || undefined,
      sortOrder: field.sortOrder
    }))
    .filter((measurement) => measurement.value !== "" || measurement.notes);
}

export function copyMeasurementGroup(
  measurements: MeasurementValue[],
  selectedFieldKeys?: string[]
): Record<string, string> {
  const selected = selectedFieldKeys ? new Set(selectedFieldKeys) : undefined;
  return measurements.reduce<Record<string, string>>((acc, measurement) => {
    if (!selected || selected.has(measurement.fieldKey)) {
      acc[measurement.fieldKey] = measurement.value;
    }
    return acc;
  }, {});
}
