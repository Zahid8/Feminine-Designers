"use server";

import { revalidatePath } from "next/cache";
import { updateAllOrderItemsDelivered, updateOrderItemDelivered } from "@/services/orders/order-item-delivery-service";
import { deleteOrderById } from "@/services/orders/order-delete-service";

export async function setOrderItemDeliveredAction(orderId: string, itemId: string, delivered: boolean) {
  await updateOrderItemDelivered(itemId, delivered);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

export async function setAllOrderItemsDeliveredAction(orderId: string, delivered: boolean) {
  await updateAllOrderItemsDelivered(orderId, delivered);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

export async function deleteOrderAction(orderId: string) {
  await deleteOrderById(orderId);
  revalidatePath("/orders");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
}
