import { describe, expect, it } from "vitest";
import { boardColumnFor, boardMoves, isOnBoard } from "./board";

describe("workshop board", () => {
  it("places open orders in workflow columns", () => {
    expect(boardColumnFor("Draft")).toBe("new");
    expect(boardColumnFor("New")).toBe("new");
    expect(boardColumnFor("In Stitching")).toBe("stitching");
    expect(boardColumnFor("Ready")).toBe("ready");
    expect(boardColumnFor("Delivered")).toBe("delivered");
    expect(boardColumnFor("Cancelled")).toBeUndefined();
  });

  it("moves orders one stage forward or back", () => {
    expect(boardMoves("New")).toEqual({ next: "In Stitching" });
    expect(boardMoves("In Stitching")).toEqual({ next: "Ready", previous: "New" });
    expect(boardMoves("Ready")).toEqual({ next: "Delivered", previous: "In Stitching" });
    expect(boardMoves("Delivered")).toEqual({ previous: "Ready" });
    expect(boardMoves("Cancelled")).toEqual({});
  });

  it("keeps delivered orders on the board for seven days", () => {
    const now = new Date("2026-10-15T12:00:00Z");
    expect(isOnBoard({ status: "Delivered", updatedAt: "2026-10-10T12:00:00Z" }, now)).toBe(true);
    expect(isOnBoard({ status: "Delivered", updatedAt: "2026-10-01T12:00:00Z" }, now)).toBe(false);
    expect(isOnBoard({ status: "New", updatedAt: "2025-01-01T00:00:00Z" }, now)).toBe(true);
    expect(isOnBoard({ status: "Cancelled", updatedAt: "2026-10-15T00:00:00Z" }, now)).toBe(false);
  });
});
