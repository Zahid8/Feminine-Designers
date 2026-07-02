"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateAllOrderItemsDelivered, updateOrderItemDelivered } from "@/services/orders/order-item-delivery-service";
import { deleteOrderById } from "@/services/orders/order-delete-service";
import { updateOrderFromForm } from "@/services/orders/order-edit-service";
import { getOrderById } from "@/services/orders/order-service";
import { updateOrderStage } from "@/services/orders/order-status-service";
import { setOrderPaymentStatus } from "@/services/payments/payment-service";
import type { OrderStatus, PaymentStatus } from "@/types/domain";

function lastFormValue(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string" && value.trim() !== "")
    .at(-1);
}

function revalidateOrderSurfaces(orderId: string) {
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/receipts/${orderId}/customer`);
  revalidatePath(`/receipts/${orderId}/store`);
  revalidatePath(`/receipts/${orderId}/combined`);
  revalidatePath("/orders");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
}

export async function setOrderItemDeliveredAction(orderId: string, itemId: string, delivered: boolean) {
  await updateOrderItemDelivered(orderId, itemId, delivered);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function setAllOrderItemsDeliveredAction(orderId: string, delivered: boolean) {
  await updateAllOrderItemsDelivered(orderId, delivered);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function deleteOrderAction(orderId: string) {
  try {
    await deleteOrderById(orderId);
    revalidatePath("/orders");
    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not delete order."
    };
  }
}

export async function updateOrderAction(orderId: string, formData: FormData) {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error("Order was not found.");
  }

  await updateOrderFromForm(order, formData);
  const paymentStatus = lastFormValue(formData, "paymentStatus") as PaymentStatus | undefined;
  if (paymentStatus === "Paid" || paymentStatus === "Unpaid") {
    await setOrderPaymentStatus(orderId, paymentStatus);
  }

  revalidateOrderSurfaces(orderId);
  redirect(`/orders/${orderId}?saved=1`);
}

export async function setOrderStageAction(orderId: string, status: OrderStatus) {
  await updateOrderStage(orderId, status);
  revalidateOrderSurfaces(orderId);
}

export async function setOrderPaymentStatusAction(orderId: string, status: Extract<PaymentStatus, "Paid" | "Unpaid">) {
  await setOrderPaymentStatus(orderId, status);
  revalidateOrderSurfaces(orderId);
}
