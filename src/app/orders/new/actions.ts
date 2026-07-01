"use server";

import { revalidatePath } from "next/cache";
import { parseOrderFormData } from "@/services/orders/order-form-parser";
import { saveParsedOrder } from "@/services/orders/order-save-service";
import type { OrderActionState } from "@/services/orders/order-action-state";

export async function saveOrderAction(_: OrderActionState, formData: FormData): Promise<OrderActionState> {
  try {
    const parsed = parseOrderFormData(formData);
    const saved = await saveParsedOrder(parsed);
    revalidatePath("/orders");
    revalidatePath("/dashboard");
    revalidatePath("/customers");

    const redirectTo = parsed.intent === "print" ? `/receipts/${saved.orderId}/combined` : `/orders/${saved.orderId}`;
    return {
      status: "success",
      message:
        parsed.intent === "draft"
          ? "Draft saved."
          : parsed.intent === "print"
            ? "Order saved. Opening combined print preview."
            : "Order saved.",
      orderId: saved.orderId,
      receiptNumber: saved.receiptNumber,
      redirectTo
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not save the order."
    };
  }
}
