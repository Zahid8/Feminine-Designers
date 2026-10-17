import { addDaysISO } from "@/lib/utils/date";

export interface DueReminder {
  id: string;
  receiptNumber: string | null;
  customerName: string;
  phone: string;
  garments: string;
  status: string;
  deliveryDate: string;
}

const OPEN_STATUSES_EXCLUDED = new Set(["Delivered", "Cancelled"]);

/** The India date of "tomorrow" for a given India "today" (ISO strings, no clock reads). */
export function tomorrowOf(today: string) {
  return addDaysISO(today, 1);
}

/** Orders still to be handed over on `date`. */
export function isDueOn(order: { deliveryDate: string; status: string }, date: string) {
  return order.deliveryDate === date && !OPEN_STATUSES_EXCLUDED.has(order.status);
}

const DISMISSED_PREFIX = "fd-reminders-dismissed:";
const CHIMED_PREFIX = "fd-reminders-chimed:";
const NOTIFIED_PREFIX = "fd-reminders-notified:";

type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

function readSet(store: KeyValueStore, key: string) {
  try {
    const parsed = JSON.parse(store.getItem(key) ?? "[]");
    return new Set<string>(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function addToSet(store: KeyValueStore, prefix: string, date: string, ids: string[]) {
  const key = prefix + date;
  const set = readSet(store, key);
  ids.forEach((id) => set.add(id));
  store.setItem(key, JSON.stringify([...set]));
  pruneOld(store, prefix, date);
}

/** Drops bookkeeping for other dates so storage doesn't grow forever. */
function pruneOld(store: KeyValueStore, prefix: string, keepDate: string) {
  const stale: string[] = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    if (key?.startsWith(prefix) && key !== prefix + keepDate) stale.push(key);
  }
  stale.forEach((key) => store.removeItem(key));
}

/**
 * Per-device memory for the "due tomorrow" stack, keyed by the delivery date so a new
 * day starts fresh: which cards were dismissed, which already chimed, and which already
 * raised a system notification.
 */
export function reminderBook(store: KeyValueStore, date: string) {
  return {
    dismissed: () => readSet(store, DISMISSED_PREFIX + date),
    dismiss: (ids: string[]) => addToSet(store, DISMISSED_PREFIX, date, ids),
    chimed: () => readSet(store, CHIMED_PREFIX + date),
    markChimed: (ids: string[]) => addToSet(store, CHIMED_PREFIX, date, ids),
    notified: () => readSet(store, NOTIFIED_PREFIX + date),
    markNotified: (ids: string[]) => addToSet(store, NOTIFIED_PREFIX, date, ids)
  };
}
