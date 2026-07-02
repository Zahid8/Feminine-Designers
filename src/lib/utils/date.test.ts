import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, normalizeDateInput, todayISO } from "@/lib/utils/date";

describe("India date utilities", () => {
  it("uses India time when deriving today's ISO key", () => {
    expect(todayISO(new Date("2026-07-01T20:00:00.000Z"))).toBe("2026-07-02");
  });

  it("formats visible dates as dd/mm/yyyy", () => {
    expect(formatDate("2026-07-02")).toBe("02/07/2026");
    expect(formatDateTime("2026-07-01T20:00:00.000Z")).toContain("02/07/2026");
  });

  it("normalizes dd/mm/yyyy date input before saving", () => {
    expect(normalizeDateInput("05/07/2026")).toBe("2026-07-05");
    expect(normalizeDateInput("2026-07-05")).toBe("2026-07-05");
  });
});
