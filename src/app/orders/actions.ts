"use server";

import { revalidatePath } from "next/cache";
import { updateOrderCompleted } from "@/services/orders/order-item-delivery-service";
import { settleOrderBalance } from "@/services/payments/payment-service";

export async function setOrderCompletedAction(orderId: string, completed: boolean) {
  await updateOrderCompleted(orderId, completed);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath(`/orders/${orderId}`);
}

export async function settleOrderBalanceAction(orderId: string) {
  await settleOrderBalance(orderId);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath(`/orders/${orderId}`);
}
