import { notFound } from "next/navigation";
import type { ReceiptType } from "@/types/domain";
import { ReceiptHtml } from "@/components/receipts/receipt-html";
import { getReceiptData } from "@/services/receipts/receipt-service";

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
  return <ReceiptHtml order={data.order} settings={data.settings} type={data.type} />;
}
