export interface ReceiptNumberOptions {
  prefix: string;
  year: number;
  sequence: number;
  width?: number;
}

export function formatReceiptNumber({ prefix, year, sequence, width = 6 }: ReceiptNumberOptions): string {
  if (!/^[A-Z0-9-]{2,12}$/.test(prefix)) {
    throw new Error("Receipt prefix must be 2-12 uppercase letters, digits, or hyphens.");
  }
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error("Receipt year is invalid.");
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Receipt sequence must be a positive integer.");
  }
  return `${prefix}-${year}-${String(sequence).padStart(width, "0")}`;
}

export function nextSequenceValue(currentValue: number, startingSerial = 1): number {
  if (!Number.isInteger(currentValue) || currentValue < 0) {
    throw new Error("Current receipt sequence must be a non-negative integer.");
  }
  if (!Number.isInteger(startingSerial) || startingSerial < 1) {
    throw new Error("Starting serial must be a positive integer.");
  }
  return currentValue === 0 ? startingSerial : currentValue + 1;
}
