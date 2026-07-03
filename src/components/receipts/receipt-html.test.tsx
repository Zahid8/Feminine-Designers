import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReceiptHtml } from "@/components/receipts/receipt-html";
import { STORE_SETTINGS } from "@/lib/constants/business";
import { orders } from "@/lib/data/mock";
import { rupeesToPaise } from "@/lib/utils/money";

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

describe("ReceiptHtml extra cost labels", () => {
  it.each(["customer", "store", "combined"] as const)("shows custom extra cost labels as price lines on %s copies", (type) => {
    const order = {
      ...orders[0],
      items: [
        {
          ...orders[0].items[0],
          extraCostPaise: rupeesToPaise(850),
          extraCosts: [
            { id: "extra-1", label: "Lace", amountPaise: rupeesToPaise(250), sortOrder: 1 },
            { id: "extra-2", label: "Shantoon", amountPaise: rupeesToPaise(600), sortOrder: 2 }
          ]
        },
        ...orders[0].items.slice(1)
      ]
    };

    render(<ReceiptHtml order={order} settings={STORE_SETTINGS} type={type} />);

    expect(screen.getAllByText(/Lace price ₹250.00/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Shantoon price ₹600.00/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Extra: Lace ₹250.00/i)).toBeNull();
  });
});

describe("ReceiptHtml customer presentation", () => {
  it.each(["customer", "store", "combined"] as const)("uses an item summary instead of the horizontal cost table on %s copies", (type) => {
    const { container } = render(<ReceiptHtml order={orders[0]} settings={STORE_SETTINGS} type={type} />);
    const headings = Array.from(container.querySelectorAll("th")).map((heading) => heading.textContent?.trim());

    expect(screen.getAllByText("Item summary").length).toBeGreaterThan(0);
    expect(headings).not.toContain("Rate");
    expect(headings).not.toContain("Stitching");
    expect(headings).not.toContain("Fabric Price");
    expect(headings).not.toContain("Dye");
    expect(headings).not.toContain("Extra");
  });

  it.each(["customer", "combined"] as const)("shows only one customer receipt label on %s copies", (type) => {
    render(<ReceiptHtml order={orders[0]} settings={STORE_SETTINGS} type={type} />);

    expect(screen.getAllByText("Customer Receipt")).toHaveLength(1);
    expect(screen.queryAllByText("Customer Copy")).toHaveLength(0);
  });
});
