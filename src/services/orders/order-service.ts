import { getOrdersWithOverdueMeta, orders } from "@/lib/data/mock";
import { daysOverdue, isOrderOverdue } from "@/lib/calculations/order";
import { hasSupabaseAdminEnv, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import { rupeesToPaise } from "@/lib/utils/money";
import type {
  Customer,
  MeasurementValue,
  OrderItem,
  OrderStatus,
  OrderWithCustomer,
  Payment,
  PaymentMethod,
  Priority,
  StatusHistoryEntry
} from "@/types/domain";

export interface OrderFilters {
  query?: string;
  status?: OrderStatus | "All";
}

interface SupabaseCustomerRecord {
  id: string;
  customer_code: string | null;
  full_name: string;
  phone_primary: string;
  phone_secondary: string | null;
  email: string | null;
  address: string | null;
  birth_date: string | null;
  notes: string | null;
  preferred_communication: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface SupabaseOrderItemRecord {
  id: string;
  garment_type: string;
  custom_garment_type: string | null;
  quantity: string | number;
  rate: string | number;
  discount_amount: string | number;
  stitching_cost?: string | number | null;
  line_total: string | number;
  fabric_length: string | null;
  delivered: boolean | null;
  delivered_at: string | null;
  fabric_color: string | null;
  design_reference: string | null;
  stitching_instructions: string | null;
  sort_order: number;
}

interface SupabaseMeasurementRecord {
  id: string;
  order_item_id: string | null;
  template_id: string | null;
  field_key: string;
  display_code: string;
  display_label: string;
  value: string;
  unit: string;
  notes: string | null;
  sort_order: number;
}

interface SupabasePaymentRecord {
  id: string;
  order_id: string;
  amount: string | number;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  paid_at: string;
  notes: string | null;
}

interface SupabaseStatusHistoryRecord {
  id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  created_at: string;
  notes: string | null;
}

interface SupabaseOrderRecord {
  id: string;
  receipt_number: string | null;
  customer_id: string;
  status: OrderStatus;
  priority: Priority;
  order_date: string;
  delivery_date: string;
  assigned_tailor_name: string | null;
  cloth_sample_image_url: string | null;
  subtotal: string | number;
  item_discount_total: string | number;
  order_discount_amount: string | number;
  accessories_cost?: string | number | null;
  stitching_cost?: string | number | null;
  taxable_amount: string | number;
  cgst_rate: string | number;
  cgst_amount: string | number;
  sgst_rate: string | number;
  sgst_amount: string | number;
  grand_total: string | number;
  advance_paid: string | number;
  balance_due: string | number;
  payment_status: "Unpaid" | "Partial" | "Paid" | "Credit";
  internal_notes: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  customer: SupabaseCustomerRecord;
  items: SupabaseOrderItemRecord[];
  measurements: SupabaseMeasurementRecord[];
  payments: SupabasePaymentRecord[];
  status_history: SupabaseStatusHistoryRecord[];
}

function moneyToPaise(value: string | number) {
  return rupeesToPaise(Number(value));
}

function mapCustomer(record: SupabaseCustomerRecord): Customer {
  return {
    id: record.id,
    customerCode: record.customer_code ?? record.id.slice(0, 8),
    fullName: record.full_name,
    phonePrimary: record.phone_primary,
    phoneSecondary: record.phone_secondary ?? undefined,
    email: record.email ?? undefined,
    address: record.address ?? undefined,
    birthDate: record.birth_date ?? undefined,
    notes: record.notes ?? undefined,
    preferredCommunication: record.preferred_communication === "Email" ? "Email" : "WhatsApp",
    tags: Array.isArray(record.tags) ? record.tags : [],
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

function mapOrder(record: SupabaseOrderRecord): OrderWithCustomer {
  const payments: Payment[] = record.payments.map((payment) => ({
    id: payment.id,
    orderId: payment.order_id,
    amountPaise: moneyToPaise(payment.amount),
    method: payment.payment_method,
    paymentReference: payment.payment_reference ?? undefined,
    paidAt: payment.paid_at,
    notes: payment.notes ?? undefined
  }));
  const totalPaidPaise = payments.reduce((sum, payment) => sum + payment.amountPaise, 0);

  return {
    id: record.id,
    receiptNumber: record.receipt_number ?? undefined,
    customerId: record.customer_id,
    customer: mapCustomer(record.customer),
    status: record.status,
    priority: record.priority,
    orderDate: record.order_date,
    deliveryDate: record.delivery_date,
    assignedTailor: record.assigned_tailor_name ?? undefined,
    clothSampleImageUrl: record.cloth_sample_image_url ?? undefined,
    internalNotes: record.internal_notes ?? undefined,
    customerNotes: record.customer_notes ?? undefined,
    items: record.items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map<OrderItem>((item) => ({
        id: item.id,
        garmentType: item.garment_type,
        customGarmentType: item.custom_garment_type ?? undefined,
        quantity: Number(item.quantity),
        ratePaise: moneyToPaise(item.rate),
        discountPaise: moneyToPaise(item.discount_amount),
        stitchingCostPaise: moneyToPaise(item.stitching_cost ?? 0),
        lineTotalPaise: moneyToPaise(item.line_total),
        fabricLength: item.fabric_length ?? undefined,
        delivered: Boolean(item.delivered),
        deliveredAt: item.delivered_at ?? undefined,
        fabricColor: item.fabric_color ?? undefined,
        designReference: item.design_reference ?? undefined,
        stitchingInstructions: item.stitching_instructions ?? undefined,
        sortOrder: item.sort_order
      })),
    measurements: record.measurements
      .sort((a, b) => a.sort_order - b.sort_order)
      .map<MeasurementValue>((measurement) => ({
        id: measurement.id,
        orderItemId: measurement.order_item_id ?? undefined,
        templateId: measurement.template_id ?? undefined,
        fieldKey: measurement.field_key,
        displayCode: measurement.display_code,
        displayLabel: measurement.display_label,
        value: measurement.value,
        unit: measurement.unit,
        notes: measurement.notes ?? undefined,
        sortOrder: measurement.sort_order
      })),
    payments,
    statusHistory: record.status_history.map<StatusHistoryEntry>((entry) => ({
      id: entry.id,
      fromStatus: entry.from_status ?? undefined,
      toStatus: entry.to_status,
      changedAt: entry.created_at,
      changedBy: "System",
      notes: entry.notes ?? undefined
    })),
    totals: {
      subtotalPaise: moneyToPaise(record.subtotal),
      itemDiscountTotalPaise: moneyToPaise(record.item_discount_total),
      orderDiscountPaise: moneyToPaise(record.order_discount_amount),
      accessoriesCostPaise: moneyToPaise(record.accessories_cost ?? 0),
      stitchingCostPaise: moneyToPaise(record.stitching_cost ?? 0),
      taxableAmountPaise: moneyToPaise(record.taxable_amount),
      cgstRate: Number(record.cgst_rate),
      cgstAmountPaise: moneyToPaise(record.cgst_amount),
      sgstRate: Number(record.sgst_rate),
      sgstAmountPaise: moneyToPaise(record.sgst_amount),
      grandTotalPaise: moneyToPaise(record.grand_total),
      totalPaidPaise,
      balanceDuePaise: moneyToPaise(record.balance_due),
      paymentStatus: record.payment_status
    },
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

async function fetchSupabaseOrders() {
  if (!hasSupabaseAdminEnv()) return undefined;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      `
      *,
      customer:customers(*),
      items:order_items(*),
      measurements:order_measurements(*),
      payments(*),
      status_history:order_status_history(*)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingSupabaseSchemaError(error)) return undefined;
    throw new Error(error.message);
  }

  return (data as unknown as SupabaseOrderRecord[]).map(mapOrder);
}

export async function listOrders(filters: OrderFilters = {}) {
  const sourceOrders = (await fetchSupabaseOrders()) ?? getOrdersWithOverdueMeta();
  const normalized = filters.query?.trim().toLowerCase();
  return sourceOrders
    .map((order) => ({
      ...order,
      overdue: isOrderOverdue(order.deliveryDate, order.status),
      daysOverdue: daysOverdue(order.deliveryDate, order.status)
    }))
    .filter((order) => {
      const statusMatch = !filters.status || filters.status === "All" || order.status === filters.status;
      const queryMatch =
        !normalized ||
        order.receiptNumber?.toLowerCase().includes(normalized) ||
        order.customer.fullName.toLowerCase().includes(normalized) ||
        order.customer.phonePrimary.includes(normalized);
      return statusMatch && queryMatch;
    });
}

export async function getOrderById(id: string) {
  const sourceOrders = (await fetchSupabaseOrders()) ?? getOrdersWithOverdueMeta();
  return sourceOrders
    .map((order) => ({
      ...order,
      overdue: isOrderOverdue(order.deliveryDate, order.status),
      daysOverdue: daysOverdue(order.deliveryDate, order.status)
    }))
    .find((order) => order.id === id);
}

export async function getRecentOrders(limit = 5) {
  const sourceOrders = (await fetchSupabaseOrders()) ?? orders;
  return [...sourceOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function getOrdersDueToday(today = "2026-07-01") {
  const sourceOrders = (await fetchSupabaseOrders()) ?? orders;
  return sourceOrders.filter((order) => order.deliveryDate === today && !["Delivered", "Cancelled"].includes(order.status));
}

export async function getUpcomingDeliveries(today = "2026-07-01") {
  const sourceOrders = (await fetchSupabaseOrders()) ?? orders;
  return sourceOrders.filter((order) => order.deliveryDate >= today && !["Delivered", "Cancelled"].includes(order.status));
}
