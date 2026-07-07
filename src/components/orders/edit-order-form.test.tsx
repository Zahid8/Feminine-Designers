import { fireEvent, render, screen } from "@testing-library/react";
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

  it("normalizes timestamp-like saved dates before filling calendar inputs", () => {
    render(
      <EditOrderForm
        order={{
          ...orders[0],
          orderDate: "2026-06-15T00:00:00+05:30",
          deliveryDate: "2026-06-22T00:00:00+05:30"
        }}
        action={vi.fn()}
      />
    );

    expect((screen.getByLabelText(/^order date$/i) as HTMLInputElement).value).toBe("2026-06-15");
    expect((screen.getByLabelText(/^delivery date$/i) as HTMLInputElement).value).toBe("2026-06-22");
  });

  it("has a direct priority selector for editing saved orders", () => {
    render(<EditOrderForm order={{ ...orders[0], priority: "Urgent" }} action={vi.fn()} />);

    const prioritySelect = screen.getByLabelText(/^priority$/i) as HTMLSelectElement;

    expect(prioritySelect.tagName).toBe("SELECT");
    expect(prioritySelect.name).toBe("priority");
    expect(prioritySelect.value).toBe("Urgent");
    expect([...prioritySelect.options].map((option) => option.value)).toEqual(["Express", "Urgent", "Normal"]);
  });

  it("shows the same payment controls as new order when editing a saved bill", () => {
    render(<EditOrderForm order={orders[0]} action={vi.fn()} />);

    const advanceInput = screen.getByLabelText(/^advance paid$/i) as HTMLInputElement;
    const paymentModeSelect = screen.getByLabelText(/^payment mode$/i) as HTMLSelectElement;
    const paymentReferenceInput = screen.getByLabelText(/^payment reference$/i) as HTMLInputElement;

    expect(advanceInput.name).toBe("advancePaidRupees");
    expect(advanceInput.value).toBe("1500");
    expect(paymentModeSelect.name).toBe("paymentMethod");
    expect(paymentModeSelect.value).toBe("UPI");
    expect([...paymentModeSelect.options].map((option) => option.value)).toEqual(["Cash", "UPI", "Card", "Bank Transfer", "Mixed"]);
    expect(paymentReferenceInput.name).toBe("paymentReference");
    expect(paymentReferenceInput.value).toBe("UPI-2451");
  });

  it("lets staff add a new dress and delete an existing dress while editing", () => {
    const { container } = render(<EditOrderForm order={orders[0]} action={vi.fn()} />);

    expect(screen.getByText("Dress 1")).toBeDefined();
    expect(screen.getByText("Dress 2")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /add dress/i }));

    expect(screen.getByText("Dress 3")).toBeDefined();
    expect(container.querySelector('[name="items.2.id"]')).toBeDefined();
    expect(container.querySelector('[name="items.2.garmentType"]')).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /delete dress 2/i }));

    expect(container.querySelector(`[value="${orders[0].items[1].id}"]`)).toBeNull();
    expect(screen.queryByText("Dress 3")).toBeNull();
    expect(screen.getAllByText(/Dress \d/)).toHaveLength(2);
  });
});
