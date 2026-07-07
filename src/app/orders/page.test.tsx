import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrdersPage from "@/app/orders/page";
import { orders } from "@/lib/data/mock";
import { listOrders } from "@/services/orders/order-service";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock("@/components/orders/order-table", () => ({
  OrderTable: ({ orders }: { orders: { id: string }[] }) => (
    <div data-testid="orders-table">{orders.map((order) => order.id).join(",")}</div>
  )
}));

vi.mock("@/services/orders/order-service", () => ({
  listOrders: vi.fn()
}));

vi.mock("@/lib/utils/date", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils/date")>();
  return {
    ...actual,
    todayISO: () => "2026-07-06"
  };
});

describe("OrdersPage", () => {
  it("splits current, past overdue, and completed orders into separate tabs", async () => {
    const currentOrder = { ...orders[0], id: "current-order", status: "Ready" as const, deliveryDate: "2026-07-07", overdue: false, daysOverdue: 0 };
    const overdueOrder = { ...orders[0], id: "overdue-order", status: "Ready" as const, deliveryDate: "2026-07-05", overdue: true, daysOverdue: 1 };
    const completedOrder = { ...orders[0], id: "completed-order", status: "Delivered" as const, deliveryDate: "2026-07-01", overdue: false, daysOverdue: 0 };
    vi.mocked(listOrders).mockResolvedValue([currentOrder, overdueOrder, completedOrder]);

    render(await OrdersPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: /current orders\s*1/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /past orders\s*1/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /completed orders\s*1/i })).toBeDefined();
    expect(screen.getByTestId("orders-table").textContent).toBe("current-order");
  });

  it("shows completed orders when the completed tab is selected", async () => {
    const currentOrder = { ...orders[0], id: "current-order", status: "Ready" as const, deliveryDate: "2026-07-07", overdue: false, daysOverdue: 0 };
    const completedOrder = { ...orders[0], id: "completed-order", status: "Delivered" as const, deliveryDate: "2026-07-01", overdue: false, daysOverdue: 0 };
    vi.mocked(listOrders).mockResolvedValue([currentOrder, completedOrder]);

    render(await OrdersPage({ searchParams: Promise.resolve({ view: "completed" }) }));

    expect(screen.getByTestId("orders-table").textContent).toBe("completed-order");
  });
});
