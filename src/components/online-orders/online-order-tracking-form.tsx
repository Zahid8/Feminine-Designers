"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateOnlineOrderAction } from "@/app/online-orders/actions";
import { COURIERS, courierTrackingUrl, FULFILMENT_STAGES, type OnlineOrder } from "@/services/online-orders/online-order-service";

/** Courier, AWB, tracking link and expected delivery — what the customer sees on their order page. */
export function OnlineOrderTrackingForm({ order }: { order: OnlineOrder }) {
  const router = useRouter();
  const toast = useToast();
  const t = order.tracking;
  const [courier, setCourier] = useState(t?.courier ?? "");
  const [awb, setAwb] = useState(t?.number ?? "");
  const [url, setUrl] = useState(t?.url ?? "");
  const [urlTouched, setUrlTouched] = useState(Boolean(t?.url));
  const [eta, setEta] = useState(t?.expected_delivery ?? "");
  const [pending, setPending] = useState(false);
  const beforeShipped = FULFILMENT_STAGES.indexOf(order.status) < FULFILMENT_STAGES.indexOf("shipped") && order.status !== "cancelled";
  const autoUrl = courierTrackingUrl(courier, awb);
  const finalUrl = urlTouched ? url : autoUrl || url;
  const dirty =
    courier !== (t?.courier ?? "") || awb !== (t?.number ?? "") || finalUrl !== (t?.url ?? "") || eta !== (t?.expected_delivery ?? "");

  function save(markShipped: boolean) {
    if (finalUrl && !/^https?:\/\//.test(finalUrl)) {
      toast.show({ tone: "error", message: "Tracking link must start with https://" });
      return;
    }
    setPending(true);
    startTransition(() => {
      void updateOnlineOrderAction(order.order_number, {
        courier: courier.trim(),
        tracking_number: awb.trim(),
        tracking_url: finalUrl.trim(),
        expected_delivery: eta || null,
        ...(markShipped ? { status: "shipped" as const } : {})
      })
        .then(() => {
          router.refresh();
          toast.show({ message: markShipped ? `${order.order_number} marked shipped with tracking.` : "Tracking saved — the customer can see it now." });
        })
        .catch((error) => toast.show({ tone: "error", message: error instanceof Error ? error.message : "Could not save tracking." }))
        .finally(() => setPending(false));
    });
  }

  if (!t) {
    return <p className="text-sm text-muted-strong">Update the webstore to enter courier tracking from here.</p>;
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Courier">
          <Input list="fd-couriers" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. Delhivery" disabled={pending} />
          <datalist id="fd-couriers">
            {COURIERS.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
        </Field>
        <Field label="AWB / tracking number">
          <Input value={awb} onChange={(e) => setAwb(e.target.value)} placeholder="e.g. 1490 2210 5582" disabled={pending} />
        </Field>
        <Field label="Tracking link" hint={autoUrl && !urlTouched ? "Filled from the courier and AWB." : "Courier page where the customer can follow the parcel."}>
          <Input
            type="url"
            value={finalUrl}
            onChange={(e) => {
              setUrl(e.target.value);
              setUrlTouched(true);
            }}
            placeholder="https://"
            disabled={pending}
          />
        </Field>
        <Field label="Expected delivery">
          <Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} disabled={pending} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        {beforeShipped ? (
          <Button type="button" onClick={() => save(true)} disabled={pending || !awb.trim()}>
            <Truck className="h-4 w-4" aria-hidden />
            {pending ? "Saving…" : "Save & mark shipped"}
          </Button>
        ) : null}
        <Button type="button" variant={beforeShipped ? "secondary" : undefined} onClick={() => save(false)} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save tracking"}
        </Button>
      </div>
    </div>
  );
}
