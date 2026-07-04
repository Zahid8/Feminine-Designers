"use client";

import { useState } from "react";
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

export function EditOrderChoiceFields({
  status,
  paymentStatus
}: {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(status);
  const [paymentOverride, setPaymentOverride] = useState<Extract<PaymentStatus, "Paid" | "Unpaid"> | "">("");
  const visiblePaymentStatus = paymentOverride || paymentStatus;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <input type="hidden" name="status" value={selectedStatus} />
      {paymentOverride ? <input type="hidden" name="paymentStatus" value={paymentOverride} /> : null}

      <div className="rounded-md border border-[#ead8c3] bg-gradient-to-br from-white to-[#fffaf4] p-4 shadow-sm">
        <p className="mb-3 text-sm font-bold text-[#4c1525]">Order status</p>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((choice) => (
            <label key={choice} className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#dfc5a8] bg-[#fff7ec] px-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={selectedStatus === choice}
                onChange={(event) => setSelectedStatus(event.target.checked ? choice : fallbackStatus(choice))}
                className="h-4 w-4"
              />
              {choice}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-[#ead8c3] bg-gradient-to-br from-white to-[#fffaf4] p-4 shadow-sm">
        <p className="mb-3 text-sm font-bold text-[#4c1525]">Payment status</p>
        <div className="flex flex-wrap gap-2">
          {paymentChoices.map((choice) => (
            <label key={choice.value} className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#dfc5a8] bg-[#fff7ec] px-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={visiblePaymentStatus === choice.value}
                onChange={(event) => {
                  if (event.target.checked) setPaymentOverride(choice.value);
                }}
                className="h-4 w-4"
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
