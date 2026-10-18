"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateOnlineOrderRequestAction } from "@/app/online-orders/actions";
import { formatDateTime } from "@/lib/utils/date";
import type { OnlineOrderRequest, OnlineRequestStatus } from "@/services/online-orders/online-order-service";

function RequestCard({ orderNumber, request, statuses }: { orderNumber: string; request: OnlineOrderRequest; statuses: { value: OnlineRequestStatus; label: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<OnlineRequestStatus>(request.status);
  const [reply, setReply] = useState("");
  const [pending, setPending] = useState(false);
  const dirty = status !== request.status || reply.trim() !== "";
  const open = request.status === "requested";

  function save() {
    setPending(true);
    startTransition(() => {
      void updateOnlineOrderRequestAction(orderNumber, request.id, {
        ...(status !== request.status ? { status } : {}),
        ...(reply.trim() ? { staff_note: reply.trim() } : {})
      })
        .then(() => {
          setReply("");
          router.refresh();
          toast.show({ message: "Request updated — the customer sees your reply on their order page." });
        })
        .catch((error) => toast.show({ tone: "error", message: error instanceof Error ? error.message : "Could not update the request." }))
        .finally(() => setPending(false));
    });
  }

  return (
    <div className={`rounded-2xl border p-4 ${open ? "border-gold bg-cream" : "border-line-soft bg-paper"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-wine-ink">{request.kind_label}</p>
          <p className="text-xs text-muted">
            {formatDateTime(request.created_at)} · {request.reason}
          </p>
        </div>
        <span className="rounded-full bg-peach px-2.5 py-1 text-xs font-bold text-wine-ink">{request.status_label}</span>
      </div>
      <p className="mt-2 text-sm">
        <span className="font-semibold">Items:</span> {request.items.join(", ")}
        {request.preferred_size ? (
          <>
            {" "}
            · <span className="font-semibold">Size wanted:</span> {request.preferred_size}
          </>
        ) : null}
      </p>
      {request.details ? <p className="mt-1 whitespace-pre-line text-sm italic text-muted-strong">“{request.details}”</p> : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-[12rem_1fr]">
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as OnlineRequestStatus)} disabled={pending}>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reply to customer (optional)">
          <Textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="e.g. Pickup on Monday, please keep the tags on." disabled={pending} />
        </Field>
      </div>
      <Button type="button" className="mt-2" onClick={save} disabled={!dirty || pending}>
        {pending ? "Saving…" : "Update request"}
      </Button>
    </div>
  );
}

export function OnlineOrderRequests({ orderNumber, requests, statuses }: { orderNumber: string; requests: OnlineOrderRequest[]; statuses: { value: OnlineRequestStatus; label: string }[] }) {
  return (
    <div className="grid gap-3">
      {requests.map((r) => (
        <RequestCard key={r.id} orderNumber={orderNumber} request={r} statuses={statuses} />
      ))}
    </div>
  );
}
