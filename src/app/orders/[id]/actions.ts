"use server";

import { revalidatePath } from "next/cache";
import { updateAllOrderItemsDelivered, updateOrderItemDelivered } from "@/services/orders/order-item-delivery-service";
import { deleteOrderById } from "@/services/orders/order-delete-service";
import { updateOrderFromForm } from "@/services/orders/order-edit-service";
import { getOrderById } from "@/services/orders/order-service";

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
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/receipts/${orderId}/customer`);
  revalidatePath(`/receipts/${orderId}/store`);
  revalidatePath(`/receipts/${orderId}/combined`);
  revalidatePath("/orders");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
}
