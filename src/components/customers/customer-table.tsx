"use client";

import Link from "next/link";
import { useState } from "react";
import type { Customer } from "@/types/domain";
import { orders } from "@/lib/data/mock";
import { formatINR } from "@/lib/utils/money";

export function CustomerTable({ customers }: { customers: Customer[] }) {
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

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2 rounded-lg border border-[#e8dcca] bg-[#fffdf8] p-3">
        {columns.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 rounded-md border border-[#d8c7b4] bg-white px-2 py-1 text-xs font-semibold">
            <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumn(key)} />
            {label}
          </label>
        ))}
      </div>
      {customers.map((customer) => {
        const customerOrders = orders.filter((order) => order.customerId === customer.id);
        const outstanding = customerOrders.reduce((sum, order) => sum + Math.max(0, order.totals.balanceDuePaise), 0);
        return (
          <Link
            href={`/customers/${customer.id}`}
            key={customer.id}
            className="group grid gap-3 rounded-lg border border-[#e8dcca] bg-white p-4 transition hover:border-[#7d1f36] md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
          >
            {visibleColumns.customer ? <div>
              <p className="font-semibold text-[#4c1525]">{customer.fullName}</p>
              <p className="text-sm text-[#7c6d66]">{customer.customerCode}</p>
            </div> : null}
            {visibleColumns.phone ? <p className="text-sm">{customer.phonePrimary}</p> : null}
            {visibleColumns.orders ? <p className="text-sm">{customerOrders.length} orders</p> : null}
            {visibleColumns.outstanding ? <p className="text-sm font-semibold">{formatINR(outstanding)}</p> : null}
            {visibleColumns.action ? (
              <span className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#d8c7b4] bg-white px-3 py-1.5 text-sm font-semibold text-[#4c1525] transition group-hover:border-[#7d1f36] group-hover:bg-[#f7efe2]">
                Open
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
