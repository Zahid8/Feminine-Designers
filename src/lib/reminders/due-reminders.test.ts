import { describe, expect, it } from "vitest";
import { isDueOn, reminderBook, tomorrowOf } from "./due-reminders";

function memoryStore() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    key: (index: number) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
    map
  };
}

describe("due reminders", () => {
  it("finds open orders due on a date", () => {
    expect(tomorrowOf("2026-10-31")).toBe("2026-11-01");
    expect(isDueOn({ deliveryDate: "2026-10-18", status: "Ready" }, "2026-10-18")).toBe(true);
    expect(isDueOn({ deliveryDate: "2026-10-18", status: "Delivered" }, "2026-10-18")).toBe(false);
    expect(isDueOn({ deliveryDate: "2026-10-18", status: "Cancelled" }, "2026-10-18")).toBe(false);
    expect(isDueOn({ deliveryDate: "2026-10-19", status: "New" }, "2026-10-18")).toBe(false);
  });

  it("remembers dismissals per date and forgets other dates", () => {
    const store = memoryStore();
    const today = reminderBook(store, "2026-10-18");
    today.dismiss(["a"]);
    today.dismiss(["b"]);
    expect([...today.dismissed()].sort()).toEqual(["a", "b"]);

    const next = reminderBook(store, "2026-10-19");
    expect(next.dismissed().size).toBe(0);
    next.dismiss(["c"]);
    expect(store.map.has("fd-reminders-dismissed:2026-10-18")).toBe(false);
  });

  it("tracks chimes separately from dismissals and survives bad stored data", () => {
    const store = memoryStore();
    store.setItem("fd-reminders-chimed:2026-10-18", "not json");
    const book = reminderBook(store, "2026-10-18");
    expect(book.chimed().size).toBe(0);
    book.markChimed(["a"]);
    expect(book.chimed().has("a")).toBe(true);
    expect(book.dismissed().has("a")).toBe(false);
  });
});
