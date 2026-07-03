export function formatExtraCostLabel(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return "Extra cost";
  return /\bprice$/i.test(trimmed) ? trimmed : `${trimmed} price`;
}

export function formatExtraCostLine(label: string, formattedAmount: string) {
  return `${formatExtraCostLabel(label)} ${formattedAmount}`;
}
