import { describe, expect, it } from "vitest";
import { canTransitionStatus, isCompletedOrderForList, isPastOrderForList, nextAllowedStatuses } from "@/lib/calculations/status";

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
