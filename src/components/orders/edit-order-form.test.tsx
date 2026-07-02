import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditOrderForm } from "@/components/orders/edit-order-form";
import { orders } from "@/lib/data/mock";

describe("EditOrderForm", () => {
  it("uses calendar date inputs for saved order dates", () => {
    render(<EditOrderForm order={orders[0]} action={vi.fn()} />);

    const orderDateInput = screen.getByLabelText(/^order date$/i) as HTMLInputElement;
    const deliveryDateInput = screen.getByLabelText(/^delivery date$/i) as HTMLInputElement;

    expect(orderDateInput.type).toBe("date");
    expect(deliveryDateInput.type).toBe("date");
    expect(orderDateInput.value).toBe(orders[0].orderDate);
    expect(deliveryDateInput.value).toBe(orders[0].deliveryDate);
  });
});
