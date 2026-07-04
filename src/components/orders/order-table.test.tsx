import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrderTable } from "@/components/orders/order-table";
import { orders } from "@/lib/data/mock";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

vi.mock("@/app/orders/actions", () => ({
  setOrderCompletedAction: vi.fn()
}));

describe("OrderTable", () => {
  it("renders rows sorted by priority before delivery date", () => {
    const urgentLater = { ...orders[0], priority: "Urgent" as const, deliveryDate: "2026-07-10" };
    const expressMiddle = {
      ...orders[1],
      id: "express-middle",
      priority: "Express" as const,
      deliveryDate: "2026-07-05",
      receiptNumber: "SJD-2026-000003"
    };
    const normalEarlier = { ...orders[1], id: "normal-earlier", priority: "Normal" as const, deliveryDate: "2026-07-01" };
    const { container } = render(<OrderTable orders={[normalEarlier, urgentLater, expressMiddle]} />);

    const desktopReceiptCells = [...container.querySelectorAll("tbody tr td:nth-child(2)")].map((cell) => cell.textContent);

    expect(desktopReceiptCells).toEqual([expressMiddle.receiptNumber, urgentLater.receiptNumber, normalEarlier.receiptNumber]);
  });

  it("lets staff sort visible orders by balance or total", () => {
    const { container } = render(<OrderTable orders={[orders[0], orders[1]]} />);

    fireEvent.change(screen.getByLabelText(/sort orders by/i), { target: { value: "balance" } });
    const balanceSortedReceipts = [...container.querySelectorAll("tbody tr td:nth-child(2)")].map((cell) => cell.textContent);

    expect(balanceSortedReceipts).toEqual([orders[0].receiptNumber, orders[1].receiptNumber]);

    fireEvent.change(screen.getByLabelText(/sort orders by/i), { target: { value: "receiptNumber" } });
    const receiptSortedReceipts = [...container.querySelectorAll("tbody tr td:nth-child(2)")].map((cell) => cell.textContent);

    expect(receiptSortedReceipts).toEqual([orders[0].receiptNumber, orders[1].receiptNumber]);
  });
});
