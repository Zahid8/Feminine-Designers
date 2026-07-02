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
import type { ReceiptType } from "@/types/domain";

async function extractPdfText(type: ReceiptType) {
  const buffer = await renderToBuffer(<ReceiptPdfDocument order={orders[0]} settings={STORE_SETTINGS} type={type} />);
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
