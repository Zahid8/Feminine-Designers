"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveCustomerAction } from "@/app/customers/actions";
import type { Customer } from "@/types/domain";
import { formatINR } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
import { initialsFor } from "@/lib/utils/initials";
import { cn } from "@/lib/utils/cn";
import { cardNavigationHandler } from "@/lib/ui/card-navigation";

export function CustomerTable({
  customers,
  orderStats = {}
}: {
  customers: Customer[];
  orderStats?: Record<string, { orderCount: number; outstandingPaise: number; lastOrderDate?: string }>;
}) {
  const router = useRouter();
  const [deleteMode, setDeleteMode] = useState(false);
  const [hiddenCustomerIds, setHiddenCustomerIds] = useState<string[]>([]);
  const [pendingCustomerIds, setPendingCustomerIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState({
    customer: true,
    phone: true,
    orders: true,
    outstanding: true,
    action: true
  });
  const columns = [
    ["customer", "Customer"],
    ["phone", "Phone"],
    ["orders", "Orders"],
    ["outstanding", "Outstanding"],
    ["action", "Action"]
  ] as const;

  function toggleColumn(column: keyof typeof visibleColumns) {
    setVisibleColumns((current) => ({ ...current, [column]: !current[column] }));
  }

  function archiveCustomer(customer: Customer) {
    if (!window.confirm(`Remove ${customer.fullName} from customer records? Existing orders will remain available.`)) return;
    setPendingCustomerIds((current) => [...current, customer.id]);
    setHiddenCustomerIds((current) => [...current, customer.id]);
    startTransition(() => {
      void archiveCustomerAction(customer.id)
        .then(() => router.refresh())
        .catch((error) => {
          setHiddenCustomerIds((current) => current.filter((id) => id !== customer.id));
          window.alert(error instanceof Error ? error.message : "Could not remove customer record.");
        })
        .finally(() => {
          setPendingCustomerIds((current) => current.filter((id) => id !== customer.id));
        });
    });
  }

  const visibleCustomers = customers.filter((customer) => !hiddenCustomerIds.includes(customer.id));
  const visibleCustomerCount = visibleCustomers.length;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-surface p-3 shadow-raised">
        <div className="flex flex-wrap items-center gap-2">
          <p className="px-1 text-sm font-semibold text-muted-strong">
            {visibleCustomerCount} {visibleCustomerCount === 1 ? "customer" : "customers"}
          </p>
          <button
            type="button"
            aria-pressed={deleteMode}
            onClick={() => setDeleteMode((current) => !current)}
            className={cn(
              "inline-flex min-h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition",
              deleteMode ? "border-danger bg-danger text-white shadow-danger" : "border-danger/40 bg-surface text-danger shadow-raised-sm hover:bg-red-50"
            )}
          >
            {deleteMode ? "Done removing" : "Remove customers"}
          </button>
        </div>
        <div className="hidden flex-wrap gap-2 md:flex">
          {columns.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-2 py-1 text-xs font-semibold shadow-raised-sm">
              <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumn(key)} />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="grid max-h-[calc(100vh-22rem)] min-h-80 gap-3 overflow-y-auto overscroll-contain pb-1 pr-1 [scrollbar-width:thin]">
        {visibleCustomers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted">
            No customers match this search.
          </div>
        ) : null}
        {visibleCustomers.map((customer) => {
          const stats = orderStats[customer.id] ?? { orderCount: 0, outstandingPaise: 0 };
          return (
            <div
              key={customer.id}
              className="grid cursor-pointer grid-cols-2 items-center gap-x-4 gap-y-3 rounded-2xl border border-white/70 bg-surface p-4 shadow-raised-sm transition hover:shadow-raised active:shadow-pressed md:grid-cols-[1.6fr_1fr_.8fr_1fr_auto]"
              onClick={cardNavigationHandler(router.push, `/customers/${customer.id}`)}
              onAuxClick={cardNavigationHandler(router.push, `/customers/${customer.id}`)}
            >
              {visibleColumns.customer ? (
                <Link href={`/customers/${customer.id}`} className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-peach to-gold-soft text-sm font-bold text-wine shadow-raised-sm"
                  >
                    {initialsFor(customer.fullName)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-wine-ink">{customer.fullName}</span>
                    <span className="block text-xs text-muted">
                      {stats.lastOrderDate ? `Last order ${formatDate(stats.lastOrderDate)}` : "No orders yet"}
                    </span>
                  </span>
                </Link>
              ) : null}
              {visibleColumns.phone ? <p className="text-sm tabular-nums">{customer.phonePrimary}</p> : null}
              {visibleColumns.orders ? (
                <p className="text-sm text-muted-strong">
                  {stats.orderCount} {stats.orderCount === 1 ? "order" : "orders"}
                </p>
              ) : null}
              {visibleColumns.outstanding ? (
                <p className={cn("text-sm font-semibold tabular-nums", stats.outstandingPaise > 0 ? "text-wine" : "text-success")}>
                  {stats.outstandingPaise > 0 ? `${formatINR(stats.outstandingPaise)} due` : "Settled"}
                </p>
              ) : null}
              {visibleColumns.action ? (
                <div className="col-span-2 flex flex-wrap gap-2 md:col-span-1 md:justify-end">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold text-wine-ink shadow-raised-sm transition hover:border-gold hover:bg-blush"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/customers/${customer.id}/measurements`}
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold text-wine-ink shadow-raised-sm transition hover:border-gold hover:bg-blush"
                  >
                    Measurements
                  </Link>
                  {deleteMode ? (
                    <button
                      type="button"
                      disabled={pendingCustomerIds.includes(customer.id)}
                      onClick={() => archiveCustomer(customer)}
                      className="inline-flex min-h-9 items-center justify-center rounded-xl bg-danger px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#8c2727] disabled:opacity-60"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
