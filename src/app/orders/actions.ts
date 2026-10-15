"use server";

import { revalidatePath } from "next/cache";
import { updateOrderCompleted } from "@/services/orders/order-item-delivery-service";
import { reversePayment, settleOrderBalance } from "@/services/payments/payment-service";

export async function setOrderCompletedAction(orderId: string, completed: boolean) {
  await updateOrderCompleted(orderId, completed);
  revalidatePath("/board");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath(`/orders/${orderId}`);
}

export async function settleOrderBalanceAction(orderId: string) {
  const paymentId = await settleOrderBalance(orderId);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/board");
  return paymentId;
}

export async function reversePaymentAction(paymentId: string, orderId: string) {
  await reversePayment(paymentId);
  revalidatePath("/board");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath(`/orders/${orderId}`);
}
