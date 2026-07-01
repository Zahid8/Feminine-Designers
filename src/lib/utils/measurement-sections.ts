export interface MeasurementSectionField {
  fieldKey: string;
  displayCode: string;
  displayLabel: string;
  longLabel?: string;
}

export function shouldBreakAfterMeasurement(field: MeasurementSectionField) {
  const searchable = [field.fieldKey, field.displayCode, field.displayLabel, field.longLabel ?? ""]
    .join(" ")
    .toLowerCase();

  return searchable.includes("crotch");
}
