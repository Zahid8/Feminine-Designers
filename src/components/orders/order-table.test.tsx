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
  it("renders rows sorted by delivery date", () => {
    const { container } = render(<OrderTable orders={[orders[0], orders[1]]} />);

    const desktopReceiptCells = [...container.querySelectorAll("tbody tr td:nth-child(2)")].map((cell) => cell.textContent);

    expect(desktopReceiptCells).toEqual([orders[1].receiptNumber, orders[0].receiptNumber]);
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
