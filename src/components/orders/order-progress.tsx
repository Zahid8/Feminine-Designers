import { Check, Scissors, PackageCheck, Sparkles, XCircle } from "lucide-react";
import type { OrderStatus } from "@/types/domain";
import { cn } from "@/lib/utils/cn";

const STEPS: { status: OrderStatus; label: string; icon: typeof Check }[] = [
  { status: "New", label: "Received", icon: Sparkles },
  { status: "In Stitching", label: "Stitching", icon: Scissors },
  { status: "Ready", label: "Ready", icon: Check },
  { status: "Delivered", label: "Delivered", icon: PackageCheck }
];

/** Read-only progress indicator; status changes still go through the editor below it. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
        <XCircle className="h-4 w-4" aria-hidden />
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = Math.max(0, STEPS.findIndex((step) => step.status === status));

  return (
    <ol aria-label="Order progress" className="grid grid-cols-4 gap-1">
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        const Icon = done ? Check : step.icon;
        return (
          <li key={step.status} aria-current={current ? "step" : undefined} className="relative flex flex-col items-center gap-1.5 text-center">
            {index > 0 ? (
              <span
                aria-hidden
                className={cn("absolute right-1/2 top-5 h-1 w-full -translate-y-1/2 rounded-full", index <= currentIndex ? "bg-gradient-to-r from-wine to-rose" : "bg-surface-sunken shadow-pressed")}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition",
                current && "bg-gradient-to-br from-wine to-rose text-white shadow-brand ring-4 ring-rose/15",
                done && "bg-wine text-white",
                !current && !done && "bg-surface text-muted shadow-raised-sm"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className={cn("text-xs font-semibold", current ? "text-wine" : done ? "text-wine-ink" : "text-muted")}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
