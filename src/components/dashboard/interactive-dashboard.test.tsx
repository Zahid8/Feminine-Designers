import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InteractiveDashboard } from "@/components/dashboard/interactive-dashboard";
import { buildDashboardModel } from "@/lib/dashboard/dashboard-model";
import { orders } from "@/lib/data/mock";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

vi.mock("@/app/orders/[id]/actions", () => ({
  setOrderStageAction: vi.fn()
}));

vi.mock("@/app/orders/actions", () => ({
  reversePaymentAction: vi.fn(),
  setOrderCompletedAction: vi.fn(),
  settleOrderBalanceAction: vi.fn()
}));

describe("InteractiveDashboard", () => {
  it("shows order date in the work queue", () => {
    render(<InteractiveDashboard model={buildDashboardModel(orders, "2026-07-01")} initialWorkView="list" />);

    expect(screen.getAllByText("Order date").length).toBeGreaterThan(0);
    expect(screen.getAllByText("01/07/2026").length).toBeGreaterThan(0);
  });

  it("opens on the workshop board and switches to the list when a summary card is tapped", () => {
    render(<InteractiveDashboard model={buildDashboardModel(orders, "2026-07-01")} boardOrders={orders} />);

    expect(screen.getByRole("tab", { name: "Board" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("region", { name: "In Stitching orders" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /pending orders/i }));

    expect(screen.getByRole("tab", { name: "List" }).getAttribute("aria-selected")).toBe("true");
  });
});
