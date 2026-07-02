import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrderDetailPage from "@/app/orders/[id]/page";
import { orders } from "@/lib/data/mock";
import { getOrderById } from "@/services/orders/order-service";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock("@/components/orders/order-status-checkbox-editor", () => ({
  OrderStatusCheckboxEditor: () => <div />
}));

vi.mock("@/components/orders/order-item-delivery-tracker", () => ({
  OrderItemDeliveryTracker: () => <div />
}));

vi.mock("@/components/orders/delete-order-button", () => ({
  DeleteOrderButton: () => <button type="button">Delete Order</button>
}));

vi.mock("@/app/orders/[id]/actions", () => ({
  updateOrderAction: vi.fn()
}));

vi.mock("@/services/orders/order-service", () => ({
  getOrderById: vi.fn()
}));

vi.mock("@/services/measurements/measurement-service", () => ({
  getMeasurementTemplateForGarment: vi.fn()
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  })
}));

describe("OrderDetailPage", () => {
  it("shows fabric color beneath the garment name when present", async () => {
    vi.mocked(getOrderById).mockResolvedValue({
      ...orders[0],
      overdue: false,
      daysOverdue: 0,
      items: [
        {
          ...orders[0].items[0],
          garmentType: "Suit",
          fabricColor: "Bottle green"
        }
      ]
    });

    render(
      await OrderDetailPage({
        params: Promise.resolve({ id: orders[0].id }),
        searchParams: Promise.resolve({})
      })
    );

    expect(screen.getByText("Suit")).toBeDefined();
    expect(screen.getByText("Fabric color: Bottle green")).toBeDefined();
  });
});
