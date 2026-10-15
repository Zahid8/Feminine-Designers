/** "Blouse ×3, Suit" instead of repeating every garment name. */
export function summarizeGarments(items: { garmentType: string; quantity?: number }[]) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.garmentType, (counts.get(item.garmentType) ?? 0) + (item.quantity || 1));
  return [...counts].map(([type, count]) => (count > 1 ? `${type} ×${count}` : type)).join(", ");
}
