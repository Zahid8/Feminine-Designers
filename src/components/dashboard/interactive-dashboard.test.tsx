import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InteractiveDashboard } from "@/components/dashboard/interactive-dashboard";
import { buildDashboardModel } from "@/lib/dashboard/dashboard-model";
import { orders } from "@/lib/data/mock";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

vi.mock("@/app/orders/actions", () => ({
  reversePaymentAction: vi.fn(),
  setOrderCompletedAction: vi.fn(),
  settleOrderBalanceAction: vi.fn()
}));

describe("InteractiveDashboard", () => {
  it("shows order date in the work queue", () => {
    render(<InteractiveDashboard model={buildDashboardModel(orders, "2026-07-01")} />);

    expect(screen.getAllByText("Order date").length).toBeGreaterThan(0);
    expect(screen.getAllByText("01/07/2026").length).toBeGreaterThan(0);
  });
});
