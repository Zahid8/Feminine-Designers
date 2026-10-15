import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptPdfDocument } from "@/components/receipts/receipt-pdf";
import { verifyBillLink } from "@/lib/receipts/bill-link";
import { getReceiptData, receiptFileName } from "@/services/receipts/receipt-service";

/**
 * Public customer bill: the signed link opens the customer-copy PDF directly, no login.
 * Opens in the phone's PDF viewer; ?download=1 saves it instead.
 */
export async function GET(request: Request, { params }: { params: Promise<{ orderId: string; signature: string }> }) {
  const { orderId, signature } = await params;
  if (!verifyBillLink(orderId, signature)) return new Response("Not found", { status: 404 });
  const data = await getReceiptData(orderId, "customer");
  if (!data) return new Response("Not found", { status: 404 });

  const buffer = await renderToBuffer(<ReceiptPdfDocument order={data.order} settings={data.settings} type="customer" />);
  const disposition = new URL(request.url).searchParams.has("download") ? "attachment" : "inline";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${receiptFileName("customer", data.order.receiptNumber)}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex"
    }
  });
}
