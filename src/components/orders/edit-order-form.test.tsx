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
});
