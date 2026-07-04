import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditOrderChoiceFields } from "@/components/orders/edit-order-choice-fields";

function hiddenInput(container: HTMLElement, name: string) {
  const input = container.querySelector(`input[type="hidden"][name="${name}"]`);
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing hidden input ${name}`);
  return input;
}

describe("EditOrderChoiceFields", () => {
  it("submits one canonical status value after a status-only checkbox change", () => {
    const { container, getByLabelText } = render(
      <form>
        <EditOrderChoiceFields status="Ready" paymentStatus="Partial" />
      </form>
    );

    fireEvent.click(getByLabelText("New"));

    expect(hiddenInput(container, "status").value).toBe("New");
    expect(container.querySelectorAll('input[name="status"]')).toHaveLength(1);
  });

  it("does not submit a payment override until paid or not paid is selected", () => {
    const { container, getByLabelText } = render(
      <form>
        <EditOrderChoiceFields status="Ready" paymentStatus="Partial" />
      </form>
    );

    expect(container.querySelector('input[name="paymentStatus"]')).toBeNull();

    fireEvent.click(getByLabelText("Paid"));

    expect(hiddenInput(container, "paymentStatus").value).toBe("Paid");
  });

});
