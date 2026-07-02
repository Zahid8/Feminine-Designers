"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, CalendarDays, CheckCircle2, Clock, PackageCheck, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentBadge, PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/date";
import { formatINR } from "@/lib/utils/money";
import type { DashboardCardModel, DashboardModel, DashboardPaymentRow, DashboardViewId } from "@/lib/dashboard/dashboard-model";
import type { OrderWithCustomer } from "@/types/domain";

const iconByCard: Record<DashboardViewId, ComponentType<{ className?: string }>> = {
  "orders-today": ReceiptText,
  "deliveries-today": CalendarDays,
  pending: Clock,
  overdue: AlertTriangle,
  "collected-today": Banknote,
  outstanding: PackageCheck
};

const toneClasses: Record<DashboardCardModel["tone"], string> = {
  neutral: "border-[#e8dcca] bg-white hover:border-[#7d1f36]",
  good: "border-emerald-200 bg-emerald-50 hover:border-emerald-500",
  warning: "border-amber-200 bg-amber-50 hover:border-amber-500",
  danger: "border-red-200 bg-red-50 hover:border-red-500"
};

function cardValue(card: DashboardCardModel) {
  return card.valueType === "money" ? formatINR(card.value) : String(card.value);
}

function garmentSummary(order: OrderWithCustomer) {
  return order.items.map((item) => item.garmentType).join(", ");
}

function paidAmount(order: OrderWithCustomer) {
  return order.payments.reduce((sum, payment) => sum + payment.amountPaise, 0);
}

function formatISODateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function MetricCard({
  card,
  selected,
  onSelect
}: {
  card: DashboardCardModel;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = iconByCard[card.id];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "min-h-32 rounded-lg border p-4 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d1f36]",
        toneClasses[card.tone],
        selected && "border-[#7d1f36] ring-2 ring-[#7d1f36]/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7c6d66]">{card.label}</p>
          <p className="mt-2 text-3xl font-bold text-[#4c1525]">{cardValue(card)}</p>
        </div>
        <span className="rounded-md border border-white/70 bg-white/70 p-2 text-[#7d1f36]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-[#6f625d]">{card.description}</p>
    </button>
  );
}

function OrderQueue({ orders, emptyText }: { orders: DashboardModel["views"][DashboardViewId]["orders"]; emptyText: string }) {
  if (orders.length === 0) {
    return <div className="rounded-md border border-dashed border-[#d8c7b4] bg-white p-8 text-center text-sm text-[#7c6d66]">{emptyText}</div>;
  }

  return (
    <div className="grid gap-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-md border border-[#eadfce] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7c6d66]">{order.receiptNumber ?? "Draft"}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#4c1525]">{order.customer.fullName}</h3>
              <p className="text-sm text-[#7c6d66]">{order.customer.phonePrimary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
              <PaymentBadge status={order.totals.paymentStatus} />
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center">
            <p>
              <span className="block text-xs uppercase text-[#7c6d66]">Garments</span>
              <strong>{garmentSummary(order) || "No garments"}</strong>
            </p>
            <p>
              <span className="block text-xs uppercase text-[#7c6d66]">Delivery</span>
              <strong className={order.overdue ? "text-[#a83232]" : ""}>{formatDate(order.deliveryDate)}</strong>
            </p>
            <p>
              <span className="block text-xs uppercase text-[#7c6d66]">Paid</span>
              <strong>{formatINR(paidAmount(order))}</strong>
            </p>
            <p>
              <span className="block text-xs uppercase text-[#7c6d66]">Balance</span>
              <strong>{formatINR(order.totals.balanceDuePaise)}</strong>
            </p>
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#d8c7b4] bg-white px-3 py-2 text-sm font-semibold text-[#4c1525] transition hover:border-[#7d1f36] hover:bg-[#f7efe2]"
            >
              Open
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentQueue({ payments, emptyText }: { payments: DashboardPaymentRow[]; emptyText: string }) {
  if (payments.length === 0) {
    return <div className="rounded-md border border-dashed border-[#d8c7b4] bg-white p-8 text-center text-sm text-[#7c6d66]">{emptyText}</div>;
  }

  return (
    <div className="grid gap-3">
      {payments.map((payment) => (
        <Link key={payment.id} href={`/orders/${payment.orderId}`} className="rounded-md border border-[#eadfce] bg-white p-4 transition hover:border-[#7d1f36]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7c6d66]">{payment.receiptNumber}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#4c1525]">{payment.customerName}</h3>
              <p className="text-sm text-[#7c6d66]">{payment.customerPhone}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#4c1525]">{formatINR(payment.amountPaise)}</p>
              <p className="text-sm text-[#7c6d66]">
                {payment.method} · {formatISODateLabel(payment.paidAt)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function MiniOrderList({
  title,
  orders,
  emptyText
}: {
  title: string;
  orders: OrderWithCustomer[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 p-4">
        {orders.length ? (
          orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="rounded-md border border-[#eadfce] bg-white p-3 transition hover:border-[#7d1f36]">
              <p className="font-semibold text-[#4c1525]">{order.customer.fullName}</p>
              <p className="text-xs text-[#7c6d66]">
                {order.receiptNumber ?? "Draft"} · {formatDate(order.deliveryDate)} · {formatINR(order.totals.balanceDuePaise)}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-sm text-[#7c6d66]">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function MiniPaymentList({ payments }: { payments: DashboardPaymentRow[] }) {
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-xl">Recent Collections</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 p-4">
        {payments.length ? (
          payments.map((payment) => (
            <Link key={payment.id} href={`/orders/${payment.orderId}`} className="flex justify-between gap-3 rounded-md border border-[#eadfce] bg-white p-3 transition hover:border-[#7d1f36]">
              <span>
                <strong className="block text-[#4c1525]">{payment.customerName}</strong>
                <span className="text-xs text-[#7c6d66]">{payment.method}</span>
              </span>
              <strong>{formatINR(payment.amountPaise)}</strong>
            </Link>
          ))
        ) : (
          <p className="text-sm text-[#7c6d66]">No recent collections.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function InteractiveDashboard({ model }: { model: DashboardModel }) {
  const [selectedViewId, setSelectedViewId] = useState<DashboardViewId>("deliveries-today");
  const selectedView = model.views[selectedViewId];
  const selectedCard = useMemo(() => model.cards.find((card) => card.id === selectedViewId), [model.cards, selectedViewId]);

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {model.cards.map((card) => (
          <MetricCard key={card.id} card={card} selected={card.id === selectedViewId} onSelect={() => setSelectedViewId(card.id)} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_.55fr]">
        <Card>
          <CardHeader className="flex flex-col gap-2 p-5 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Interactive Work Queue</CardTitle>
              <p className="mt-1 text-sm text-[#7c6d66]">
                {selectedView.title} · {selectedView.description}
              </p>
            </div>
            {selectedCard ? (
              <span className="inline-flex min-h-10 items-center rounded-md border border-[#d8c7b4] bg-white px-3 text-sm font-bold text-[#4c1525]">
                {selectedCard.valueType === "money" ? formatINR(selectedCard.value) : `${selectedCard.value} item${selectedCard.value === 1 ? "" : "s"}`}
              </span>
            ) : null}
          </CardHeader>
          <CardContent>
            {selectedViewId === "collected-today" ? (
              <PaymentQueue payments={selectedView.payments} emptyText={selectedView.emptyText} />
            ) : (
              <OrderQueue orders={selectedView.orders} emptyText={selectedView.emptyText} />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="flex items-start gap-3 p-4">
              <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-700" />
              <div>
                <p className="font-semibold text-[#4c1525]">Today at a glance</p>
                <p className="mt-1 text-sm text-[#6f625d]">
                  {model.views["deliveries-today"].orders.length} due today, {model.views.overdue.orders.length} overdue,{" "}
                  {formatINR(model.cards.find((card) => card.id === "collected-today")?.value ?? 0)} collected.
                </p>
              </div>
            </CardContent>
          </Card>
          <MiniOrderList title="Highest Outstanding" orders={model.insights.highestOutstanding} emptyText="No balances due." />
          <MiniOrderList title="Urgent Deliveries" orders={model.insights.urgentDeliveries} emptyText="No urgent deliveries." />
          <MiniPaymentList payments={model.insights.recentCollections} />
          <MiniOrderList title="Ready, Not Delivered" orders={model.insights.readyUndelivered} emptyText="No ready orders waiting." />
        </div>
      </div>
    </div>
  );
}
