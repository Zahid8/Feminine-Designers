import type { MeasurementValue } from "@/types/domain";

const clean = (value: string | undefined) => (value ?? "").trim().replace(/^NA$/i, "");

/** True when any submitted measurement differs from what is currently shown for the customer. */
export function measurementsChanged(submitted: MeasurementValue[], current: { values: MeasurementValue[] } | undefined) {
  if (submitted.length === 0) return false;
  const currentByKey = new Map((current?.values ?? []).map((value) => [value.fieldKey, clean(value.value)]));
  return submitted.some((value) => clean(value.value) !== (currentByKey.get(value.fieldKey) ?? ""));
}
