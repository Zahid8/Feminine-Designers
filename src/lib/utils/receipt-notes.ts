import type { MeasurementValue } from "@/types/domain";

export function uniqueMeasurementNotes(measurements: MeasurementValue[]) {
  const notes = measurements
    .map((measurement) => measurement.notes?.trim())
    .filter((note): note is string => Boolean(note));

  return [...new Set(notes)];
}

