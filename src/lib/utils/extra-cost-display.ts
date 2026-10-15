export function formatExtraCostLabel(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return "Extra cost";
  return /\bprice$/i.test(trimmed) ? trimmed : `${trimmed} price`;
}

export function formatExtraCostLine(label: string, formattedAmount: string) {
  return `${formatExtraCostLabel(label)} ${formattedAmount}`;
}

/** Extra costs across all items, grouped by their display label ("Lace price"). */
export function groupedExtraCosts(items: { extraCosts?: { label: string; amountPaise: number }[] }[]) {
  const grouped = new Map<string, number>();
  for (const cost of items.flatMap((item) => item.extraCosts ?? [])) {
    if (!cost.label.trim() && cost.amountPaise === 0) continue;
    const label = formatExtraCostLabel(cost.label);
    grouped.set(label, (grouped.get(label) ?? 0) + cost.amountPaise);
  }
  return [...grouped].map(([label, amountPaise]) => ({ label, amountPaise }));
}
