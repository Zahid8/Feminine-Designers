import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NewOrderForm } from "@/components/orders/new-order-form";
import { GARMENT_TYPES, MEASUREMENT_TEMPLATES } from "@/lib/constants/business";

describe("NewOrderForm actions", () => {
  it("starts customer name and phone fields blank", () => {
    render(<NewOrderForm />);

    expect((screen.getByLabelText(/search or customer name/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/phone number/i) as HTMLInputElement).value).toBe("");
  });

  it("submits draft, final order, and print intents instead of inert buttons", () => {
    render(<NewOrderForm />);

    expect(screen.getByRole("button", { name: /save draft/i })).toMatchObject({
      type: "submit",
      name: "intent",
      value: "draft"
    });
    expect(screen.getByRole("button", { name: /^save order$/i })).toMatchObject({
      type: "submit",
      name: "intent",
      value: "order"
    });
    expect(screen.getByRole("button", { name: /save and print/i })).toMatchObject({
      type: "submit",
      name: "intent",
      value: "print"
    });
  });

  it("has a tablet camera capture control for the cloth sample", () => {
    render(<NewOrderForm />);

    const captureInput = screen.getByLabelText(/cloth sample photo/i);
    expect(captureInput.getAttribute("type")).toBe("file");
    expect(captureInput.getAttribute("accept")).toBe("image/*");
    expect(captureInput.getAttribute("capture")).toBe("environment");
    expect(screen.getByRole("button", { name: /take cloth photo/i })).toBeDefined();
  });

  it("renders garment types and measurement fields supplied from settings", () => {
    render(
      <NewOrderForm
        garmentTypes={[...GARMENT_TYPES, { id: "garment-sharara", name: "Sharara", active: true }]}
        measurementTemplates={[
          {
            ...MEASUREMENT_TEMPLATES[0],
            fields: [
              ...MEASUREMENT_TEMPLATES[0].fields,
              {
                id: "tmpl-blouse-ankle_round",
                fieldKey: "ankle_round",
                displayCode: "AR",
                displayLabel: "AR",
                longLabel: "Ankle Round",
                inputType: "number",
                unit: "in",
                isRequired: false,
                sortOrder: 99,
                active: true
              }
            ]
          }
        ]}
      />
    );

    expect(screen.getByRole("option", { name: "Sharara" })).toBeDefined();
    expect(screen.getByText("AR")).toBeDefined();
    expect(screen.getByText("Ankle Round")).toBeDefined();
  });

  it("renders one global measurement set instead of item-specific measurement fields", () => {
    const { container } = render(<NewOrderForm />);

    expect(container.querySelector('[name="measurement.length"]')).toBeDefined();
    expect(container.querySelector('[name="measurementMeta.length.displayCode"]')).toBeDefined();
    expect(container.querySelector('[name="measurements.0.length"]')).toBeNull();
    expect(container.querySelector('[name="measurementMeta.0.length.displayCode"]')).toBeNull();
  });

  it("adds a measurement section break after crotch", () => {
    render(<NewOrderForm />);

    expect(screen.getAllByTestId("measurement-section-break").length).toBeGreaterThan(0);
  });
});
