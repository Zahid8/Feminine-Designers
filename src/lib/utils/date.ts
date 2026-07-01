export function todayISO(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}
