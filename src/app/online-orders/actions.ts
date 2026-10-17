"use server";

import { revalidatePath } from "next/cache";
import { updateOnlineOrder, type OnlineOrderStatus, type OnlinePaymentStatus } from "@/services/online-orders/online-order-service";

export async function updateOnlineOrderAction(
  orderNumber: string,
  changes: { status?: OnlineOrderStatus; payment_status?: OnlinePaymentStatus; payment_notes?: string }
) {
  const order = await updateOnlineOrder(orderNumber, changes);
  revalidatePath("/online-orders");
  revalidatePath(`/online-orders/${orderNumber}`);
  return order;
}
