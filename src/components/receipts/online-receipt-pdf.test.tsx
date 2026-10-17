import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { OnlineReceiptPdfDocument } from "@/components/receipts/online-receipt-pdf";
import { STORE_SETTINGS } from "@/lib/constants/business";
import { onlineOrder } from "@/lib/online-orders/online-order-fixture";

async function pdfText(order = onlineOrder()) {
  const buffer = await renderToBuffer(<OnlineReceiptPdfDocument order={order} settings={STORE_SETTINGS} />);
  const filePath = join(tmpdir(), `online-bill-${randomUUID()}.pdf`);
  writeFileSync(filePath, buffer);
  try {
    return execFileSync("pdftotext", [filePath, "-"], { encoding: "utf8" });
  } finally {
    unlinkSync(filePath);
  }
}

describe("OnlineReceiptPdfDocument", () => {
  it("shows the order, customer, items with fit and measurements, and the payment summary", async () => {
    const text = await pdfText();
    for (const expected of [
      STORE_SETTINGS.storeName,
      "ONLINE ORDER BILL",
      "FD-20261017-ABC123",
      "Asha Rao",
      "17/10/2026",
      "Confirmed",
      "Silk Blouse",
      "Size M",
      "Zari Blouse",
      "Custom size",
      "Chest 36 in",
      "12 MG Road, Pune",
      "Google Maps location: https://maps.app.goo.gl/AbC123",
      "₹4,700.00",
      "Balance"
    ]) {
      expect(text).toContain(expected);
    }
  });

  it("marks a paid order as settled", async () => {
    const text = await pdfText(onlineOrder({ payment_status: "paid", payment_status_label: "Paid", status: "completed", status_label: "Completed" }));
    expect(text).toContain("Fulfilled");
    expect(text).toContain("Manual UPI · Paid");
    expect(text).toMatch(/Balance\s+₹0\.00/);
  });
});
