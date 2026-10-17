import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DueTomorrowNotifier } from "@/components/layout/due-tomorrow-notifier";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const payload = {
  date: "2026-10-18",
  orders: [
    { id: "o1", receiptNumber: "SJD-2026-000050", customerName: "Natasha", phone: "9717075751", garments: "Blouse ×2", status: "Ready", deliveryDate: "2026-10-18" },
    { id: "o2", receiptNumber: "SJD-2026-000051", customerName: "Abha", phone: "9999108143", garments: "Suit", status: "In Stitching", deliveryDate: "2026-10-18" }
  ]
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 })));
});

afterEach(() => vi.unstubAllGlobals());

describe("DueTomorrowNotifier", () => {
  it("shows a card per order due tomorrow and remembers dismissals for that day", async () => {
    const { unmount } = render(<DueTomorrowNotifier />);
    await screen.findByText(/SJD-2026-000050 · Natasha/);
    expect(screen.getByText(/2 due tomorrow/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /dismiss reminder for SJD-2026-000050/i }));
    expect(screen.queryByText(/SJD-2026-000050 · Natasha/)).toBeNull();
    expect(JSON.parse(localStorage.getItem("fd-reminders-dismissed:2026-10-18") ?? "[]")).toEqual(["o1"]);

    unmount();
    render(<DueTomorrowNotifier />);
    await screen.findByText(/SJD-2026-000051 · Abha/);
    expect(screen.queryByText(/SJD-2026-000050 · Natasha/)).toBeNull();
  });

  it("disappears after Dismiss all", async () => {
    render(<DueTomorrowNotifier />);
    await screen.findByText(/SJD-2026-000051 · Abha/);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Dismiss all" })));
    await waitFor(() => expect(screen.queryByLabelText("Reminders")).toBeNull());
  });

  it("renders nothing when no orders are due", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ date: "2026-10-18", orders: [] }), { status: 200 })));
    render(<DueTomorrowNotifier />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByLabelText("Reminders")).toBeNull();
  });
});
