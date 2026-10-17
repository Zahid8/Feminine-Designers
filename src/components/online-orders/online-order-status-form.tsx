"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { stageLabel, type OnlineOrder, type OnlineOrderStatus, type OnlinePaymentStatus } from "@/services/online-orders/online-order-service";
import { updateOnlineOrderAction } from "@/app/online-orders/actions";

export function OnlineOrderStatusForm({
  order,
  statuses,
  paymentStatuses,
  compact = false
}: {
  order: OnlineOrder;
  statuses: { value: OnlineOrderStatus; label: string }[];
  paymentStatuses: { value: OnlinePaymentStatus; label: string }[];
  compact?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<OnlineOrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<OnlinePaymentStatus>(order.payment_status);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const dirty = status !== order.status || paymentStatus !== order.payment_status || notes.trim() !== "";

  function save() {
    setPending(true);
    startTransition(() => {
      void updateOnlineOrderAction(order.order_number, {
        ...(status !== order.status ? { status } : {}),
        ...(paymentStatus !== order.payment_status ? { payment_status: paymentStatus } : {}),
        ...(notes.trim() ? { payment_notes: notes.trim() } : {})
      })
        .then(() => {
          setNotes("");
          router.refresh();
          toast.show({ message: `${order.order_number} updated on the webstore.` });
        })
        .catch((error) => toast.show({ tone: "error", message: error instanceof Error ? error.message : "Could not update the order." }))
        .finally(() => setPending(false));
    });
  }

  return (
    <div className={compact ? "grid gap-2" : "grid gap-3 md:grid-cols-[1fr_1fr_auto]"}>
      <Field label="Order stage">
        <Select value={status} onChange={(event) => setStatus(event.target.value as OnlineOrderStatus)} disabled={pending}>
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {stageLabel(item.value, item.label)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Payment">
        <Select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as OnlinePaymentStatus)} disabled={pending}>
          {paymentStatuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>
      {!compact ? (
        <div className="flex items-end">
          <Button type="button" onClick={save} disabled={!dirty || pending}>
            {pending ? "Saving…" : "Update"}
          </Button>
        </div>
      ) : null}
      {!compact ? (
        <div className="md:col-span-3">
          <Field label="Payment note (optional)" hint="Saved on the webstore order, e.g. UPI reference or who verified the screenshot.">
            <Textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} disabled={pending} />
          </Field>
        </div>
      ) : (
        <Button type="button" onClick={save} disabled={!dirty || pending} className="w-full">
          {pending ? "Saving…" : "Update"}
        </Button>
      )}
    </div>
  );
}
