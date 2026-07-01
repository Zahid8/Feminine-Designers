export function rupeesToPaise(value: number): number {
  return Math.round(value * 100);
}

export function paiseToRupees(value: number): number {
  return value / 100;
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(paiseToRupees(paise));
}

export function clampPaise(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}
