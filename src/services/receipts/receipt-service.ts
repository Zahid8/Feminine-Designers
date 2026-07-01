import type { ReceiptType } from "@/types/domain";
import { getOrderById } from "@/services/orders/order-service";
import { getStoreSettings } from "@/services/settings/settings-service";
export { receiptFileName } from "@/lib/utils/receipt-file-name";

export async function getReceiptData(orderId: string, type: ReceiptType) {
  const [order, settings] = await Promise.all([getOrderById(orderId), getStoreSettings()]);
  if (!order) return undefined;
  return { order, settings, type };
}
