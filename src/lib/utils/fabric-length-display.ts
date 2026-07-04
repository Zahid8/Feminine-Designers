export function formatFabricLengthDisplay(value?: string | null) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed || trimmed.toUpperCase() === "NA") {
    return "";
  }

  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return `${trimmed} m`;
  }

  return trimmed;
}
