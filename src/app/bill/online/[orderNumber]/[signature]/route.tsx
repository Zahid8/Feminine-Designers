import { renderToBuffer } from "@react-pdf/renderer";
import { OnlineReceiptPdfDocument } from "@/components/receipts/online-receipt-pdf";
import { onlineBillFileName } from "@/lib/online-orders/online-bill";
import { verifyOnlineBillLink } from "@/lib/receipts/bill-link";
import { getOnlineOrder } from "@/services/online-orders/online-order-service";
import { getStoreSettings } from "@/services/settings/settings-service";

/**
 * Public bill for an online (webstore) order: the signed link opens the PDF, no login.
 * Opens in the phone's PDF viewer; ?download=1 saves it instead.
 */
export async function GET(request: Request, { params }: { params: Promise<{ orderNumber: string; signature: string }> }) {
  const { orderNumber: raw, signature } = await params;
  const orderNumber = decodeURIComponent(raw);
  if (!verifyOnlineBillLink(orderNumber, signature)) return new Response("Not found", { status: 404 });
  let order;
  try {
    order = await getOnlineOrder(orderNumber);
  } catch {
    return new Response("This bill is temporarily unavailable. Please try again in a moment.", { status: 503 });
  }
  if (!order) return new Response("Not found", { status: 404 });
  const settings = await getStoreSettings();

  const buffer = await renderToBuffer(<OnlineReceiptPdfDocument order={order} settings={settings} />);
  const disposition = new URL(request.url).searchParams.has("download") ? "attachment" : "inline";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${onlineBillFileName(order.order_number)}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex"
    }
  });
}
