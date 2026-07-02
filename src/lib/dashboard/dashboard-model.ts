import { daysOverdue, isOrderOverdue } from "@/lib/calculations/order";
import { isPastOrderForList } from "@/lib/calculations/status";
import { indiaNoonDate, todayISO } from "@/lib/utils/date";
import type { OrderWithCustomer, PaymentMethod } from "@/types/domain";

export type DashboardViewId =
  | "orders-today"
  | "order-value-today"
  | "order-value-month"
  | "deliveries-today"
  | "pending"
  | "overdue"
  | "collected-today"
  | "outstanding";

export interface DashboardCardModel {
  id: DashboardViewId;
  label: string;
  value: number;
  valueType: "count" | "money";
  description: string;
  tone: "neutral" | "good" | "warning" | "danger";
}

export interface DashboardPaymentRow {
  id: string;
  orderId: string;
  receiptNumber: string;
  customerName: string;
  customerPhone: string;
  amountPaise: number;
  method: PaymentMethod;
  paidAt: string;
}

export interface DashboardCollectionDay {
  date: string;
  totalPaise: number;
  paymentCount: number;
}

export interface DashboardViewModel {
  id: DashboardViewId;
  title: string;
  description: string;
  emptyText: string;
  orders: (OrderWithCustomer & { overdue?: boolean; daysOverdue?: number })[];
  payments: DashboardPaymentRow[];
}

export interface DashboardModel {
  today: string;
  cards: DashboardCardModel[];
  views: Record<DashboardViewId, DashboardViewModel>;
  insights: {
    highestOutstanding: OrderWithCustomer[];
    urgentDeliveries: (OrderWithCustomer & { overdue?: boolean; daysOverdue?: number })[];
    recentCollections: DashboardPaymentRow[];
    collectionsByDate: DashboardCollectionDay[];
    readyUndelivered: OrderWithCustomer[];
  };
}

function isActiveOrder(order: OrderWithCustomer) {
  return !["Delivered", "Cancelled"].includes(order.status);
}

function paymentDateKey(paidAt: string) {
  return todayISO(new Date(paidAt));
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function withOverdueMeta(order: OrderWithCustomer, today: string) {
  const todayDate = indiaNoonDate(today);
  return {
    ...order,
    overdue: isOrderOverdue(order.deliveryDate, order.status, todayDate),
    daysOverdue: daysOverdue(order.deliveryDate, order.status, todayDate)
  };
}

function paymentRowsForOrders(orders: OrderWithCustomer[]) {
  return orders.flatMap((order) =>
    order.payments.map<DashboardPaymentRow>((payment) => ({
      id: payment.id,
      orderId: order.id,
      receiptNumber: order.receiptNumber ?? "Draft",
      customerName: order.customer.fullName,
      customerPhone: order.customer.phonePrimary,
      amountPaise: payment.amountPaise,
      method: payment.method,
      paidAt: payment.paidAt
    }))
  );
}

function sortByDeliveryDate(orders: (OrderWithCustomer & { overdue?: boolean; daysOverdue?: number })[]) {
  return [...orders].sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate) || a.customer.fullName.localeCompare(b.customer.fullName));
}

function sortByBalanceDesc<T extends OrderWithCustomer>(orders: T[]) {
  return [...orders].sort((a, b) => b.totals.balanceDuePaise - a.totals.balanceDuePaise);
}

function collectionDays(payments: DashboardPaymentRow[]) {
  const days = new Map<string, DashboardCollectionDay>();

  for (const payment of payments) {
    const date = paymentDateKey(payment.paidAt);
    const current = days.get(date) ?? { date, totalPaise: 0, paymentCount: 0 };
    current.totalPaise += payment.amountPaise;
    current.paymentCount += 1;
    days.set(date, current);
  }

  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function makeView(
  id: DashboardViewId,
  title: string,
  description: string,
  emptyText: string,
  orders: (OrderWithCustomer & { overdue?: boolean; daysOverdue?: number })[] = [],
  payments: DashboardPaymentRow[] = []
): DashboardViewModel {
  return { id, title, description, emptyText, orders, payments };
}

export function buildDashboardModel(orders: OrderWithCustomer[], today: string): DashboardModel {
  const enrichedOrders = orders.map((order) => withOverdueMeta(order, today));
  const currentOrders = enrichedOrders.filter((order) => !isPastOrderForList(order, today));
  const activeOrders = enrichedOrders.filter(isActiveOrder);
  const ordersToday = enrichedOrders.filter((order) => order.orderDate === today);
  const orderValueToday = ordersToday.reduce((sum, order) => sum + order.totals.grandTotalPaise, 0);
  const ordersThisMonth = enrichedOrders.filter((order) => monthKey(order.orderDate) === monthKey(today));
  const orderValueThisMonth = ordersThisMonth.reduce((sum, order) => sum + order.totals.grandTotalPaise, 0);
  const deliveriesToday = activeOrders.filter((order) => order.deliveryDate === today);
  const pendingOrders = sortByDeliveryDate(activeOrders);
  const overdueOrders = sortByDeliveryDate(activeOrders.filter((order) => order.overdue));
  const outstandingOrders = sortByBalanceDesc(currentOrders.filter((order) => order.totals.balanceDuePaise > 0));
  const allPayments = paymentRowsForOrders(enrichedOrders).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const collectedToday = allPayments.filter((payment) => paymentDateKey(payment.paidAt) === today);
  const collectedTodayTotal = collectedToday.reduce((sum, payment) => sum + payment.amountPaise, 0);
  const readyUndelivered = activeOrders.filter((order) => order.status === "Ready" && order.items.some((item) => !item.delivered));

  const views: Record<DashboardViewId, DashboardViewModel> = {
    "orders-today": makeView(
      "orders-today",
      "Orders Created Today",
      "New work entered today, including draft and active orders.",
      "No orders have been created today.",
      ordersToday
    ),
    "order-value-today": makeView(
      "order-value-today",
      "Order Value Today",
      "Total bill value for orders created today.",
      "No order value recorded today.",
      ordersToday
    ),
    "order-value-month": makeView(
      "order-value-month",
      "Order Value This Month",
      "Total bill value for orders created in this month.",
      "No order value recorded this month.",
      ordersThisMonth
    ),
    "deliveries-today": makeView(
      "deliveries-today",
      "Deliveries Due Today",
      "Orders due today that still need attention.",
      "No deliveries are due today.",
      sortByDeliveryDate(deliveriesToday)
    ),
    pending: makeView(
      "pending",
      "Pending Orders",
      "All active orders that are not delivered or cancelled.",
      "No pending orders.",
      pendingOrders
    ),
    overdue: makeView(
      "overdue",
      "Overdue Orders",
      "Delivery dates that have passed and still need follow-up.",
      "No overdue orders.",
      overdueOrders
    ),
    "collected-today": makeView(
      "collected-today",
      "Collected Today",
      "Payments recorded today with order and customer context.",
      "No payments collected today.",
      [],
      collectedToday
    ),
    outstanding: makeView(
      "outstanding",
      "Outstanding Balances",
      "Orders with money still due, sorted highest first.",
      "No outstanding balances.",
      outstandingOrders
    )
  };

  return {
    today,
    cards: [
      {
        id: "orders-today",
        label: "Orders Today",
        value: ordersToday.length,
        valueType: "count",
        description: "Created today",
        tone: "neutral"
      },
      {
        id: "order-value-today",
        label: "Order Value Today",
        value: orderValueToday,
        valueType: "money",
        description: `${ordersToday.length} order${ordersToday.length === 1 ? "" : "s"}`,
        tone: orderValueToday ? "good" : "neutral"
      },
      {
        id: "order-value-month",
        label: "Order Value This Month",
        value: orderValueThisMonth,
        valueType: "money",
        description: `${ordersThisMonth.length} order${ordersThisMonth.length === 1 ? "" : "s"}`,
        tone: orderValueThisMonth ? "good" : "neutral"
      },
      {
        id: "deliveries-today",
        label: "Deliveries Today",
        value: deliveriesToday.length,
        valueType: "count",
        description: "Due today",
        tone: deliveriesToday.length ? "warning" : "good"
      },
      {
        id: "pending",
        label: "Pending Orders",
        value: pendingOrders.length,
        valueType: "count",
        description: "Active workload",
        tone: "neutral"
      },
      {
        id: "overdue",
        label: "Overdue Orders",
        value: overdueOrders.length,
        valueType: "count",
        description: "Past delivery date",
        tone: overdueOrders.length ? "danger" : "good"
      },
      {
        id: "collected-today",
        label: "Collected Today",
        value: collectedTodayTotal,
        valueType: "money",
        description: `${collectedToday.length} payment${collectedToday.length === 1 ? "" : "s"}`,
        tone: "good"
      },
      {
        id: "outstanding",
        label: "Outstanding",
        value: outstandingOrders.reduce((sum, order) => sum + Math.max(0, order.totals.balanceDuePaise), 0),
        valueType: "money",
        description: `${outstandingOrders.length} order${outstandingOrders.length === 1 ? "" : "s"}`,
        tone: outstandingOrders.length ? "warning" : "good"
      }
    ],
    views,
    insights: {
      highestOutstanding: outstandingOrders.slice(0, 5),
      urgentDeliveries: sortByDeliveryDate(deliveriesToday.filter((order) => !isPastOrderForList(order, today))).slice(0, 5),
      recentCollections: allPayments.slice(0, 5),
      collectionsByDate: collectionDays(allPayments),
      readyUndelivered: readyUndelivered.slice(0, 5)
    }
  };
}
