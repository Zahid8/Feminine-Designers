"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { setOrderPaymentStatusAction, setOrderStageAction } from "@/app/orders/[id]/actions";
import { ORDER_STATUSES } from "@/lib/constants/business";
import type { OrderStatus, PaymentStatus } from "@/types/domain";
import { useToast } from "@/components/ui/toast";

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
  const toast = useToast();
  const [pending, setPending] = useState("");

  function updateStage(nextStatus: OrderStatus) {
    setPending(`stage-${nextStatus}`);
    startTransition(() => {
      const previousStatus = status;
      void setOrderStageAction(orderId, nextStatus)
        .then(() => {
          router.refresh();
          toast.show({
            message: `Order moved to ${nextStatus}.`,
            action: { label: "Undo", onAction: () => setOrderStageAction(orderId, previousStatus).then(() => router.refresh()) }
          });
        })
        .catch((error) => toast.show({ tone: "error", message: error instanceof Error ? error.message : "Could not update the order stage." }))
        .finally(() => setPending(""));
    });
  }

  function updatePayment(nextStatus: Extract<PaymentStatus, "Paid" | "Unpaid">) {
    setPending(`payment-${nextStatus}`);
    startTransition(() => {
      void setOrderPaymentStatusAction(orderId, nextStatus)
        .then(() => {
          router.refresh();
          toast.show({ message: nextStatus === "Paid" ? "Order marked paid." : "Order marked not paid." });
        })
        .catch((error) => toast.show({ tone: "error", message: error instanceof Error ? error.message : "Could not update payment." }))
        .finally(() => setPending(""));
    });
  }

  return (
    <div className="grid gap-3 rounded-xl border border-line bg-cream p-3 shadow-pressed">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted">Order status</p>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((choice) => (
            <label key={choice} className="inline-flex min-h-8 items-center gap-2 rounded-xl border border-line-strong bg-surface px-2 text-xs font-semibold shadow-raised-sm">
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
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted">Payment status</p>
        <div className="flex flex-wrap gap-2">
          {paymentChoices.map((choice) => (
            <label key={choice.value} className="inline-flex min-h-8 items-center gap-2 rounded-xl border border-line-strong bg-surface px-2 text-xs font-semibold shadow-raised-sm">
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
            <span className="inline-flex min-h-8 items-center rounded-xl border border-amber-200 bg-amber-50 px-2 text-xs font-semibold text-amber-800">
              Current: {paymentStatus}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
