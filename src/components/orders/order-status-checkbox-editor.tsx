"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { setOrderPaymentStatusAction, setOrderStageAction } from "@/app/orders/[id]/actions";
import { ORDER_STATUSES } from "@/lib/constants/business";
import type { OrderStatus, PaymentStatus } from "@/types/domain";

const paymentChoices: Array<{ label: string; value: Extract<PaymentStatus, "Paid" | "Unpaid"> }> = [
  { label: "Not paid", value: "Unpaid" },
  { label: "Paid", value: "Paid" }
];

function fallbackStatus(status: OrderStatus): OrderStatus {
  if (status === "Delivered") return "Ready";
  if (status === "Ready") return "In Stitching";
  if (status === "Cancelled") return "New";
  return "New";
}

export function OrderStatusCheckboxEditor({
  orderId,
  status,
  paymentStatus
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState("");

  function updateStage(nextStatus: OrderStatus) {
    setPending(`stage-${nextStatus}`);
    startTransition(() => {
      void setOrderStageAction(orderId, nextStatus)
        .then(() => router.refresh())
        .finally(() => setPending(""));
    });
  }

  function updatePayment(nextStatus: Extract<PaymentStatus, "Paid" | "Unpaid">) {
    setPending(`payment-${nextStatus}`);
    startTransition(() => {
      void setOrderPaymentStatusAction(orderId, nextStatus)
        .then(() => router.refresh())
        .finally(() => setPending(""));
    });
  }

  return (
    <div className="grid gap-3 rounded-md border border-[#eadfce] bg-[#fffdf8] p-3">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#7c6d66]">Order status</p>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((choice) => (
            <label key={choice} className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#d8c7b4] bg-white px-2 text-xs font-semibold">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={status === choice}
                disabled={Boolean(pending)}
                onChange={(event) => updateStage(event.target.checked ? choice : fallbackStatus(choice))}
              />
              {choice}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#7c6d66]">Payment status</p>
        <div className="flex flex-wrap gap-2">
          {paymentChoices.map((choice) => (
            <label key={choice.value} className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#d8c7b4] bg-white px-2 text-xs font-semibold">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={paymentStatus === choice.value}
                disabled={Boolean(pending)}
                onChange={(event) => {
                  if (event.target.checked) updatePayment(choice.value);
                }}
              />
              {choice.label}
            </label>
          ))}
          {paymentStatus === "Partial" || paymentStatus === "Credit" ? (
            <span className="inline-flex min-h-8 items-center rounded-md border border-amber-200 bg-amber-50 px-2 text-xs font-semibold text-amber-800">
              Current: {paymentStatus}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
