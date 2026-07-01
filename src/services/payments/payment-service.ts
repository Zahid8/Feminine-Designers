import { orders } from "@/lib/data/mock";

export async function listPaymentsForOrder(orderId: string) {
  return orders.find((order) => order.id === orderId)?.payments ?? [];
}
