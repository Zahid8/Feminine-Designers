"use server";

import { revalidatePath } from "next/cache";
import {
  updateOnlineOrder,
  updateOnlineOrderRequest,
  type OnlineOrderChanges,
  type OnlineRequestStatus
} from "@/services/online-orders/online-order-service";

export async function updateOnlineOrderAction(orderNumber: string, changes: OnlineOrderChanges) {
  const order = await updateOnlineOrder(orderNumber, changes);
  revalidatePath("/online-orders");
  revalidatePath(`/online-orders/${orderNumber}`);
  return order;
}

export async function updateOnlineOrderRequestAction(
  orderNumber: string,
  requestId: number,
  changes: { status?: OnlineRequestStatus; staff_note?: string }
) {
  const order = await updateOnlineOrderRequest(orderNumber, requestId, changes);
  revalidatePath("/online-orders");
  revalidatePath(`/online-orders/${orderNumber}`);
  return order;
}
