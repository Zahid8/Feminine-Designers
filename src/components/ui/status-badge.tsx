import type { OrderStatus, PaymentStatus, Priority } from "@/types/domain";
import { cn } from "@/lib/utils/cn";

const statusClasses: Record<OrderStatus, string> = {
  Draft: "bg-stone-100 text-stone-700 border-stone-300",
  New: "bg-[#eef5ff] text-[#24548f] border-[#bfd5f5]",
  "In Stitching": "bg-[#fff2d8] text-[#8a4f00] border-[#efc77e]",
  Ready: "bg-[#e8f7ef] text-[#12633d] border-[#a9dec2]",
  Delivered: "bg-[#e5f6df] text-[#2f6d1f] border-[#b9dfa9]",
  Cancelled: "bg-[#fff0ef] text-[#a83232] border-[#efb7b2]"
};

const priorityClasses: Record<Priority, string> = {
  Normal: "bg-stone-50 text-stone-700 border-stone-200",
  Urgent: "bg-orange-50 text-orange-800 border-orange-200",
  Express: "bg-red-50 text-red-800 border-red-200"
};

const paymentClasses: Record<PaymentStatus, string> = {
  Unpaid: "bg-red-50 text-red-800 border-red-200",
  Partial: "bg-amber-50 text-amber-800 border-amber-200",
  Paid: "bg-green-50 text-green-800 border-green-200",
  Credit: "bg-blue-50 text-blue-800 border-blue-200"
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
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm ring-1 ring-white/70", className)}>
      {children}
    </span>
  );
}
