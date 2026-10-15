"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveCustomerAction } from "@/app/customers/actions";
import type { Customer } from "@/types/domain";
import { formatINR } from "@/lib/utils/money";

export function CustomerTable({
  customers,
  orderStats = {}
}: {
  customers: Customer[];
  orderStats?: Record<string, { orderCount: number; outstandingPaise: number }>;
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

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-surface p-3 shadow-raised">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/customers/new"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-wine px-4 py-2 text-sm font-semibold text-white transition hover:bg-wine-hover"
          >
            Add New Customer
          </Link>
          <button
            type="button"
            onClick={() => setDeleteMode((current) => !current)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-danger bg-surface px-4 py-2 text-sm font-semibold text-danger shadow-raised-sm transition hover:bg-red-50"
          >
            Remove Customer Record
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {columns.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-2 py-1 text-xs font-semibold shadow-raised-sm">
              <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumn(key)} />
              {label}
            </label>
          ))}
        </div>
      </div>
      {customers.filter((customer) => !hiddenCustomerIds.includes(customer.id)).map((customer) => {
        const stats = orderStats[customer.id] ?? { orderCount: 0, outstandingPaise: 0 };
        return (
          <div
            key={customer.id}
            className="grid gap-3 rounded-2xl border border-line bg-surface p-4 shadow-raised-sm transition hover:border-gold hover:bg-paper-warm hover:shadow-raised md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
          >
            {visibleColumns.customer ? <div>
              <p className="font-semibold text-wine-ink">{customer.fullName}</p>
              <p className="text-sm text-muted">{customer.customerCode}</p>
            </div> : null}
            {visibleColumns.phone ? <p className="text-sm">{customer.phonePrimary}</p> : null}
            {visibleColumns.orders ? <p className="text-sm">{stats.orderCount} orders</p> : null}
            {visibleColumns.outstanding ? <p className="text-sm font-semibold">{formatINR(stats.outstandingPaise)}</p> : null}
            {visibleColumns.action ? (
              <div className="flex flex-wrap gap-2">
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
  );
}
