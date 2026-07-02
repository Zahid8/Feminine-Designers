export const INDIA_TIME_ZONE = "Asia/Kolkata";

const datePartFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: INDIA_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: INDIA_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true
});

function indiaDateParts(date: Date) {
  const parts = datePartFormatter.formatToParts(date);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";

  return {
    day: part("day"),
    month: part("month"),
    year: part("year")
  };
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function normalizeDateInput(value: string): string {
  const trimmed = value.trim();
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${pad2(Number(month))}-${pad2(Number(day))}`;
  }

  const isoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  }

  return trimmed;
}

export function todayISO(date = new Date()): string {
  const { day, month, year } = indiaDateParts(date);
  return `${year}-${month}-${day}`;
}

export function addDaysISO(value: string, days: number): string {
  const normalized = normalizeDateInput(value);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return normalized;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + days));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function indiaNoonDate(value: string): Date {
  return new Date(`${normalizeDateInput(value)}T12:00:00+05:30`);
}

export function formatDate(value: string): string {
  const normalized = normalizeDateInput(value);
  const dateOnly = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  }

  const date = new Date(value);
  if (!isValidDate(date)) return value;

  const { day, month, year } = indiaDateParts(date);
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (!isValidDate(date)) return String(value);

  const { day, month, year } = indiaDateParts(date);
  return `${day}/${month}/${year}, ${timeFormatter.format(date)}`;
}
