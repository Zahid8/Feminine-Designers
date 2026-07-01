import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReceiptHtml } from "@/components/receipts/receipt-html";
import { STORE_SETTINGS } from "@/lib/constants/business";
import { orders } from "@/lib/data/mock";

describe("ReceiptHtml note visibility", () => {
  it("shows stitching instructions, special notes, and internal notes on store copies only", () => {
    render(<ReceiptHtml order={orders[0]} settings={STORE_SETTINGS} type="store" />);

    expect(screen.getByText("Princess cut, padded, lining required")).toBeDefined();
    expect(screen.getByText(/Special Notes: Keep front length exact/i)).toBeDefined();
    expect(screen.getByText(/Internal: Customer wants trial call before final hemming/i)).toBeDefined();
    expect(screen.queryByText(/Please collect after 4 PM/i)).toBeNull();
  });

  it("shows customer notes on customer copies only", () => {
    render(<ReceiptHtml order={orders[0]} settings={STORE_SETTINGS} type="customer" />);

    expect(screen.getByText(/Customer Notes: Please collect after 4 PM/i)).toBeDefined();
    expect(screen.queryByText("Princess cut, padded, lining required")).toBeNull();
    expect(screen.queryByText(/Special Notes: Keep front length exact/i)).toBeNull();
    expect(screen.queryByText(/Internal: Customer wants trial call before final hemming/i)).toBeNull();
  });
});

