"use server";

import { revalidatePath } from "next/cache";
import { updateOrderCompleted } from "@/services/orders/order-item-delivery-service";
import { reversePayment, settleOrderBalance } from "@/services/payments/payment-service";

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

export async function reversePaymentAction(paymentId: string, orderId: string) {
  await reversePayment(paymentId);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath(`/orders/${orderId}`);
}
