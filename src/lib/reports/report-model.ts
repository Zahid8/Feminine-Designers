import { addDaysISO, todayISO } from "@/lib/utils/date";
import type { OrderWithCustomer } from "@/types/domain";

export type ReportRangeId = "today" | "7d" | "month" | "last-month" | "year" | "all";

export const REPORT_RANGES: { id: ReportRangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "year", label: "This year" },
  { id: "all", label: "All time" }
];

export interface ReportRange {
  id: ReportRangeId;
  label: string;
  /** Inclusive ISO dates (India). `from` is empty for all time. */
  from: string;
  to: string;
}

export function resolveReportRange(id: string | undefined, today: string): ReportRange {
  const rangeId = (REPORT_RANGES.find((range) => range.id === id)?.id ?? "month") as ReportRangeId;
  const label = REPORT_RANGES.find((range) => range.id === rangeId)!.label;
  const [year, month] = today.split("-").map(Number);
  const pad = (value: number) => String(value).padStart(2, "0");
  switch (rangeId) {
    case "today":
      return { id: rangeId, label, from: today, to: today };
    case "7d":
      return { id: rangeId, label, from: addDaysISO(today, -6), to: today };
    case "last-month": {
      const lastMonthEnd = addDaysISO(`${year}-${pad(month)}-01`, -1);
      return { id: rangeId, label, from: `${lastMonthEnd.slice(0, 7)}-01`, to: lastMonthEnd };
    }
    case "year":
      return { id: rangeId, label, from: `${year}-01-01`, to: today };
    case "all":
      return { id: rangeId, label, from: "", to: today };
    default:
      return { id: "month", label, from: `${year}-${pad(month)}-01`, to: today };
  }
}

const inRange = (date: string, range: ReportRange) => (!range.from || date >= range.from) && date <= range.to;

export interface ReportBucket {
  key: string;
  label: string;
  amountPaise: number;
  count: number;
}

export interface ReportModel {
  range: ReportRange;
  ordersCount: number;
  billedPaise: number;
  averageOrderPaise: number;
  collectedPaise: number;
  collectedByMethod: { method: string; amountPaise: number; count: number }[];
  outstandingPaise: number;
  outstandingOrders: number;
  collections: ReportBucket[];
  collectionsGrouping: "day" | "month";
  garmentMix: ReportBucket[];
  topCustomers: { customerId: string; name: string; phone: string; orders: number; billedPaise: number; duePaise: number }[];
  orders: OrderWithCustomer[];
}

const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });
const dayFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

function isoToUtcDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day || 1));
}

/** Everything the Reports page shows, derived from orders (payments included). */
export function buildReportModel(orders: OrderWithCustomer[], range: ReportRange, today = todayISO()): ReportModel {
  const rangeOrders = orders.filter((order) => order.status !== "Cancelled" && inRange(order.orderDate, range));
  const payments = orders.flatMap((order) => order.payments.map((payment) => ({ ...payment, day: todayISO(new Date(payment.paidAt)) })));
  const rangePayments = payments.filter((payment) => inRange(payment.day, range));

  const billedPaise = rangeOrders.reduce((sum, order) => sum + order.totals.grandTotalPaise, 0);
  const collectedPaise = rangePayments.reduce((sum, payment) => sum + payment.amountPaise, 0);
  const openOrders = orders.filter((order) => order.status !== "Cancelled" && order.totals.balanceDuePaise > 0);

  const methods = new Map<string, { amountPaise: number; count: number }>();
  for (const payment of rangePayments) {
    const current = methods.get(payment.method) ?? { amountPaise: 0, count: 0 };
    methods.set(payment.method, { amountPaise: current.amountPaise + payment.amountPaise, count: current.count + 1 });
  }

  const firstPaymentDay = rangePayments.map((payment) => payment.day).sort()[0];
  const from = range.from || firstPaymentDay || today;
  const spanDays = Math.round((isoToUtcDate(range.to).getTime() - isoToUtcDate(from).getTime()) / 86_400_000) + 1;
  const grouping: "day" | "month" = spanDays > 62 ? "month" : "day";
  const buckets = new Map<string, ReportBucket>();
  if (grouping === "day") {
    for (let offset = 0; offset < spanDays; offset += 1) {
      const key = addDaysISO(from, offset);
      buckets.set(key, { key, label: dayFormatter.format(isoToUtcDate(key)), amountPaise: 0, count: 0 });
    }
  } else {
    for (let key = from.slice(0, 7); key <= range.to.slice(0, 7); key = addDaysISO(`${key}-28`, 7).slice(0, 7)) {
      buckets.set(key, { key, label: monthFormatter.format(isoToUtcDate(`${key}-01`)), amountPaise: 0, count: 0 });
    }
  }
  for (const payment of rangePayments) {
    const bucket = buckets.get(grouping === "day" ? payment.day : payment.day.slice(0, 7));
    if (bucket) {
      bucket.amountPaise += payment.amountPaise;
      bucket.count += 1;
    }
  }

  const garments = new Map<string, ReportBucket>();
  for (const item of rangeOrders.flatMap((order) => order.items)) {
    const current = garments.get(item.garmentType) ?? { key: item.garmentType, label: item.garmentType, amountPaise: 0, count: 0 };
    current.count += item.quantity || 1;
    current.amountPaise += item.lineTotalPaise;
    garments.set(item.garmentType, current);
  }

  const customers = new Map<string, ReportModel["topCustomers"][number]>();
  for (const order of rangeOrders) {
    const current = customers.get(order.customerId) ?? {
      customerId: order.customerId,
      name: order.customer.fullName,
      phone: order.customer.phonePrimary,
      orders: 0,
      billedPaise: 0,
      duePaise: 0
    };
    current.orders += 1;
    current.billedPaise += order.totals.grandTotalPaise;
    current.duePaise += Math.max(0, order.totals.balanceDuePaise);
    customers.set(order.customerId, current);
  }

  return {
    range,
    ordersCount: rangeOrders.length,
    billedPaise,
    averageOrderPaise: rangeOrders.length ? Math.round(billedPaise / rangeOrders.length) : 0,
    collectedPaise,
    collectedByMethod: [...methods].map(([method, value]) => ({ method, ...value })).sort((a, b) => b.amountPaise - a.amountPaise),
    outstandingPaise: openOrders.reduce((sum, order) => sum + order.totals.balanceDuePaise, 0),
    outstandingOrders: openOrders.length,
    collections: [...buckets.values()],
    collectionsGrouping: grouping,
    garmentMix: [...garments.values()].sort((a, b) => b.count - a.count),
    topCustomers: [...customers.values()].sort((a, b) => b.billedPaise - a.billedPaise).slice(0, 8),
    orders: rangeOrders
  };
}
