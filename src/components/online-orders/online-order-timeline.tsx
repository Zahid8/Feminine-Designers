import { formatDateTime } from "@/lib/utils/date";
import { stageLabel, type OnlineOrderEvent } from "@/services/online-orders/online-order-service";

/** Dated history of the order's stages (the customer sees the same dates). */
export function OnlineOrderTimeline({ events }: { events: OnlineOrderEvent[] }) {
  if (!events.length) return <p className="text-sm text-muted-strong">No history yet.</p>;
  return (
    <ol className="grid gap-3">
      {events.map((event, index) => (
        <li key={`${event.status}-${event.at}-${index}`} className="flex gap-3">
          <span
            aria-hidden
            className={`mt-1 h-3 w-3 shrink-0 rounded-full ${event.status === "cancelled" ? "bg-danger" : index === events.length - 1 ? "bg-wine" : "bg-gold"}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-wine-ink">{event.status === "pending" && index === 0 ? "Order placed" : stageLabel(event.status, event.label)}</p>
            <p className="text-xs text-muted">
              {formatDateTime(event.at)}
              {event.note ? ` · ${event.note}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
