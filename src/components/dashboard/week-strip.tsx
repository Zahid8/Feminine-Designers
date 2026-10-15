"use client";

import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import type { DashboardDeliveryDay } from "@/lib/dashboard/dashboard-model";
import { summarizeGarments } from "@/lib/orders/garment-summary";
import { cardNavigationHandler } from "@/lib/ui/card-navigation";
import { cn } from "@/lib/utils/cn";
import { formatINR } from "@/lib/utils/money";

/** Seven-day delivery planner: tap a day to see what has to go out. */
const OVERDUE = "overdue";

export function WeekStrip({ week, overdue = [] }: { week: DashboardDeliveryDay[]; overdue?: DashboardDeliveryDay["orders"] }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() =>
    week[0]?.orders.length ? week[0].date : overdue.length ? OVERDUE : (week.find((day) => day.orders.length)?.date ?? week[0]?.date)
  );
  const overdueDay: DashboardDeliveryDay = { date: OVERDUE, label: "Overdue", weekday: "", dayOfMonth: "", orders: overdue };
  const selected = selectedDate === OVERDUE ? overdueDay : (week.find((day) => day.date === selectedDate) ?? week[0]);
  const total = week.reduce((sum, day) => sum + day.orders.length, 0);
  const busiest = Math.max(1, ...week.map((day) => day.orders.length));

  if (!selected) return null;

  return (
    <section aria-labelledby="week-strip-title" className="rounded-2xl border border-white/70 bg-surface p-4 shadow-raised">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="week-strip-title" className="flex items-center gap-2 font-serif text-2xl font-semibold text-wine-deep">
          <CalendarRange className="h-5 w-5 text-wine" aria-hidden />
          Next 7 days
        </h2>
        <p className="text-sm text-muted">
          {total} {total === 1 ? "delivery" : "deliveries"} due this week
          {overdue.length ? ` · ${overdue.length} overdue` : ""}
        </p>
      </div>
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Delivery days">
        {overdue.length ? (
          <button
            type="button"
            role="tab"
            aria-selected={selected.date === OVERDUE}
            onClick={() => setSelectedDate(OVERDUE)}
            className={cn(
              "flex min-w-[4.5rem] flex-1 snap-start flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2.5 transition",
              selected.date === OVERDUE ? "bg-gradient-to-br from-red-700 to-red-500 text-white shadow-danger" : "bg-red-50 text-red-800 shadow-pressed hover:bg-red-100"
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide">Overdue</span>
            <span className="text-xl font-bold leading-none">{overdue.length}</span>
            <span className="text-[11px] font-semibold">late</span>
          </button>
        ) : null}
        {week.map((day) => {
          const active = day.date === selected.date;
          return (
            <button
              key={day.date}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedDate(day.date)}
              className={cn(
                "flex min-w-[4.5rem] flex-1 snap-start flex-col items-center gap-0.5 rounded-2xl px-2 py-2.5 transition",
                active ? "bg-gradient-to-br from-wine to-rose text-white shadow-brand" : "bg-surface-sunken text-ink-soft shadow-pressed hover:text-wine"
              )}
            >
              <span className={cn("text-[11px] font-semibold uppercase tracking-wide", active ? "text-white/80" : "text-muted")}>{day.label}</span>
              <span className="text-xl font-bold leading-none">{day.dayOfMonth}</span>
              <span aria-hidden className="mt-1 flex h-1.5 w-10 overflow-hidden rounded-full bg-black/10">
                <span className={cn("h-full rounded-full", active ? "bg-white" : "bg-gold")} style={{ width: `${(day.orders.length / busiest) * 100}%` }} />
              </span>
              <span className={cn("text-[11px] font-semibold", active ? "text-white" : "text-muted-strong")}>
                {day.orders.length ? `${day.orders.length} due` : "Free"}
              </span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="mt-3 grid gap-2">
        {selected.orders.length === 0 ? (
          <p className="rounded-xl bg-surface-sunken px-4 py-5 text-center text-sm text-muted shadow-pressed">
            No deliveries due {selected.label === "Today" || selected.label === "Tomorrow" ? selected.label.toLowerCase() : `on ${selected.weekday} ${selected.dayOfMonth}`}.
          </p>
        ) : (
          selected.orders.map((order) => (
            <div
              key={order.id}
              onClick={cardNavigationHandler(router.push, `/orders/${order.id}`)}
              onAuxClick={cardNavigationHandler(router.push, `/orders/${order.id}`)}
              className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/70 bg-surface-strong px-3 py-2.5 shadow-raised-sm transition hover:shadow-raised active:shadow-pressed"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-wine-ink">
                  {order.customer.fullName} <span className="text-xs font-medium text-muted">{order.receiptNumber}</span>
                </span>
                <span className="block truncate text-xs text-muted">{summarizeGarments(order.items)}</span>
              </span>
              <StatusBadge status={order.status} />
              {order.priority !== "Normal" ? <PriorityBadge priority={order.priority} /> : null}
              {order.totals.balanceDuePaise > 0 ? <span className="text-sm font-semibold tabular-nums text-wine">{formatINR(order.totals.balanceDuePaise)} due</span> : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
