"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  CircleCheckBig,
  Loader2,
  PackageCheck,
  Scissors,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { setOrderStageAction } from "@/app/orders/[id]/actions";
import {
  DeliveryUrgencyBadge,
  PriorityBadge
} from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  BOARD_COLUMNS,
  boardColumnFor,
  boardMoves,
  type BoardColumnId
} from "@/lib/orders/board";
import { summarizeGarments } from "@/lib/orders/garment-summary";
import { compareOrdersByPriorityAndDelivery } from "@/lib/orders/order-sort";
import { cardNavigationHandler } from "@/lib/ui/card-navigation";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/date";
import { formatINR } from "@/lib/utils/money";
import type { OrderStatus, OrderWithCustomer } from "@/types/domain";

const columnIcons: Record<BoardColumnId, typeof Sparkles> = {
  new: Sparkles,
  stitching: Scissors,
  ready: PackageCheck,
  delivered: CircleCheckBig
};
const columnAccent: Record<BoardColumnId, string> = {
  new: "from-sky-500/80 to-sky-300/60",
  stitching: "from-amber-500/80 to-amber-300/60",
  ready: "from-emerald-600/80 to-emerald-400/60",
  delivered: "from-stone-500/80 to-stone-400/60"
};

const nextLabel: Partial<Record<OrderStatus, string>> = {
  "In Stitching": "Start stitching",
  Ready: "Mark ready",
  Delivered: "Delivered"
};

const ALL = "All tailors";
const UNASSIGNED = "Unassigned";

export function WorkshopBoard({
  orders,
  today
}: {
  orders: OrderWithCustomer[];
  today: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, OrderStatus>
  >({});
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const [tailor, setTailor] = useState<string>(ALL);
  const tailors = [
    ...new Set(
      orders
        .map((order) => order.assignedTailor?.trim())
        .filter((name): name is string => Boolean(name))
    )
  ].sort();
  const tailorOf = (order: OrderWithCustomer) =>
    order.assignedTailor?.trim() || UNASSIGNED;
  const withStatus = orders
    .map((order) => ({
      ...order,
      status: statusOverrides[order.id] ?? order.status
    }))
    .filter((order) => tailor === ALL || tailorOf(order) === tailor);

  async function move(
    order: OrderWithCustomer,
    from: OrderStatus,
    to: OrderStatus,
    { announce = true } = {}
  ) {
    setStatusOverrides((current) => ({ ...current, [order.id]: to }));
    setPendingIds((current) => [...current, order.id]);
    try {
      await setOrderStageAction(order.id, to);
      router.refresh();
      if (announce) {
        toast.show({
          message: `${order.receiptNumber ?? order.customer.fullName} moved to ${to}.`,
          action: {
            label: "Undo",
            onAction: () => move(order, to, from, { announce: false })
          }
        });
      }
    } catch (error) {
      setStatusOverrides((current) => ({ ...current, [order.id]: from }));
      toast.show({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not update the order."
      });
    } finally {
      setPendingIds((current) => current.filter((id) => id !== order.id));
    }
  }

  const openCount = (name: string) =>
    orders.filter(
      (order) =>
        (statusOverrides[order.id] ?? order.status) !== "Delivered" &&
        (name === ALL || tailorOf(order) === name)
    ).length;

  return (
    <>
      {tailors.length ? (
        <nav
          aria-label="Filter by tailor"
          className="mb-4 flex gap-1 overflow-x-auto rounded-2xl bg-surface-sunken p-1.5 shadow-pressed"
        >
          {[ALL, ...tailors, UNASSIGNED].map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={tailor === name}
              onClick={() => setTailor(name)}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                tailor === name
                  ? "bg-gradient-to-br from-wine to-rose text-white shadow-brand"
                  : "text-ink-soft hover:bg-surface hover:text-wine"
              )}
            >
              {name}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  tailor === name ? "bg-white/20" : "bg-surface text-muted"
                )}
              >
                {openCount(name)}
              </span>
            </button>
          ))}
        </nav>
      ) : null}
      <div className="-mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pb-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {BOARD_COLUMNS.map((column) => {
          const cards = withStatus
            .filter((order) => boardColumnFor(order.status) === column.id)
            .sort(compareOrdersByPriorityAndDelivery);
          const balance = cards.reduce(
            (sum, order) => sum + Math.max(0, order.totals.balanceDuePaise),
            0
          );
          const Icon = columnIcons[column.id];
          return (
            <section
              key={column.id}
              aria-label={`${column.title} orders`}
              className="flex w-[85vw] max-w-sm shrink-0 snap-start flex-col rounded-3xl bg-surface-sunken p-3 shadow-pressed sm:w-[60vw] lg:w-auto lg:max-w-none"
            >
              <header className="mb-3 flex items-center gap-3 px-1">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-raised-sm",
                    columnAccent[column.id]
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-xl font-semibold text-wine-deep">
                    {column.title}{" "}
                    <span className="ml-1 rounded-full bg-surface px-2 py-0.5 align-middle font-sans text-xs font-bold text-muted-strong shadow-raised-sm">
                      {cards.length}
                    </span>
                  </h2>
                  <p className="text-xs text-muted">
                    {column.hint}
                    {balance > 0 ? ` · ${formatINR(balance)} due` : ""}
                  </p>
                </div>
              </header>
              <ul className="grid gap-3">
                {cards.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
                    Nothing here right now.
                  </li>
                ) : null}
                {cards.map((order) => {
                  const { next, previous } = boardMoves(order.status);
                  const pending = pendingIds.includes(order.id);
                  return (
                    <li
                      key={order.id}
                      className={cn(
                        "cursor-pointer rounded-2xl border border-white/70 bg-surface p-3 shadow-raised-sm transition hover:shadow-raised active:shadow-pressed",
                        pending && "opacity-70"
                      )}
                      onClick={cardNavigationHandler(
                        router.push,
                        `/orders/${order.id}`
                      )}
                      onAuxClick={cardNavigationHandler(
                        router.push,
                        `/orders/${order.id}`
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-muted">
                            {order.receiptNumber ?? "Draft"}
                          </p>
                          <p className="truncate font-semibold text-wine-ink">
                            {order.customer.fullName}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <DeliveryUrgencyBadge
                            deliveryDate={order.deliveryDate}
                            status={order.status}
                            today={today}
                          />
                          {order.priority !== "Normal" ? (
                            <PriorityBadge priority={order.priority} />
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-strong">
                        {summarizeGarments(order.items)}
                      </p>
                      {order.assignedTailor ? (
                        <p className="mt-1 text-xs font-semibold text-copper">
                          Tailor: {order.assignedTailor}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted">
                        Delivery {formatDate(order.deliveryDate)}
                        {order.totals.balanceDuePaise > 0
                          ? ` · ${formatINR(order.totals.balanceDuePaise)} due`
                          : " · Paid"}
                      </p>
                      <div className="mt-3 flex gap-2">
                        {previous ? (
                          <button
                            title={`Back to ${previous}`}
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              void move(order, order.status, previous)
                            }
                            aria-label={`Move ${order.receiptNumber ?? order.customer.fullName} back to ${previous}`}
                            className={cn(
                              "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-surface-sunken px-3 text-sm font-semibold text-muted-strong shadow-pressed transition hover:text-wine disabled:opacity-50",
                              !next && "flex-1"
                            )}
                          >
                            <ArrowLeft className="h-4 w-4" aria-hidden />
                            {next ? null : `Back to ${previous}`}
                          </button>
                        ) : null}
                        {next ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => void move(order, order.status, next)}
                            className={cn(
                              "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition disabled:opacity-60",
                              next === "Delivered"
                                ? "bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-raised-sm"
                                : "bg-gradient-to-br from-wine to-rose text-white shadow-brand"
                            )}
                          >
                            {pending ? (
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden
                              />
                            ) : next === "Delivered" ? (
                              <CheckCheck className="h-4 w-4" aria-hidden />
                            ) : null}
                            {nextLabel[next] ?? next}
                            {next !== "Delivered" && !pending ? (
                              <ArrowRight className="h-4 w-4" aria-hidden />
                            ) : null}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
