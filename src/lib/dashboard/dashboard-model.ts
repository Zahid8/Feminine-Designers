import { daysOverdue, isOrderOverdue } from "@/lib/calculations/order";
import type { OrderWithCustomer, PaymentMethod } from "@/types/domain";

export type DashboardViewId =
  | "orders-today"
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
    readyUndelivered: OrderWithCustomer[];
  };
}

function isActiveOrder(order: OrderWithCustomer) {
  return !["Delivered", "Cancelled"].includes(order.status);
}

function paymentDateKey(paidAt: string) {
  return paidAt.slice(0, 10);
}

function withOverdueMeta(order: OrderWithCustomer, today: string) {
  const todayDate = new Date(`${today}T12:00:00`);
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
  const activeOrders = enrichedOrders.filter(isActiveOrder);
  const ordersToday = enrichedOrders.filter((order) => order.orderDate === today);
  const deliveriesToday = activeOrders.filter((order) => order.deliveryDate === today);
  const pendingOrders = sortByDeliveryDate(activeOrders);
  const overdueOrders = sortByDeliveryDate(activeOrders.filter((order) => order.overdue));
  const outstandingOrders = sortByBalanceDesc(enrichedOrders.filter((order) => order.totals.balanceDuePaise > 0));
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
      urgentDeliveries: [...overdueOrders, ...sortByDeliveryDate(deliveriesToday)].slice(0, 5),
      recentCollections: allPayments.slice(0, 5),
      readyUndelivered: readyUndelivered.slice(0, 5)
    }
  };
}
