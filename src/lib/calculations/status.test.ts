import { describe, expect, it } from "vitest";
import { canTransitionStatus, deliveryUrgency, isCompletedOrderForList, isPastOrderForList, nextAllowedStatuses } from "@/lib/calculations/status";

describe("status workflow", () => {
  it("allows recommended forward operational transitions", () => {
    expect(canTransitionStatus("Draft", "New")).toBe(true);
    expect(canTransitionStatus("New", "In Stitching")).toBe(true);
    expect(canTransitionStatus("In Stitching", "Ready")).toBe(true);
    expect(canTransitionStatus("Ready", "Delivered")).toBe(true);
  });

  it("prevents casual delivered rollback", () => {
    expect(nextAllowedStatuses("Delivered")).toEqual([]);
    expect(canTransitionStatus("Delivered", "Ready")).toBe(false);
  });

  it("classifies delivered orders as completed list orders", () => {
    expect(isCompletedOrderForList({ status: "Delivered" })).toBe(true);
    expect(isCompletedOrderForList({ status: "Ready" })).toBe(false);
  });

  it("classifies only overdue incomplete orders as past list orders", () => {
    expect(isPastOrderForList({ status: "Delivered", deliveryDate: "2026-06-30" }, "2026-07-01")).toBe(false);
    expect(isPastOrderForList({ status: "Delivered", deliveryDate: "2026-07-05" }, "2026-07-01")).toBe(false);
    expect(isPastOrderForList({ status: "Ready", deliveryDate: "2026-06-30" }, "2026-07-01")).toBe(true);
    expect(isPastOrderForList({ status: "Ready", deliveryDate: "2026-07-01" }, "2026-07-01")).toBe(false);
    expect(isPastOrderForList({ status: "New", deliveryDate: "2026-07-02" }, "2026-07-01")).toBe(false);
  });
});

describe("deliveryUrgency", () => {
  it("labels open orders by days until delivery", () => {
    expect(deliveryUrgency("2026-10-10", "New", "2026-10-15")).toEqual({ label: "Overdue 5d", tone: "overdue", days: -5 });
    expect(deliveryUrgency("2026-10-15", "Ready", "2026-10-15")).toEqual({ label: "Due today", tone: "today", days: 0 });
    expect(deliveryUrgency("2026-10-16", "In Stitching", "2026-10-15")?.label).toBe("Tomorrow");
    expect(deliveryUrgency("2026-10-18", "New", "2026-10-15")).toEqual({ label: "In 3 days", tone: "soon", days: 3 });
    expect(deliveryUrgency("2026-11-01", "New", "2026-10-15")?.tone).toBe("later");
  });

  it("crosses month boundaries and ignores finished orders", () => {
    expect(deliveryUrgency("2026-11-01", "New", "2026-10-31")?.label).toBe("Tomorrow");
    expect(deliveryUrgency("2026-10-01", "Delivered", "2026-10-15")).toBeUndefined();
    expect(deliveryUrgency("2026-10-01", "Cancelled", "2026-10-15")).toBeUndefined();
  });
});
