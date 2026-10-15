import { notFound } from "next/navigation";
import type { ReceiptType } from "@/types/domain";
import { ReceiptHtml } from "@/components/receipts/receipt-html";
import { getReceiptData } from "@/services/receipts/receipt-service";
import { billLinkPath } from "@/lib/receipts/bill-link";
import { requestOrigin } from "@/lib/http/request-origin";

const receiptTypes = new Set(["customer", "store", "combined"]);

export default async function ReceiptPreviewPage({
  params
}: {
  params: Promise<{ orderId: string; type: string }>;
}) {
  const { orderId, type } = await params;
  if (!receiptTypes.has(type)) notFound();
  const data = await getReceiptData(orderId, type as ReceiptType);
  if (!data) notFound();
  const path = billLinkPath(orderId);
  const billLinkUrl = path ? `${await requestOrigin()}${path}` : undefined;
  return <ReceiptHtml order={data.order} settings={data.settings} type={data.type} billLinkUrl={billLinkUrl} />;
}
