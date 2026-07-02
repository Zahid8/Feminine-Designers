export function formatMeasurementValue(value: string, unit?: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue || normalizedValue.toUpperCase() === "NA") {
    return "";
  }

  if (!unit || unit === "text" || unit === "boolean") {
    return normalizedValue;
  }

  return `${normalizedValue} ${unit}`;
}

export function isPrintableMeasurementValue(value: string) {
  const normalizedValue = value.trim();
  return Boolean(normalizedValue) && normalizedValue.toUpperCase() !== "NA";
}
