import type {
  Customer,
  DashboardSummary,
  MeasurementValue,
  OrderWithCustomer,
  Payment
} from "@/types/domain";
import { calculateOrderTotals, daysOverdue, isOrderOverdue } from "@/lib/calculations/order";
import { formatReceiptNumber } from "@/lib/calculations/receipt-number";
import { MEASUREMENT_TEMPLATES, STORE_SETTINGS } from "@/lib/constants/business";
import { todayISO } from "@/lib/utils/date";
import { rupeesToPaise } from "@/lib/utils/money";

export const customers: Customer[] = [
  {
    id: "cust-1",
    customerCode: "CUST-0001",
    fullName: "Ayesha Khan",
    phonePrimary: "9718926185",
    phoneSecondary: "8447371925",
    email: "ayesha@example.com",
    address: "DLF Phase 2, Gurugram",
    notes: "Prefers WhatsApp updates.",
    preferredCommunication: "WhatsApp",
    tags: ["VIP", "Regular"],
    createdAt: "2026-06-10T10:00:00Z",
    updatedAt: "2026-06-28T10:00:00Z"
  },
  {
    id: "cust-2",
    customerCode: "CUST-0002",
    fullName: "Meera Sharma",
    phonePrimary: "9876543210",
    address: "Sector 29, Gurugram",
    notes: "Alteration-only customer.",
    preferredCommunication: "Phone",
    tags: ["Alteration"],
    createdAt: "2026-06-22T09:00:00Z",
    updatedAt: "2026-06-22T09:00:00Z"
  }
];

const blouseTemplate = MEASUREMENT_TEMPLATES[0];

const measurements: MeasurementValue[] = blouseTemplate.fields.slice(0, 12).map((field, index) => ({
  id: `measure-${index + 1}`,
  templateId: blouseTemplate.id,
  fieldKey: field.fieldKey,
  displayCode: field.displayCode,
  displayLabel: field.displayLabel,
  value: ["14", "36", "32", "38", "7.5", "14", "12", "10.5", "8", "2", "15", "1"][index],
  unit: "in",
  notes: index === 0 ? "Keep front length exact" : undefined,
  sortOrder: index + 1
}));

const paymentOne: Payment = {
  id: "pay-1",
  orderId: "order-1",
  amountPaise: rupeesToPaise(1500),
  method: "UPI",
  paymentReference: "UPI-2451",
  paidAt: "2026-07-01T06:00:00Z",
  notes: "Advance at booking"
};

const orderOneItems = [
  {
    id: "item-1",
    garmentType: "Blouse",
    quantity: 2,
    ratePaise: rupeesToPaise(1350),
    discountPaise: rupeesToPaise(100),
    stitchingCostPaise: rupeesToPaise(500),
    fabricPricePaise: 0,
    dyePricePaise: 0,
    extraCostPaise: 0,
    extraCosts: [],
    lineTotalPaise: rupeesToPaise(3100),
    fabricLength: "2.5 m",
    delivered: false,
    fabricColor: "Maroon silk",
    designReference: "Back deep neck with potli buttons",
    stitchingInstructions: "Princess cut, padded, lining required",
    sortOrder: 1
  },
  {
    id: "item-2",
    garmentType: "Saree Fall/Pico",
    quantity: 1,
    ratePaise: rupeesToPaise(250),
    discountPaise: 0,
    stitchingCostPaise: 0,
    fabricPricePaise: 0,
    dyePricePaise: 0,
    extraCostPaise: 0,
    extraCosts: [],
    lineTotalPaise: rupeesToPaise(250),
    fabricLength: "Saree",
    delivered: true,
    fabricColor: "Cream saree",
    stitchingInstructions: "Matching thread",
    sortOrder: 2
  }
];

const orderOneTotals = calculateOrderTotals({
  items: orderOneItems,
  orderDiscountPaise: rupeesToPaise(50),
  cgstRate: STORE_SETTINGS.defaultCgstRate,
  sgstRate: STORE_SETTINGS.defaultSgstRate,
  payments: [paymentOne]
});

export const orders: OrderWithCustomer[] = [
  {
    id: "order-1",
    receiptNumber: formatReceiptNumber({ prefix: "SJD", year: 2026, sequence: 1 }),
    customerId: "cust-1",
    customer: customers[0],
    status: "In Stitching",
    priority: "Urgent",
    orderDate: "2026-07-01",
    deliveryDate: "2026-07-05",
    assignedTailor: "Sajida",
    clothSampleImageUrl: undefined,
    internalNotes: "Customer wants trial call before final hemming.",
    customerNotes: "Please collect after 4 PM.",
    items: orderOneItems,
    measurements,
    payments: [paymentOne],
    statusHistory: [
      {
        id: "hist-1",
        toStatus: "New",
        changedAt: "2026-07-01T06:00:00Z",
        changedBy: "Seed Admin",
        notes: "Order created"
      },
      {
        id: "hist-2",
        fromStatus: "New",
        toStatus: "In Stitching",
        changedAt: "2026-07-01T07:30:00Z",
        changedBy: "Seed Admin"
      }
    ],
    totals: orderOneTotals,
    createdAt: "2026-07-01T06:00:00Z",
    updatedAt: "2026-07-01T07:30:00Z"
  },
  {
    id: "order-2",
    receiptNumber: formatReceiptNumber({ prefix: "SJD", year: 2026, sequence: 2 }),
    customerId: "cust-2",
    customer: customers[1],
    status: "Ready",
    priority: "Normal",
    orderDate: "2026-06-25",
    deliveryDate: "2026-07-01",
    assignedTailor: "Workshop",
    items: [
      {
        id: "item-3",
        garmentType: "Alteration",
        quantity: 3,
        ratePaise: rupeesToPaise(300),
        discountPaise: 0,
        stitchingCostPaise: 0,
        fabricPricePaise: 0,
        dyePricePaise: 0,
        extraCostPaise: 0,
        extraCosts: [],
        lineTotalPaise: rupeesToPaise(900),
        fabricLength: "NA",
        delivered: false,
        stitchingInstructions: "Sleeve shortening and side fitting",
        sortOrder: 1
      }
    ],
    measurements: measurements.slice(0, 6),
    payments: [],
    statusHistory: [
      {
        id: "hist-3",
        toStatus: "New",
        changedAt: "2026-06-25T08:00:00Z",
        changedBy: "Seed Staff"
      },
      {
        id: "hist-4",
        fromStatus: "In Stitching",
        toStatus: "Ready",
        changedAt: "2026-06-30T12:00:00Z",
        changedBy: "Seed Staff"
      }
    ],
    totals: calculateOrderTotals({
      items: [{ quantity: 3, ratePaise: rupeesToPaise(300), discountPaise: 0, stitchingCostPaise: 0, extraCostPaise: 0 }],
      cgstRate: 2.5,
      sgstRate: 2.5
    }),
    createdAt: "2026-06-25T08:00:00Z",
    updatedAt: "2026-06-30T12:00:00Z"
  }
];

export function getDashboardSummary(today = new Date("2026-07-01T12:00:00+05:30")): DashboardSummary {
  const todayKey = todayISO(today);
  return {
    ordersToday: orders.filter((order) => order.orderDate === todayKey).length,
    deliveriesToday: orders.filter((order) => order.deliveryDate === todayKey).length,
    pendingOrders: orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length,
    overdueOrders: orders.filter((order) => isOrderOverdue(order.deliveryDate, order.status, today)).length,
    amountCollectedTodayPaise: orders.flatMap((order) => order.payments).reduce((sum, payment) => sum + payment.amountPaise, 0),
    totalOutstandingPaise: orders.reduce((sum, order) => sum + Math.max(0, order.totals.balanceDuePaise), 0)
  };
}

export function getOrdersWithOverdueMeta(today = new Date("2026-07-01T12:00:00+05:30")) {
  return orders.map((order) => ({
    ...order,
    overdue: isOrderOverdue(order.deliveryDate, order.status, today),
    daysOverdue: daysOverdue(order.deliveryDate, order.status, today)
  }));
}
