import type { OrderItem, OrderStatus, Payment, PaymentStatus } from "@/types/domain";
import { clampPaise } from "@/lib/utils/money";

export interface DraftOrderItem {
  quantity: number;
  ratePaise: number;
  discountPaise?: number;
  stitchingCostPaise?: number;
}

export function calculateLineTotal(item: DraftOrderItem): number {
  const gross = clampPaise(item.quantity * item.ratePaise);
  const discount = clampPaise(item.discountPaise ?? 0);
  const stitchingCost = clampPaise(item.stitchingCostPaise ?? 0);
  return Math.max(0, gross - discount + stitchingCost);
}

export function calculatePaymentStatus(grandTotalPaise: number, totalPaidPaise: number): PaymentStatus {
  if (totalPaidPaise <= 0) return "Unpaid";
  if (totalPaidPaise === grandTotalPaise) return "Paid";
  if (totalPaidPaise > grandTotalPaise) return "Credit";
  return "Partial";
}

export function calculateOrderTotals(params: {
  items: DraftOrderItem[];
  accessoriesCostPaise?: number;
  stitchingCostPaise?: number;
  orderDiscountPaise?: number;
  cgstRate: number;
  sgstRate: number;
  payments?: Pick<Payment, "amountPaise">[];
}) {
  const itemLineTotals = params.items.map(calculateLineTotal);
  const accessoriesCostPaise = clampPaise(params.accessoriesCostPaise ?? 0);
  const itemStitchingCostPaise = params.items.reduce((sum, item) => sum + clampPaise(item.stitchingCostPaise ?? 0), 0);
  const stitchingCostPaise = itemStitchingCostPaise + clampPaise(params.stitchingCostPaise ?? 0);
  const itemsSubtotalPaise = itemLineTotals.reduce((sum, total) => sum + total, 0);
  const subtotalPaise = itemsSubtotalPaise + accessoriesCostPaise + clampPaise(params.stitchingCostPaise ?? 0);
  const rawItemDiscount = params.items.reduce((sum, item) => sum + clampPaise(item.discountPaise ?? 0), 0);
  const orderDiscountPaise = Math.min(clampPaise(params.orderDiscountPaise ?? 0), subtotalPaise);
  const taxableAmountPaise = Math.max(0, subtotalPaise - orderDiscountPaise);
  const cgstAmountPaise = clampPaise(taxableAmountPaise * (params.cgstRate / 100));
  const sgstAmountPaise = clampPaise(taxableAmountPaise * (params.sgstRate / 100));
  const grandTotalPaise = taxableAmountPaise + cgstAmountPaise + sgstAmountPaise;
  const totalPaidPaise = (params.payments ?? []).reduce((sum, payment) => sum + clampPaise(payment.amountPaise), 0);
  const balanceDuePaise = grandTotalPaise - totalPaidPaise;

  return {
    subtotalPaise,
    itemDiscountTotalPaise: rawItemDiscount,
    orderDiscountPaise,
    accessoriesCostPaise,
    stitchingCostPaise,
    taxableAmountPaise,
    cgstRate: params.cgstRate,
    cgstAmountPaise,
    sgstRate: params.sgstRate,
    sgstAmountPaise,
    grandTotalPaise,
    totalPaidPaise,
    balanceDuePaise,
    paymentStatus: calculatePaymentStatus(grandTotalPaise, totalPaidPaise)
  };
}

export function attachLineTotals<T extends DraftOrderItem>(items: T[]): (T & Pick<OrderItem, "lineTotalPaise">)[] {
  return items.map((item) => ({ ...item, lineTotalPaise: calculateLineTotal(item) }));
}

export function isOrderOverdue(deliveryDate: string, status: OrderStatus, today = new Date()): boolean {
  if (status === "Delivered" || status === "Cancelled") return false;
  const delivery = new Date(`${deliveryDate}T23:59:59`);
  return delivery.getTime() < today.getTime();
}

export function daysOverdue(deliveryDate: string, status: OrderStatus, today = new Date()): number {
  if (!isOrderOverdue(deliveryDate, status, today)) return 0;
  const delivery = new Date(`${deliveryDate}T00:00:00`);
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((current.getTime() - delivery.getTime()) / 86_400_000);
}
