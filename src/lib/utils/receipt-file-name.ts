import type { ReceiptType } from "@/types/domain";

export function receiptFileName(type: ReceiptType, receiptNumber = "DRAFT") {
  const prefix = type === "customer" ? "Customer_Copy" : type === "store" ? "Store_Copy" : "Combined_Print";
  return `${prefix}_${receiptNumber}.pdf`;
}
