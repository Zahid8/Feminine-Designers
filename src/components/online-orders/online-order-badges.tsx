import type { OnlineOrderStatus, OnlinePaymentStatus } from "@/services/online-orders/online-order-service";
import { cn } from "@/lib/utils/cn";

const statusClasses: Record<OnlineOrderStatus, string> = {
  pending: "bg-[#e6effc] text-[#24548f]",
  confirmed: "bg-[#fdebc8] text-[#8a4f00]",
  processing: "bg-[#fdebc8] text-[#8a4f00]",
  shipped: "bg-[#dcf2e5] text-success",
  completed: "bg-[#e2f2db] text-[#2f6d1f]",
  cancelled: "bg-[#fbe3e1] text-danger"
};

const paymentClasses: Record<OnlinePaymentStatus, string> = {
  pending: "bg-red-100 text-red-800",
  awaiting_review: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-blue-100 text-blue-800"
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
  return <Badge className={statusClasses[status] ?? "bg-stone-100 text-stone-700"}>{label}</Badge>;
}

export function OnlinePaymentBadge({ status, label }: { status: OnlinePaymentStatus; label: string }) {
  return <Badge className={paymentClasses[status] ?? "bg-stone-100 text-stone-700"}>{label}</Badge>;
}

export function MadeToMeasureBadge() {
  return <Badge className="bg-blush text-wine">Made to measure</Badge>;
}
