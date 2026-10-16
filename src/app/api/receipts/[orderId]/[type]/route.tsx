import { renderToBuffer } from "@react-pdf/renderer";
import { notFound } from "next/navigation";
import type { ReceiptType } from "@/types/domain";
import { ReceiptPdfDocument } from "@/components/receipts/receipt-pdf";
import { getReceiptData, receiptFileName } from "@/services/receipts/receipt-service";
import { imageSizeFromUrl } from "@/lib/pdf/image-size";

const receiptTypes = new Set(["customer", "store", "combined"]);

export async function GET(_: Request, { params }: { params: Promise<{ orderId: string; type: string }> }) {
  const { orderId, type } = await params;
  if (!receiptTypes.has(type)) notFound();
  const data = await getReceiptData(orderId, type as ReceiptType);
  if (!data) notFound();

  // Store and combined copies print the cloth photo; size its frame to the photo's shape.
  const clothSampleSize = data.type === "customer" ? undefined : await imageSizeFromUrl(data.order.clothSampleImageUrl);
  const buffer = await renderToBuffer(
    <ReceiptPdfDocument order={data.order} settings={data.settings} type={data.type} clothSampleSize={clothSampleSize} />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${receiptFileName(data.type, data.order.receiptNumber)}"`
    }
  });
}
