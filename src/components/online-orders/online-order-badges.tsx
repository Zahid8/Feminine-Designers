import { Ruler, Shirt } from "lucide-react";
import {
  ORDER_TYPE_LABELS,
  stageLabel,
  type OnlineOrderStatus,
  type OnlineOrderType,
  type OnlinePaymentStatus
} from "@/services/online-orders/online-order-service";
import { cn } from "@/lib/utils/cn";

const statusClasses: Record<OnlineOrderStatus, string> = {
  pending: "bg-[#e6effc] text-[#24548f]",
  confirmed: "bg-[#fdebc8] text-[#8a4f00]",
  processing: "bg-[#fdebc8] text-[#8a4f00]",
  shipped: "bg-[#e7e5fb] text-[#4338ca]",
  delivered: "bg-[#d9f0ee] text-[#0f766e]",
  completed: "bg-[#dcf2e5] text-success",
  cancelled: "bg-[#fbe3e1] text-danger"
};

const paymentClasses: Record<OnlinePaymentStatus, string> = {
  pending: "bg-red-100 text-red-800",
  awaiting_review: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-blue-100 text-blue-800"
};

const typeClasses: Record<OnlineOrderType, string> = {
  ready_made: "bg-[#f3ead9] text-bronze",
  made_to_measure: "bg-blush text-wine",
  mixed: "bg-peach text-wine-ink"
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

export function OnlineStatusBadge({ status, label }: { status: OnlineOrderStatus; label: string }) {
  return <Badge className={statusClasses[status] ?? "bg-stone-100 text-stone-700"}>{stageLabel(status, label)}</Badge>;
}

export function OnlinePaymentBadge({ status, label }: { status: OnlinePaymentStatus; label: string }) {
  return <Badge className={paymentClasses[status] ?? "bg-stone-100 text-stone-700"}>{label}</Badge>;
}

/** Whole-order type: Ready-made, Custom size, or both. */
export function OrderTypeBadge({ type }: { type: OnlineOrderType }) {
  const Icon = type === "ready_made" ? Shirt : Ruler;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", typeClasses[type])}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {ORDER_TYPE_LABELS[type]}
    </span>
  );
}

/** Per-item fit: Ready-made or Custom size. */
export function ItemFitBadge({ custom }: { custom: boolean }) {
  return <OrderTypeBadge type={custom ? "made_to_measure" : "ready_made"} />;
}

export function MadeToMeasureBadge() {
  return <OrderTypeBadge type="made_to_measure" />;
}
