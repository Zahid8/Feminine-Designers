import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewOrderForm } from "@/components/orders/new-order-form";
import { GARMENT_TYPES, MEASUREMENT_TEMPLATES } from "@/lib/constants/business";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NewOrderForm actions", () => {
  it("starts customer name and phone fields blank", () => {
    render(<NewOrderForm />);

    expect((screen.getByLabelText(/search or customer name/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/phone number/i) as HTMLInputElement).value).toBe("");
  });

  it("starts advance payment at zero", () => {
    render(<NewOrderForm />);

    expect((screen.getByLabelText(/advance paid/i) as HTMLInputElement).value).toBe("0");
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

  it("renders per-dress fabric and dye price fields", () => {
    const { container } = render(<NewOrderForm />);

    expect(container.querySelector('[name="items.0.fabricPriceRupees"]')).toBeDefined();
    expect(container.querySelector('[name="items.0.dyePriceRupees"]')).toBeDefined();
  });

  it("uses plus and minus controls for garment count and dress quantity", () => {
    const { container } = render(<NewOrderForm />);
    const clothCountInput = screen.getByRole("spinbutton", { name: /number of cloth \/ garments/i }) as HTMLInputElement;
    const quantityInput = container.querySelector('[name="items.0.quantity"]') as HTMLInputElement;

    fireEvent.click(screen.getByRole("button", { name: /increase number of cloth/i }));
    expect(clothCountInput.value).toBe("2");
    expect(screen.getByText(/dress 2:/i)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /decrease number of cloth/i }));
    expect(clothCountInput.value).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: /increase quantity for dress 1/i }));
    expect(quantityInput.value).toBe("2");

    fireEvent.click(screen.getByRole("button", { name: /decrease quantity for dress 1/i }));
    expect(quantityInput.value).toBe("1");
  });

  it("starts stitching instructions blank", () => {
    render(<NewOrderForm />);

    expect((screen.getByLabelText(/stitching instructions/i) as HTMLTextAreaElement).value).toBe("");
  });

  it("adds and removes dynamic per-dress extra cost fields", () => {
    const { container } = render(<NewOrderForm />);

    fireEvent.click(screen.getByRole("button", { name: /add extra cost to dress 1/i }));

    expect(container.querySelector('[name="items.0.extraCosts.0.label"]')).toBeDefined();
    expect(container.querySelector('[name="items.0.extraCosts.0.amountRupees"]')).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /remove extra cost 1 from dress 1/i }));

    expect(container.querySelector('[name="items.0.extraCosts.0.label"]')).toBeNull();
  });

  it("shows typed extra cost labels as price rows in live totals", () => {
    const { container } = render(<NewOrderForm />);

    fireEvent.click(screen.getByRole("button", { name: /add extra cost to dress 1/i }));
    fireEvent.change(container.querySelector('[name="items.0.extraCosts.0.label"]') as HTMLInputElement, {
      target: { value: "Lace" }
    });
    fireEvent.change(container.querySelector('[name="items.0.extraCosts.0.amountRupees"]') as HTMLInputElement, {
      target: { value: "250" }
    });

    const liveTotals = screen.getByLabelText("Live totals");
    expect(liveTotals.textContent).toContain("Lace price");
    expect(liveTotals.textContent).toContain("₹250.00");
    expect(liveTotals.textContent).not.toContain("Extra costs");
  });

  it("keeps typed measurement values across rerenders", () => {
    const { container, rerender } = render(<NewOrderForm nextReceiptNumber="SJD-2026-000011" />);
    const lengthInput = container.querySelector('[name="measurement.length"]') as HTMLInputElement;

    fireEvent.change(lengthInput, { target: { value: "37.5" } });
    rerender(<NewOrderForm nextReceiptNumber="SJD-2026-000012" />);

    expect((container.querySelector('[name="measurement.length"]') as HTMLInputElement).value).toBe("37.5");
  });

  it("keeps typed item costs across rerenders", () => {
    const { container, rerender } = render(<NewOrderForm nextReceiptNumber="SJD-2026-000011" />);
    const fabricInput = container.querySelector('[name="items.0.fabricPriceRupees"]') as HTMLInputElement;
    const dyeInput = container.querySelector('[name="items.0.dyePriceRupees"]') as HTMLInputElement;

    fireEvent.change(fabricInput, { target: { value: "650" } });
    fireEvent.change(dyeInput, { target: { value: "125" } });
    rerender(<NewOrderForm nextReceiptNumber="SJD-2026-000012" />);

    expect((container.querySelector('[name="items.0.fabricPriceRupees"]') as HTMLInputElement).value).toBe("650");
    expect((container.querySelector('[name="items.0.dyePriceRupees"]') as HTMLInputElement).value).toBe("125");
  });

  it("adds a measurement section break after crotch", () => {
    render(<NewOrderForm />);

    expect(screen.getAllByTestId("measurement-section-break").length).toBeGreaterThan(0);
  });

  it("shows the server-provided next receipt number with calendar date inputs", () => {
    render(
      <NewOrderForm
        nextReceiptNumber="SJD-2026-000011"
        orderDate="2026-07-02"
        deliveryDate="2026-07-02"
      />
    );

    expect((screen.getByLabelText(/receipt number/i) as HTMLInputElement).value).toBe("SJD-2026-000011");
    const orderDateInput = screen.getByLabelText(/^order date$/i) as HTMLInputElement;
    const deliveryDateInput = screen.getByLabelText(/^delivery date$/i) as HTMLInputElement;

    expect(orderDateInput.type).toBe("date");
    expect(deliveryDateInput.type).toBe("date");
    expect(orderDateInput.value).toBe("2026-07-02");
    expect(deliveryDateInput.value).toBe("2026-07-02");
  });

  it("searches returning customers by phone or name and applies their contact and measurements", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          matches: [
            {
              id: "customer-1",
              customerCode: "CUST-1",
              fullName: "Rachna",
              phonePrimary: "9876543210",
              measurements: [
                {
                  id: "measurement-length",
                  fieldKey: "length",
                  displayCode: "L",
                  displayLabel: "Length",
                  value: "44",
                  unit: "in",
                  sortOrder: 1
                }
              ]
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const { container } = render(<NewOrderForm />);

    fireEvent.change(screen.getByLabelText(/search saved customer by name or phone/i), {
      target: { value: "9876543210" }
    });

    await waitFor(() => expect(screen.getByLabelText(/returning customer suggestions/i)).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/customers/search?q=9876543210");
    expect((screen.getByLabelText(/search or customer name/i) as HTMLInputElement).value).toBe("Rachna");
    expect((screen.getByLabelText(/phone number/i) as HTMLInputElement).value).toBe("9876543210");
    expect((container.querySelector('[name="measurement.length"]') as HTMLInputElement).value).toBe("44");
  });
});
