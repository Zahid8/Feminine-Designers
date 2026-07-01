"use server";

import { revalidatePath } from "next/cache";
import { updateOrderCompleted } from "@/services/orders/order-item-delivery-service";

export async function setOrderCompletedAction(orderId: string, completed: boolean) {
  await updateOrderCompleted(orderId, completed);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}
