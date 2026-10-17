"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Check, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { updateOnlineOrderAction } from "@/app/online-orders/actions";
import { FULFILMENT_STAGES, nextStage, stageLabel, type OnlineOrderStatus } from "@/services/online-orders/online-order-service";

function StageIcon({ status }: { status: OnlineOrderStatus }) {
  if (status === "shipped") return <Truck className="h-4 w-4" aria-hidden />;
  if (status === "delivered" || status === "completed") return <PackageCheck className="h-4 w-4" aria-hidden />;
  return <Check className="h-4 w-4" aria-hidden />;
}

function useStageUpdate(orderNumber: string) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  function move(status: OnlineOrderStatus) {
    setPending(true);
    startTransition(() => {
      void updateOnlineOrderAction(orderNumber, { status })
        .then(() => {
          router.refresh();
          toast.show({ message: `${orderNumber} marked ${stageLabel(status).toLowerCase()}.` });
        })
        .catch((error) => toast.show({ tone: "error", message: error instanceof Error ? error.message : "Could not update the order." }))
        .finally(() => setPending(false));
    });
  }
  return { pending, move };
}

/** One-tap "Mark shipped / delivered / fulfilled" for table rows and cards. */
export function OnlineOrderNextStageButton({ orderNumber, status }: { orderNumber: string; status: OnlineOrderStatus }) {
  const { pending, move } = useStageUpdate(orderNumber);
  const next = nextStage(status);
  if (!next || status === "pending") return null;
  const label = `Mark ${stageLabel(next).toLowerCase()}`;
  return (
    <Button
      type="button"
      variant="secondary"
      className="min-h-9 whitespace-nowrap px-2.5 py-1.5"
      disabled={pending}
      onClick={() => move(next)}
      aria-label={label}
      title={label}
    >
      <StageIcon status={next} />
      <span className="hidden 2xl:inline">{pending ? "Saving…" : label}</span>
    </Button>
  );
}

/** Stage tracker for the order page: shows where the order is and moves it on. */
export function OnlineOrderStageActions({ orderNumber, status }: { orderNumber: string; status: OnlineOrderStatus }) {
  const { pending, move } = useStageUpdate(orderNumber);
  const current = FULFILMENT_STAGES.indexOf(status);
  const next = nextStage(status);

  if (status === "cancelled") {
    return <p className="rounded-2xl bg-[#fbe3e1] px-4 py-3 text-sm font-semibold text-danger">This order was cancelled.</p>;
  }

  return (
    <div className="grid gap-4">
      <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Order stages">
        {FULFILMENT_STAGES.map((stage, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={stage}>
              <button
                type="button"
                disabled={pending || active}
                onClick={() => move(stage)}
                aria-current={active ? "step" : undefined}
                title={active ? "Current stage" : `Set to ${stageLabel(stage)}`}
                className={cn(
                  "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition",
                  active && "bg-gradient-to-br from-wine to-rose text-white shadow-brand",
                  done && "bg-[#dcf2e5] text-success",
                  !active && !done && "bg-surface-sunken text-muted-strong shadow-pressed hover:text-wine"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                {stage === "pending" ? "Placed" : stageLabel(stage)}
              </button>
            </li>
          );
        })}
      </ol>
      {next ? (
        <Button type="button" onClick={() => move(next)} disabled={pending} className="justify-self-start">
          <StageIcon status={next} />
          {pending ? "Saving…" : `Mark as ${stageLabel(next).toLowerCase()}`}
        </Button>
      ) : (
        <p className="text-sm font-semibold text-success">Fulfilled — nothing left to do.</p>
      )}
    </div>
  );
}
