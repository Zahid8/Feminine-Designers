import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { ReceiptPdfDocument } from "@/components/receipts/receipt-pdf";
import { STORE_SETTINGS } from "@/lib/constants/business";
import { orders } from "@/lib/data/mock";
import { rupeesToPaise } from "@/lib/utils/money";
import type { ReceiptType } from "@/types/domain";

async function extractPdfText(type: ReceiptType, order = orders[0]) {
  const buffer = await renderToBuffer(<ReceiptPdfDocument order={order} settings={STORE_SETTINGS} type={type} />);
  const filePath = join(tmpdir(), `receipt-${type}-${randomUUID()}.pdf`);
  writeFileSync(filePath, buffer);

  try {
    return execFileSync("pdftotext", [filePath, "-"], { encoding: "utf8" });
  } finally {
    unlinkSync(filePath);
  }
}

describe("ReceiptPdfDocument delivery dates", () => {
  it("subtracts 3 days from the delivery date for the store copy PDF only", async () => {
    const storeText = await extractPdfText("store");
    const customerText = await extractPdfText("customer");

    expect(storeText).toContain("02/07/2026");
    expect(storeText).not.toContain("05/07/2026");
    expect(customerText).toContain("05/07/2026");
    expect(customerText).not.toContain("02/07/2026");
  });

  it("uses the adjusted date only in the store section of the combined PDF", async () => {
    const combinedText = await extractPdfText("combined");

    expect(combinedText).toContain("02/07/2026");
    expect(combinedText).toContain("05/07/2026");
  });
});

describe("ReceiptPdfDocument extra cost labels", () => {
  it.each(["customer", "store", "combined"] as const)("shows custom extra cost labels as price lines on %s copies", async (type) => {
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

    const text = await extractPdfText(type, order);

    expect(text).toContain("Lace price Rs. 250.00");
    expect(text).toMatch(/Shantoon price\s+Rs\. 600\.00/);
    expect(text).not.toContain("Extra: Lace Rs. 250.00");
  });
});

describe("ReceiptPdfDocument customer presentation", () => {
  it.each(["customer", "store", "combined"] as const)("uses an item summary instead of the horizontal cost table on %s copies", async (type) => {
    const text = await extractPdfText(type);

    expect(text).toContain("Item summary");
    expect(text).not.toMatch(/RATE\s+STITCHING\s+FABRIC\s+DYE\s+EXTRA\s+AMOUNT/);
  });
});
