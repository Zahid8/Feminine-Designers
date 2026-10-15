import type { OrderStatus, PaymentStatus, Priority } from "@/types/domain";
import { deliveryUrgency, type DeliveryUrgencyTone } from "@/lib/calculations/status";
import { cn } from "@/lib/utils/cn";

const statusClasses: Record<OrderStatus, string> = {
  Draft: "bg-stone-100 text-stone-700",
  New: "bg-[#e6effc] text-[#24548f]",
  "In Stitching": "bg-[#fdebc8] text-[#8a4f00]",
  Ready: "bg-[#dcf2e5] text-success",
  Delivered: "bg-[#e2f2db] text-[#2f6d1f]",
  Cancelled: "bg-[#fbe3e1] text-danger"
};

const priorityClasses: Record<Priority, string> = {
  Normal: "bg-stone-100 text-stone-700",
  Urgent: "bg-orange-100 text-orange-800",
  Express: "bg-red-100 text-red-800"
};

const paymentClasses: Record<PaymentStatus, string> = {
  Unpaid: "bg-red-100 text-red-800",
  Partial: "bg-amber-100 text-amber-800",
  Paid: "bg-green-100 text-green-800",
  Credit: "bg-blue-100 text-blue-800"
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={statusClasses[status]}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge className={priorityClasses[priority]}>{priority}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge className={paymentClasses[status]}>{status}</Badge>;
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

const urgencyClasses: Record<DeliveryUrgencyTone, string> = {
  overdue: "bg-red-100 text-red-800",
  today: "bg-amber-100 text-amber-800",
  soon: "bg-orange-50 text-orange-800",
  later: "bg-stone-100 text-stone-600"
};

export function DeliveryUrgencyBadge({ deliveryDate, status, today }: { deliveryDate: string; status: OrderStatus; today: string }) {
  const urgency = deliveryUrgency(deliveryDate, status, today);
  if (!urgency) return null;
  return <Badge className={urgencyClasses[urgency.tone]}>{urgency.label}</Badge>;
}
